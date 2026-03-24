/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "lightgallery/plugins/thumbnail" {
  import type { LightGallery } from "lightgallery/lightgallery";
  import type { LgQuery } from "lightgallery/lgQuery";

  const Thumbnail: new (instance: LightGallery, $LG: LgQuery) => any;
  export default Thumbnail;
}
