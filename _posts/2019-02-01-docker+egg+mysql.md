---
layout: post
title: 'docker+egg+mysql'
date: 2019-02-01
author: 卢宇峰
color: rgb(255,210,32)
tags: egg docker mysql
---

## docker+egg+mysql

#### docker 常用命令

1. docker image ls：列出本地镜像
2. docker ps：列出当前运行container
3. docker ps --all：列出所有的container
4. docker container ls：列出当前运行container 
5. docker container ls --all：列出所有的container
6. docker container exec -it [containerid] /bin/bash：进入某个容器，打开bash。
7. docker swarm join-token (worker|manager)：显示加入集群token
8. curl -XGET 127.0.0.1:5000/v2/_catalog：查看本地镜像列表
9. curl -XGET 127.0.0.1:5000/v2/image_name/tags/list：查看本地镜像版本列表



#### 遇到的问题

##### 1.mysql初始化

`docker run --name mysql -e MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -d mysql:5.7`，运行命令，可以启动mysql并监听3306端口，但是无法初始化数据库。解决办法是根据官方镜像自定义镜像。

1. 新建文件夹：`mkdir my-mysql`
2. 新建`Dockerfile`： `touch Dockerfile`
3. 新建`init.sql`：`touch init.sql`

两个文件内容分别如下：

1. Dockerfile

   ```dockerfile
   FROM mysql:5.7
   COPY ./init.sql /docker-entrypoint-initdb.d/init.sql
   ```

2. Init.sql

   ```sql
   -- 创建数据库
   DROP database IF EXISTS `webpack_build_stats`;
   create database `webpack_build_stats` default character set utf8 collate utf8_general_ci; 
   -- 切换到webpack_build_stats数据库
   use webpack_build_stats;
   -- 建表
   DROP TABLE IF EXISTS `stats_data`; 
   CREATE TABLE `stats_data` (
     `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
     `build_start_time` datetime DEFAULT NULL,
     `build_end_time` datetime DEFAULT NULL,
     `build_duration` int(11) DEFAULT NULL,
     `repository_address` varchar(1000) DEFAULT NULL,
     `build_user_name` varchar(1000) DEFAULT NULL,
     `webpack_version` char(11) DEFAULT NULL,
     `build_user_email` varchar(100) DEFAULT NULL,
     PRIMARY KEY (`id`)
   ) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;
   ```

这里说明一下`COPY ./init.sql /docker-entrypoint-initdb.d/init.sql`这行的作用，mysql运行前会执行`docker-entrypoint-initdb.d`z文件夹中的所有sql文件。

##### 2.egg如何连接到mysql

如果分别启动egg和mysql，会发现egg无法连接到mysql，因为每个container彼此之间都是隔离的，要使得container之间能够相互访问，需要使用docker link。

```shell
docker run --name my-mysql -e MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -d my-mysql:0.0.1
docker container run --link my-mysql:my-mysql --rm -p 7001:7001 -e DATABASE_HOST=my-mysql code-monitor-be:0.0.1


同时egg中的mysql配置也需要发生变化
host: process.env.DATABASE_HOST || '127.0.0.1',
```

这样也有一个麻烦的地方，那就是每次都需要启动两次container，这个时候就需要用到docker compose了。

顾名思义，compose就是组合的意思，即将多个容器组合在一起。

新建一个`docker-compose.yml`

```yml
my-mysql:
  image: my-mysql:0.0.1
  restart: always
  ports:
    - "3306:3306"
  environment:
    MYSQL_ROOT_PASSWORD: 123456
code-monitor-be:
  image: code-monitor-be:0.0.1
  ports:
    - "7001:7001"
  volumes:
     - ${HOME}/webpackChartData:/app/webpackChartData
  environment:
    DATABASE_HOST: my-mysql
  links:
    - my-mysql
```

在当前目录下执行`docker-compose up`就可以同时启动两个容器了。

但这种方式有一个问题，就是egg的启动依赖于mysql先启动，所以就会存在egg启动的时候mysql还没有启动完成，导致egg启动失败。



#### 参考资料

1. [阮一峰docker微服务入门](http://www.ruanyifeng.com/blog/2018/02/docker-wordpress-tutorial.html)
2. [mysql执行外部sql文件](https://blog.csdn.net/vebasan/article/details/7619911)
3. [docker-compose 启动顺序](https://www.jianshu.com/p/9446f210e327)
4. [通过做一个基于 Node 的微服务器来学习 Docker](https://juejin.im/entry/577a70eac4c97100557b9c5e)
5. [Docker Hub MySQL官方镜像实现首次启动后初始化库表](https://yov.oschina.io/article/%E5%AE%B9%E5%99%A8/Docker/Docker%20Hub%20mysql%E5%AE%98%E6%96%B9%E9%95%9C%E5%83%8F%E5%AE%9E%E7%8E%B0%E9%A6%96%E6%AC%A1%E5%90%AF%E5%8A%A8%E5%90%8E%E5%88%9D%E5%A7%8B%E5%8C%96%E5%BA%93%E8%A1%A8/)











