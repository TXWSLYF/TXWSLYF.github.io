/**
 * Created by Alex on 2017/4/14.
 */
//定义的全局变量
var fileInput = document.getElementById('getFile');                                        //获取<input type="file">元素
var annotationBox = document.getElementById('annotationBox');                             //获取annotationBox元素
var titleList = document.getElementById('titleList');                                  //获取titleList元素
var readFile = new FileReader();
var pattern = /(.+\))[^\d]+(\d+(?:-\d+)?).+(\|.+:\d+)(\s+[AM|PM]+)?(.+)?/;          //用来匹配注释的正则表达式
var titleArr = [];                                                                    //用来保存标题的数组
var annotationList = [];                                                             //用来保存所有注释的数组
window.onload = function () {
    fileInput.onchange = function () {                     //上传文件后触发的事件
        var i;                                             //定义的循环计数的变量
        var showAll;
        showAll = document.createElement('li');       //单独创建一个可以显示所有注释的标签
        showAll.innerHTML = '显示所有注释';
        showAll.onclick = selectAllAnnotation;         //为showAll标签绑定点击事件
        titleList.appendChild(showAll);
        for (i = 0; i < fileInput.files.length; i++) {
            var file = fileInput.files[i];
            readFile.readAsText(file);                 //以文本方式读取文件
            readFile.onload = function () {
                var j;
                var result;
                var annotationArr;
                result = readFile.result.replace(/[\f\n\r\t\u000B\u00A0\u2028\u2029\u21B5]+/g, "");//先将字符串中除了空格字符之外的所有空白字符删除(考虑到英文的问题，所以不可以删除空格符号)
                annotationArr = result.split(/={7,}/);         //获取数组形式的注释(=大于等于7个的时候才分割，避免注释其它部分出现少量等号而导致的错误分割的情况发生)
                deleteEmptyArr(annotationArr);                  //将数组中的空数组删除
                for (j = 0; j < annotationArr.length; j++) {
                    var k;
                    var information;                                                   //用来保存注释信息
                    var annotation = {};                                                  //用来保存单条注释信息
                    var title;          //用来保存标题
                    var author;         //用来保存作者
                    var position;       //用来保存位置信息
                    var time;           //完整的时间信息
                    var timeString;                                                     //未格式化的时间信息
                    var formatTime;                                                    //格式化的时间信息
                    var content;         //用来保存注释内容
                    information = annotationArr[j].match(pattern);
                    if (information == null) continue;                            //如果这条字符串不能匹配，则直接跳到下一条字符串
                    if (information[5] == undefined) continue;                   //如果注释的内容为空，则直接跳过该条注释
                    for (k = 1; k < information.length; k++) {                //从捕获的第一个分组开始判断
                        switch (k) {
                            case 1:
                                title = '《' + getTitle(information[1]).trim() + '》';
                                author = getAuthor(information[1]);
                                if (titleArr.indexOf(title) == (-1)) {             //如果新的标题不存在于标题数组之中
                                    var li;
                                    titleArr.push(title);                       //将新的标题添加到标题数组之中
                                    li = document.createElement('li');         //创建一个新的包含标题的li标签并且添加到列表当中
                                    li.innerHTML = title;
                                    li.onclick = selectMatchedAnnotation;    //为其添加点击事件    
                                    titleList.appendChild(li);              //将新标题添加到列表当中
                                }
                                break;
                            case 2:                  //位置信息保存在第二个捕获型分组中
                                position = information[2];
                                break;
                            case 3:                                                           //时间信息保存在第三个捕获型分组之中
                                timeString = getTimeString(information[3]);                        //对提取的时间信息进行进一步分析
                                break;
                            case 4:
                                if (information[4] != undefined) {                                 //第四个捕获型分组是用来捕获英文信息的上午或者下午的信息的
                                    formatTime = formatTimeString(timeString + information[4]);
                                }
                                else {
                                    formatTime = formatTimeString(timeString);
                                }
                                time = timeString + '——————' + formatTime;
                                break;
                            default:
                                content = information[5];
                                break;
                        }
                    }
                    annotation.title = title;                                //将信息都保存起来
                    annotation.author = author;
                    annotation.position = position;
                    annotation.time = time;
                    annotation.content = content;
                    annotationList.push(annotation);                    //将该条信息添加到注释数组中
                }
                selectAllAnnotation();
            };
        }
    };
};

function deleteEmptyArr(arr) {              //删除数组中的空数组
    var i;
    for (i = 0; i < arr.length; i++) {
        if (arr[i] == '') {
            arr.splice(i, 1);
        }
    }
}

function getTitle(str) {                    //考虑了包含作者的括号出现了括号的情况的处理函数
    var count = 0;
    var position = str.length - 1;
    while (true) {
        var i, j;
        i = str.lastIndexOf(')', position);
        j = str.lastIndexOf('(', position);
        if (i > j) {
            count++;
            position = i - 1;
        }
        else {
            count--;
            position = j - 1;
            if (count === 0) {
                break;
            }
        }
    }
    return str.slice(0, position + 1);
}

function getAuthor(str) {
    var count = 0;
    var position = str.length - 1;
    while (true) {
        var i, j;
        i = str.lastIndexOf(')', position);
        j = str.lastIndexOf('(', position);
        if (i > j) {
            count++;
            position = i - 1;
        }
        else {
            count--;
            position = j - 1;
            if (count === 0) {
                break;
            }
        }
    }
    return str.slice(position + 1);
}

function selectAllAnnotation() {
    var i;
    var annotationContainer;
    var titleContainer;
    var authorContainer;
    var positionContainer;
    var timeContainer;
    var contentContainer;
    annotationBox.innerHTML = '';                                         //先将annotationBox里边的内容全部删除
    for (i = 0; i < annotationList.length; i++) {
        titleContainer = document.createElement('h2');
        authorContainer = document.createElement('div');
        positionContainer = document.createElement('div');
        timeContainer = document.createElement('div');
        contentContainer = document.createElement('div');
        titleContainer.innerHTML = 'title：' + annotationList[i].title;
        authorContainer.innerHTML = 'author：' + annotationList[i].author;
        positionContainer.innerHTML = 'position：' + annotationList[i].position;
        timeContainer.innerHTML = 'time：' + annotationList[i].time;
        contentContainer.innerHTML = 'content：' + annotationList[i].content;
        annotationContainer = document.createElement('div');       //创建一个annotationContainer来容纳一条注释
        annotationContainer.className = 'annotationContainer';
        annotationContainer.appendChild(titleContainer);
        annotationContainer.appendChild(authorContainer);
        annotationContainer.appendChild(positionContainer);
        annotationContainer.appendChild(timeContainer);
        annotationContainer.appendChild(contentContainer);
        annotationBox.appendChild(annotationContainer);
    }
}

function selectMatchedAnnotation() {
    var i;
    var matchedTitle = this.innerHTML;
    var annotationContainer;
    var titleContainer;
    var authorContainer;
    var positionContainer;
    var timeContainer;
    var contentContainer;
    annotationBox.innerHTML = '';                   //先将annotationBox里边的内容全部删除
    for (i = 0; i < annotationList.length; i++) {
        if (annotationList[i].title == matchedTitle) {
            titleContainer = document.createElement('h2');
            authorContainer = document.createElement('div');
            positionContainer = document.createElement('div');
            timeContainer = document.createElement('div');
            contentContainer = document.createElement('div');
            titleContainer.innerHTML = 'title：' + annotationList[i].title;
            authorContainer.innerHTML = 'author：' + annotationList[i].author;
            positionContainer.innerHTML = 'position：' + annotationList[i].position;
            timeContainer.innerHTML = 'time：' + annotationList[i].time;
            contentContainer.innerHTML = 'content：' + annotationList[i].content;
            annotationContainer = document.createElement('div');       //创建一个annotationContainer来容纳一条注释
            annotationContainer.className = 'annotationContainer';
            annotationContainer.appendChild(titleContainer);
            annotationContainer.appendChild(authorContainer);
            annotationContainer.appendChild(positionContainer);
            annotationContainer.appendChild(timeContainer);
            annotationContainer.appendChild(contentContainer);
            annotationBox.appendChild(annotationContainer);
        }
    }
}
