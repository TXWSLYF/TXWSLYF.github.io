---
layout: post
title: 'github中的gh-pages分支'
date: 2018-09-17
author: 卢宇峰
color: rgb(255,210,32)
cover: 'http://on2171g4d.bkt.clouddn.com/jekyll-banner.png'
tags: github gh-pages
---

# github中gh-pages分支

最近看到很多的项目中都有一个叫做gh-pages的分支，了解了之后才知道这个分支是用来存放项目的展示文件的分支。

我们都知道github提供了一个叫做github pages的功能，可以非常方便的搭建静态网站。通过新建一个名为`username.github.io`的仓库，并开启github pages功能，我们就可以通过`username.github.io`域名访问我们的静态资源。但是如果我们在其它仓库也有需要展示的页面那该怎么办呢？一个比较麻烦的办法是我们将其它仓库中需要展示的文件直接复制到`user.github.io`仓库之中然后提交到远程分支，但是github提供了一种更加方便的办法，那就是`gh-pages`分支。以我的github为例，我现在有一个叫做`calculator`的仓库，仓库的`gh-pages`分支下有一个`index.html`文件，当我访问[https://txwslyf.github.io/calculator/index.html](https://txwslyf.github.io/calculator/index.html)时，我就能直接访问该仓库`gh-pages`下的静态资源。