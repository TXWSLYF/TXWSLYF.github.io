---
layout: post
title: 'CommonJS和ES6模块化的区别'
date: 2019-04-16
author: 卢宇峰
color: rgb(255,210,32)
tags: CommonJS ES6 模块化
---

### 一、两点差异

ES6和CommonJS主要有以下的两点不同：

1. CommonJS 模块输出的是一个值的浅拷贝，ES6 模块输出的是值的引用。

2. CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。

   

首先解释第一点，看下面一段代码：

```js
// a.js
let { count, increase } = require('./b');

console.log('entry-a.js')
console.log(count);
increase();
console.log(count);

// b.js
console.log('entry-b.js')
let count = 1;
function increase() {
  count++;
}
module.exports = {
  count,
  increase,
};

// 输出结果
entry-b.js
entry-a.js
1
1
```

上面的输出结果表明，b.js模块加载之后，其内部值的变化不会对外部造成影响，所以当a.js中调用了increase方法后，count的值依然没有变化，这是因为count是一个**基本类型**的值，CommonJS输出的是值的浅拷贝。

看另外一种写法：

```js
// a.js
let { count, increase } = require('./b');

console.log('entry-a.js')
console.log(count());
increase();
console.log(count());

// b.js
let count = 1;
function increase() {
  count++;
}
console.log('entry-b.js');
module.exports = {
  count() {
    return count;
  },
  increase,
};

// 输出结果
entry-b.js
entry-a.js
1
2
```

上面的代码中，b.js导出的count变成了一个取值的函数，这个时候重新执行a.js，就可以正确的读取内部的count的值了。

ES6的模块化的机制和CommonJS完全不同，JS 引擎对脚本静态分析的时候，遇到模块加载命令`import`，就会生成一个只读引用。等到脚本真正执行时，再根据这个只读引用，到被加载的那个模块里面去取值。换句话说，ES6 的`import`有点像 Unix 系统的“符号连接”，原始值变了，`import`加载的值也会跟着变。因此，ES6 模块是动态引用，并且不会缓存值，模块里面的变量绑定其所在的模块。

看下面一个例子：

```js
// a.mjs
import { count, increase } from './b';
console.log('entry-a.mjs');

console.log(count);
increase();
console.log(count);

// b.mjs
console.log('entry-b.mjs');

export let count = 1;
export function increase() {
  count++;
}

// 运行node --experimental-modules a.mjs，输出下面的结果
entry-b.mjs
entry-a.mjs
1
2
```

上面代码表明，ES6模块输入的变量count是活的，完全反映其模块内部的变化。



### 二、参考链接

1. [ES6-模块与-CommonJS-模块的差异](http://es6.ruanyifeng.com/#docs/module-loader#ES6-%E6%A8%A1%E5%9D%97%E4%B8%8E-CommonJS-%E6%A8%A1%E5%9D%97%E7%9A%84%E5%B7%AE%E5%BC%82)

2. [import和require的区别](http://es6.ruanyifeng.com/#docs/module)

3. [JS 中的require 和 import 区别](https://www.cnblogs.com/linziwei/p/7853305.html)

   

