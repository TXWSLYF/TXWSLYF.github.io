/**
 * Created by Alex on 2017/3/7.
 */
function game2048(container)    //使用构造函数方法创建了一个对象模版game2048
{
    this.container = container;  //定义对象的container属性
    this.tiles = new Array(16);  //定义对象的tiles属性并为其初始化
    this.score=0;
    this.bestScore=0;
}

game2048.prototype = {
    init: function(){               //初始化函数
        for(var i = 0, len = this.tiles.length; i < len; i++){
            var tile = this.newTile(0);           //创建变量tile为将要添加的块
            tile.setAttribute('index', i);         //为tile添加index属性
            this.container.appendChild(tile);    //将这个新建的块添加到文档中
            this.tiles[i] = tile;               //将各个tile保存到tiles数组之中
        }
        this.randomTile();                 //初始化两个div为2或者4
        this.randomTile();
    },
    newTile: function(val){                         //创建新的tile
        var tile = document.createElement('div');   //创建的div实例
        this.setTileVal(tile, val)
        return tile;
    },
    setTileVal: function(tile, val){           //用来为指定的tile赋值
        tile.className = 'tile tile' + val;     //为生成的div添加所属类
        tile.setAttribute('val', val);          //为生成的div添加val属性，用来代表这个div所显示的数字
        tile.innerHTML = val > 0 ? val : '';    //如果val大于0，则将其显示出来，否则显示
    },
    randomTile: function(){                  // 用来随机为val为0的div添加2或者4
        var zeroTiles = [];                    //定义的一个空的数组
        for(var i = 0, len = this.tiles.length; i < len; i++){
            if(this.tiles[i].getAttribute('val') == 0){       //如果这个div的值为0,则将其添加到数组zeroTiles[]的后面
                zeroTiles.push(this.tiles[i]);
            }
        }
        var rTile = zeroTiles[Math.floor(Math.random() * zeroTiles.length)];//Math.floor(x),返回一个最接近但小于x的整数
        // Math.random(),无参，返回一个0-1之间的随机数
        this.setTileVal(rTile, Math.random() < 0.8 ? 2 : 4);        //向其中随机添加2或者4
    },
    move:function(direction){                                  //代码存在逻辑缺陷，如果一行或者一竖全为一个数字则会全部融合
        var j;
        switch(direction){
            case document.getElementById("up").getAttribute("val").toUpperCase():
                for(var i = 4, len = this.tiles.length; i < len; i++){
                    j = i;
                    while(j >= 4){
                        this.merge(this.tiles[j - 4], this.tiles[j]);
                        j -= 4;
                    }
                }
                break;
            case document.getElementById("down").getAttribute("val").toUpperCase():
                for(var i = 11; i >= 0; i--){
                    j = i;
                    while(j <= 11){
                        this.merge(this.tiles[j + 4], this.tiles[j]);
                        j += 4;
                    }
                }
                break;
            case document.getElementById("left").getAttribute("val").toUpperCase():
                for(var i = 1, len = this.tiles.length; i < len; i++){
                    j = i;
                    while(j % 4 != 0){
                        this.merge(this.tiles[j - 1], this.tiles[j]);
                        j -= 1;
                    }
                }
                break;
            case document.getElementById("right").getAttribute("val").toUpperCase():
                for(var i = 14; i >= 0; i--){
                    j = i;
                    while(j % 4 != 3){
                        this.merge(this.tiles[j + 1], this.tiles[j]);
                        j += 1;
                    }
                }
                break;
        }
        this.randomTile();
    },
    merge: function(prevTile, currTile){          //融合tile
        var prevVal = prevTile.getAttribute('val');
        var currVal = currTile.getAttribute('val');
        if(currVal != 0){
            if(prevVal == 0){
                this.setTileVal(prevTile, currVal);
                this.setTileVal(currTile, 0);
            }
            else if(prevVal == currVal){
                this.setTileVal(prevTile, prevVal * 2);
                this.setTileVal(currTile, 0);
                this.score+=prevVal*2;                             //计分
                if(this.score>=this.bestScore){
                    this.bestScore=this.score;
                }
            }
        }
    },
    equal: function(tile1, tile2){
        return tile1.getAttribute('val') == tile2.getAttribute('val');
    },
    win: function(){
        for(var i = 0, len = this.tiles.length; i < len; i++){
            if(this.tiles[i].getAttribute('val') == 2048){
                return true;
            }
        }
    },
    over: function(){                                                 //判断游戏是否结束的三种情况
        for(var i = 0, len = this.tiles.length; i < len; i++){        //如果有一个tile的值为0游戏未结束
            if(this.tiles[i].getAttribute('val') == 0){
                return false;
            }
            if(i % 4 != 3){                                           //如果水平相等则未结束
                if(this.equal(this.tiles[i], this.tiles[i + 1])){
                    return false;
                }
            }
            if(i < 12){                                              //如果垂直相邻相等存在则未结束
                if(this.equal(this.tiles[i], this.tiles[i + 4])){
                    return false;
                }
            }
        }
        return true;
    },
    clean: function(){                                          //将所有“瓦片”内容初始化
        for(var i = 0, len = this.tiles.length; i < len; i++){
            this.tiles[i].setAttribute("class",'tile tile' + 0);
            this.tiles[i].setAttribute("val",0 );
            this.tiles[i].innerHTML="";
            this.tiles[i].setAttribute("index",i);
        }
        this.randomTile();
        this.randomTile();
    }
}

// 定义要用到的全局变量
var container ,reStartBtn , changeKeyBtn , retryBtn ,game ,upInput,downInput,leftInput,rightInput ;
function onKeyDown(e) {
    var keynum, keychar;
    keynum = e.keyCode;         //按下的按键的ASCII码
    keychar = String.fromCharCode(keynum);
    if(keynum!=9){             //防止回车键被写入
        this.setAttribute("val",keychar);
    }
    if(e.stopPropagation()){     //阻止键盘事件冒泡
        e.stopPropagation();
    }
    else {
        e.cancelBubble=true;
    }
}

window.onload = function(){
    container = document.getElementById('div2048');
    reStartBtn = document.getElementById("restart");
    changeKeyBtn = document.getElementById("change-key-char");
    retryBtn = document.getElementById("retry");
    upInput=document.getElementById("up");
    downInput=document.getElementById("down");
    leftInput=document.getElementById("left");
    rightInput=document.getElementById("right");
    upInput.addEventListener("keydown",onKeyDown,false);
    downInput.addEventListener("keydown",onKeyDown,false);
    leftInput.addEventListener("keydown",onKeyDown,false);
    rightInput.addEventListener("keydown",onKeyDown,false);
        game = new game2048(container);
        game.init();
    reStartBtn.onclick = function () {
        game.clean();                           //清空16个“瓦块”
        document.getElementById("game-over-message").style.display="none";    //将结束提示信息隐藏
        game.score=0;
        document.getElementById("score").innerHTML=game.score;
    }
    changeKeyBtn.onclick = function () {
        if(document.getElementById("change-input").style.display=="none"){
            document.getElementById("change-input").style.display="block"
        }
        else {
            document.getElementById("change-input").style.display="none";
        }
    }

    retryBtn.onclick = function () {                  //重试按键
        game.clean();
        document.getElementById("game-over-message").style.display="none";
        game.score=0;
        document.getElementById("score").innerHTML=game.score;
    }
}

window.onkeydown = function(e){                               //按键检测
    var keynum, keychar;
    var up,down,left,right;
    if(window.event){       // IE
        keynum = e.keyCode;
    }
    else if(e.which){       // Netscape/Firefox/Opera
        keynum = e.which;
    }
    keychar = String.fromCharCode(keynum);
    up=document.getElementById("up").getAttribute("val").toUpperCase();
    down=document.getElementById("down").getAttribute("val").toUpperCase();
    left=document.getElementById("left").getAttribute("val").toUpperCase();
    right=document.getElementById("right").getAttribute("val").toUpperCase();
    if([ up , down ,  left ,  right ].indexOf(keychar) > -1){
        game.move(keychar);
        document.getElementById("score").innerHTML=game.score;
        document.getElementById("best-score").innerHTML=game.bestScore;
        if(game.win()){
            document.getElementsByTagName("p").item(0).textContent="You Win!";           //将提示信息修改为获胜
            document.getElementById("game-over-message").style.display="block";         //获胜弹出提示框
            return;
        }
        if(game.over()){
            document.getElementsByTagName("p").item(0).textContent="Game Over!";        //将提示信息修改为失败
            document.getElementById("game-over-message").style.display="block";        //游戏结束，弹出结束提示重玩选项
            return;
        }
    }
}