---
layout: post
title: 'Media Source Extensions(媒体源扩展)'
date: 2018-09-26
author: 卢宇峰
color: rgb(255,210,32)
# photos: 'http://on2171g4d.bkt.clouddn.com/jekyll-banner.png'
categories: [MSE]
tags: mediaSource
---

# Media Source Extensions(媒体源扩展)

媒体源扩展 API（MSE） 提供了实现无插件且基于 Web 的流媒体的功能。使用 MSE，媒体串流能够通过 JavaScript 创建，并且能通过使用 [audio](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/audio) 和 [video](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video) 元素进行播放。

## 背景

近年来，我们已经可以在Web应用程序上无插件的播放视频和音频了。通过一个简单的video标签或者audio标签，同时指定标签的src属性，我们就可以非常方便的播放视频和音频。但是这种架构过于简单，只能满足一次播放整个曲目的需求，无法直接操纵视频流，无法实现拆分/合并数个缓冲文件。

## MSE标准

媒体源扩展（MSE）使得我们可以把通常的单个的媒体文件的src值替换为引用`MediaSource`对象（一个包含即将播放的媒体文件的准备状态等信息的容器），以及引用多个`SourceBuffer`对象（代表多个组成整个串流的不同媒体块）的元素。

## MediaSource的简单使用

首先我们需要判断浏览器是否支持`MediaSource`对象。

```javascript
  if ('MediaSource' in window)
```

如果浏览器支持`MediaSource`，我们就可以新建一个`MediaSource`对象，并且将`MediaSource`作为objectURL附加到video标签上：

```javascript
let video = document.getElementById('video')
let mediaSource = new MediaSource()
let video.src = URL.createObjectURL(mediaSource) // 这一步就是将mediaSource和video之间建立连接
```

连接建立之后，我们需要监听`mediaSource`的`sourceopen`事件，并设置回调函数：

```javascript
mediaSource.addEventListener('sourceopen', sourceOpen)
function sourceOpen () {
    ......
}
```

在`sourceOpen`函数当中，我们又会使用到一个叫做`SourceBuffer`的对象，这个对象提供了一系列的接口，这里用到的是`appendBuffer`方法，这个方法可以动态的向`MediaSource`中添加视频/音频片段（对于一个MediaSource，可以同时存在多个SourceBuffer）

```javascript
function sourceOpen (e) {
    URL.revokeObjectURL(video.src)
    let mediaSource = this
    let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    let sourceBuffer = mediaSource.addSourceBuffer(mime)
    console.log(this.readyState)
    let videoUrl = `test.mp4`
    fetchAB(videoUrl, function (buf) {
        sourceBuffer.addEventListener('updateend', function () {
            mediaSource.endOfStream()
            video.play()
        })
        sourceBuffer.appendBuffer(buf)
    })
}

function fetchAB (url, cb) {
    var xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function () {
        cb(xhr.response)
    }
    xhr.send()
}

```

以上这些代码就是一个最简化的MSE的使用方式了，整个流程可以用下面这张图片来概括：

![1](/assets/post/2018-09-26/1.png)

1. 第一步，通过异步请求拉取数据。

2. 第二步，将数据交由 `MediaSource` 处理。

3. 第三步，`MediaSource`将数据流交给 audio/video 标签进行播放。

而中间传递的数据都是通过Buffer的形式来传递的。

![2](/assets/post/2018-09-26/2.png)

## 实践中的一些坑

### 1、URL.revokeObjectURL

`mediaSource` 的实例通过 `URL.createObjectURL()` 创建的 url 并不会同步连接到 video.src。换句话说， `URL.createObjectURL() `只是充当将底层的流（`mediaSource`）和 video.src 二者连接的中间方，一旦两者连接到一起之后，该对象就没用了。 那么什么时候 `mediaSource` 才会和 video.src 连接到一起呢？ 创建实例都是同步的，但是底层流和 video.src 的连接时异步的。`mediaSource` 提供了一个` sourceopen` 事件给我们进行这项异步处理。一旦连接到一起之后，该 URL object 就没用了，处于内存节省的目的，可以使用 `URL.revokeObjectURL(videoElement.src)` 销毁指定的 URL object。

### 2、mime字符串

mime字符串就是指的下面这个东西，在新建`SourceBuffer`中会使用到：

```javascript
let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
let sourceBuffer = mediaSource.addSourceBuffer(mime)
```

那么这个字符串的作用是什么呢？

这个字符串决定了我们将以何种方式对获取到的视频/音频流进行编解码。要判断当前浏览器是否支持这中给定的MIME类型——这意味着是否可以成功的创建这个MIME类型的[`SourceBuffer`](https://developer.mozilla.org/zh-CN/docs/Web/API/SourceBuffer) 对象，可以使用`MediaSource.isTypeSupported()`方法，该方法返回一个Boolean值。

要获取我们要传输的视频的编解码方式，我们可以使用[`Bento4`](https://www.bento4.com/downloads/)这个工具获取我们的视频的编解码信息：

![3](/assets/post/2018-09-26/3.png)

### 3、fragmented MP4

要使用MSE来实现流媒体传输，对于视频的格式还有要求，必须为fragmented格式。要判断视频是否为fragmented格式，也可以用上述提到的[`Bento4`](https://www.bento4.com/downloads/)工具：

![4](/assets/post/2018-09-26/4.png)

要将非fragmented格式的视频转换为fragmented格式，可以使用`mp4fragment <inputfile> <outputfile>`命令。

1. [Fragmented MP4文件格式](https://blog.csdn.net/yu_yuan_1314/article/details/9289827)
2. [自适应流媒体传输（二）——为什么要使用fragmented MP4](https://blog.csdn.net/nonmarking/article/details/53439481)

## 参考文章

1. https://segmentfault.com/q/1010000013940342
2. [使用 MediaSource 搭建流式播放器](https://zhuanlan.zhihu.com/p/26374202)
3. [Media Source Extensions是如何完成视频流的加载和播放](http://www.cuplayer.com/player/PlayerCodeCourse/2017/06072953.html)
4. [MediaSource](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaSource)
5. [Media Source Extensions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Media_Source_Extensions_API)
6. [[What is a blob URL and why it is used?](https://stackoverflow.com/questions/30864573/what-is-a-blob-url-and-why-it-is-used)]

## 扩展阅读

1. [MIME笔记](http://www.ruanyifeng.com/blog/2008/06/mime.html)
2. [元数据（MetaData）](http://www.ruanyifeng.com/blog/2007/03/metadata.html)

