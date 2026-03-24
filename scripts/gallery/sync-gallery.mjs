#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createReadStream } from "node:fs";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SUPPORTED_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".tif",
  ".tiff",
]);

function readArg(name, fallback = undefined) {
  const flag = `--${name}`;
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v === undefined ? fallback : v;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function encodeKeyForUrl(key) {
  // Encode each path segment, but keep the slashes.
  return key.split("/").map(encodeURIComponent).join("/");
}

function getContentTypeByExt(ext) {
  const e = ext.toLowerCase();
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  if (e === ".gif") return "image/gif";
  if (e === ".tif" || e === ".tiff") return "image/tiff";
  return undefined;
}

async function walkImages(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkImages(full)));
      continue;
    }
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name).toLowerCase();
    if (!SUPPORTED_EXTS.has(ext)) continue;
    out.push(full);
  }
  return out;
}

async function mapLimit(items, limit, fn) {
  const ret = [];
  const executing = new Set();

  for (const item of items) {
    const p = (async () => fn(item))();
    ret.push(p);
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(ret);
}

function loadEnvFile(envFilePath) {
  // Minimal `.env` parser (KEY=VALUE). Supports comments and surrounding quotes.
  try {
    const txt = fssync.readFileSync(envFilePath, "utf-8");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

const envFile = readArg("envFile", ".env.gallery");
loadEnvFile(path.resolve(process.cwd(), envFile));

const photosDirArg =
  readArg("photosDir") ??
  process.env.GALLERY_PHOTOS_DIR ??
  process.env.PHOTOS_DIR;
if (!photosDirArg) {
  console.error(
    "Missing photos directory. Provide either `--photosDir /path/to/photos` or set `GALLERY_PHOTOS_DIR` in the env file."
  );
  process.exit(1);
}

const outArg = readArg("out", "src/content/gallery/gallery.json");
const photosDir = path.resolve(process.cwd(), photosDirArg);
const outPath = path.resolve(process.cwd(), outArg);

const thumbWidth = Number(readArg("thumbWidth", 1600));
let thumbFormat = readArg("thumbFormat", "webp").toLowerCase();
if (thumbFormat === "jpg") thumbFormat = "jpeg";

const thumbFileExt = thumbFormat === "jpeg" ? "jpg" : thumbFormat;
const thumbOutputFormat = thumbFormat;
const concurrency = Number(readArg("concurrency", 4));

const r2OriginalPrefix = readArg("r2OriginalPrefix", "gallery/originals");
const r2ThumbPrefix = readArg("r2ThumbPrefix", "gallery/thumbs");
const skipOriginalUpload = hasFlag("skipOriginalUpload");

const r2Bucket = process.env.R2_BUCKET;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT;
let r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

if (!skipOriginalUpload) {
  if (!r2Bucket || !r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint) {
    console.error(
      "Missing R2 env vars. Required: R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT"
    );
    process.exit(1);
  }
} else {
  // We still need env vars for thumbnail upload.
  if (!r2Bucket || !r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint) {
    console.error(
      "Missing R2 env vars for thumbnail upload. Required: R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT"
    );
    process.exit(1);
  }
}

if (!r2PublicBaseUrl) {
  console.error(
    "Missing R2_PUBLIC_BASE_URL. This script requires it so generated originalUrl/thumbnailUrl are publicly accessible.\n" +
      "Example: https://<bucket>.<accountId>.r2.cloudflarestorage.com"
  );
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: r2Endpoint,
  region: "auto",
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
  forcePathStyle: true,
});

const cacheDir = path.resolve(process.cwd(), ".gallery-cache");
await fs.mkdir(cacheDir, { recursive: true });

let existing = { items: [] };
try {
  const txt = await fs.readFile(outPath, "utf-8");
  existing = JSON.parse(txt);
} catch {
  // ignore - first run
}

const existingItems = Array.isArray(existing?.items) ? existing.items : [];
const byRelativePath = new Map(
  existingItems.map(item => [String(item.relativePath ?? ""), item])
);

const thumbConfig = {
  thumbWidth,
  thumbFormat: thumbOutputFormat,
  r2OriginalPrefix,
  r2ThumbPrefix,
};

const files = await walkImages(photosDir);
if (files.length === 0) {
  console.warn(`No supported images found under: ${photosDir}`);
}

const contentHashForUrlConfig = `${thumbWidth}-${thumbFormat}-${r2ThumbPrefix}`;

const results = await mapLimit(files, concurrency, async filePath => {
  const rel = path.relative(photosDir, filePath);
  const relativePathPosix = toPosix(rel);
  const ext = path.extname(filePath);
  const originalName = path.basename(filePath);

  const stat = await fs.stat(filePath);
  const mtimeMs = stat.mtimeMs;
  const size = stat.size;

  const relativeNoExt = relativePathPosix.slice(
    0,
    relativePathPosix.length - ext.length
  );

  const originalKey = `${r2OriginalPrefix}/${relativePathPosix}`;
  const thumbnailKey = `${r2ThumbPrefix}/${thumbWidth}w/${relativeNoExt}.${thumbFileExt}`;

  const publicOriginalUrl =
    r2PublicBaseUrl + "/" + encodeKeyForUrl(originalKey);
  const publicThumbUrl = r2PublicBaseUrl + "/" + encodeKeyForUrl(thumbnailKey);

  const existingEntry = byRelativePath.get(relativePathPosix);

  const needMeta =
    !existingEntry ||
    existingEntry.mtimeMs !== mtimeMs ||
    existingEntry.size !== size ||
    existingEntry.width == null ||
    existingEntry.height == null;

  let width = existingEntry?.width ?? null;
  let height = existingEntry?.height ?? null;
  if (needMeta) {
    const meta = await sharp(filePath).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  }

  const needOriginalUpload =
    !skipOriginalUpload &&
    (!existingEntry ||
      existingEntry.mtimeMs !== mtimeMs ||
      existingEntry.size !== size ||
      existingEntry.originalKey !== originalKey);

  const needThumbUpload =
    !existingEntry ||
    existingEntry.mtimeMs !== mtimeMs ||
    existingEntry.size !== size ||
    existingEntry.thumbnailKey !== thumbnailKey ||
    existingEntry.thumbConfigKey !== contentHashForUrlConfig;

  // Upload original (optional)
  if (needOriginalUpload) {
    const contentType = getContentTypeByExt(ext);
    const putParams = {
      Bucket: r2Bucket,
      Key: originalKey,
      Body: createReadStream(filePath),
      CacheControl: "max-age=0, must-revalidate",
    };
    if (contentType) putParams.ContentType = contentType;
    await s3.send(
      new PutObjectCommand({
        ...putParams,
      })
    );
  }

  // Generate + upload thumbnail
  if (needThumbUpload) {
    const thumbLocalPath = path.join(
      cacheDir,
      "thumbnails",
      `${thumbWidth}w`,
      `${relativeNoExt}.${thumbFileExt}`
    );
    await fs.mkdir(path.dirname(thumbLocalPath), { recursive: true });

    // Resize while preserving aspect ratio, no enlargement.
    await sharp(filePath)
      .resize({ width: thumbWidth, withoutEnlargement: true, fit: "inside" })
      .toFormat(thumbOutputFormat)
      .toFile(thumbLocalPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: thumbnailKey,
        Body: fssync.createReadStream(thumbLocalPath),
        ContentType:
          thumbOutputFormat === "jpeg"
            ? "image/jpeg"
            : `image/${thumbOutputFormat}`,
        CacheControl: "max-age=0, must-revalidate",
      })
    );
  }

  // If we skipped thumbnail upload but we had existing entry, keep URLs from existing.
  const baseEntry = existingEntry ?? {
    originalName,
    relativePath: relativePathPosix,
  };

  return {
    ...baseEntry,
    originalName,
    relativePath: relativePathPosix,
    width,
    height,
    mtimeMs,
    size,
    thumbConfigKey: contentHashForUrlConfig,
    thumbConfig: { thumbWidth, thumbFormat: thumbOutputFormat },
    originalKey,
    thumbnailKey,
    originalUrl: publicOriginalUrl,
    thumbnailUrl: publicThumbUrl,
  };
});

const nextItems = results
  .filter(Boolean)
  // Keep stable ordering: newest first.
  .sort((a, b) => (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0));

const nextJson = {
  generatedAt: new Date().toISOString(),
  thumbConfig,
  items: nextItems,
};

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, JSON.stringify(nextJson, null, 2), "utf-8");

console.log(
  `Gallery sync done. photos=${files.length}, out=${outPath}, thumbsWidth=${thumbWidth}`
);

