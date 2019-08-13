---
layout: post
title: 'egg-mysql插入emoji报错'
date: 2019-04-30
author: 卢宇峰
color: rgb(255,210,32)
tags: mysql
---

在用egg-mysql插件向数据库中添加记录时，报了一个类似于下面的错误：

```sql
sqlMessage: "Incorrect string value: '\\xF0\\x9F\\x98\\x80\",...' for column 'wx_json' at row 1";
```

原因是utf8编码不支持4个字节的emoji表情，可以将字符编码设置为utf8mb4。

如何查看数据库编码：`SHOW VARIABLES WHERE Variable_name LIKE 'character_set_%' OR Variable_name LIKE 'collation%';`

返回如下：







### 参考链接

1. [eggjs在使用egg-mysql插入emoj表情出错解决](https://www.jianshu.com/p/54760f8ad217)
2. [MySql数据库中文字符乱码问题之set names utf8](https://blog.csdn.net/zhaojunjie_dream/article/details/79979672)
3. [character_set_database和character_set_server](https://blog.csdn.net/yabingshi_tech/article/details/47154251)
4. [http://www.fidding.me/article/43](http://www.fidding.me/article/43)