/**
 * Created by Alex on 2017/4/14.
 */

var readFile = new FileReader();

//获取<input type="file">元素
var fileInput = document.getElementById('getFile');

//获取annotationBox元素
var annotationBox = document.getElementById('annotationBox');

//获取titleList元素
var titleList = document.getElementById('titleList');

//用来匹配注释的正则表达式
var pattern = /(.+\))[^\d]+(\d+(?:-\d+)?).+(\|.+:\d+)(\s+[AM|PM]+)?(.+)?/;

//用来保存标题的数组
var titleArr = [];

//用来保存所有注释的数组
var annotationList = [];

//绑定窗口加载完成事件
window.onload = function () {

    //上传文件后触发的事件
    fileInput.onchange = function () {
        var i;

        //单独创建一个可以显示所有注释的标签
        var showAll;
        showAll = document.createElement('li');
        showAll.innerHTML = '显示所有注释';

        //为showAll标签绑定点击事件
        showAll.onclick = selectAnnotation;

        titleList.appendChild(showAll);
        for (i = 0; i < fileInput.files.length; i++) {
            var file = fileInput.files[i];

            //以文本方式读取文件
            readFile.readAsText(file);
            
            readFile.onload = function () {
                var j;
                var result;
                var annotationArr;

                //先将字符串中除了空格字符之外的所有空白字符删除(考虑到英文的问题，所以不可以删除空格符号)
                result = readFile.result.replace(/[\f\n\r\t\u000B\u00A0\u2028\u2029\u21B5]+/g, "");

                //获取数组形式的注释(=大于等于7个的时候才分割，避免注释其它部分出现少量等号而导致的错误分割的情况发生)
                annotationArr = result.split(/={7,}/);

                //将数组中的空数组删除
                deleteEmptyArr(annotationArr);     
                
                for (j = 0; j < annotationArr.length; j++) {
                    var k;
                    
                    //用来保存注释信息
                    var information;

                    //用来保存单条注释信息
                    var annotation = {};

                    //用来保存标题
                    var title;

                    //用来保存作者
                    var author;

                    //用来保存位置信息
                    var position;

                    //完整的时间信息
                    var time;

                    //未格式化的时间信息
                    var timeString;

                    //格式化的时间信息
                    var formatTime;

                    //用来保存注释内容
                    var content;

                    //为了防止内容全是空格的问题，所以添加了trim()函数
                    information = annotationArr[j].trim().match(pattern);

                    //如果这条字符串不能匹配，则直接跳到下一条字符串
                    if (information == null) continue;

                    //如果注释的内容为空，则直接跳过该条注释
                    if (information[5] == undefined) continue;

                    //从捕获的第一个分组开始判断
                    for (k = 1; k < information.length; k++) {
                        switch (k) {
                            case 1:
                                title = '《' + getTitle(information[1]).trim() + '》';
                                author = getAuthor(information[1]);

                                //判断新的标题是否存在于数组中，不存就就添加入数组
                                if (titleArr.indexOf(title) == (-1)) {             
                                    var li;

                                    //将新的标题添加到标题数组之中
                                    titleArr.push(title);

                                    //创建一个新的包含标题的li标签并且添加到列表当中
                                    li = document.createElement('li');         
                                    li.innerHTML = title;

                                    //为其添加点击事件    
                                    li.onclick = selectAnnotation;

                                    //将新标题添加到列表当中
                                    titleList.appendChild(li);              
                                }
                                break;

                            //位置信息保存在第二个捕获型分组中
                            case 2:                  
                                position = information[2];
                                break;

                            //时间信息保存在第三个捕获型分组之中
                            case 3:

                                //对提取的时间信息进行进一步分析
                                timeString = getTimeString(information[3]);          
                                
                                break;

                            //第四个捕获型分组是用来捕获英文信息的上午或者下午
                            case 4:
                                
                                if (information[4] != undefined) {                                 
                                    formatTime = formatTimeString(timeString + information[4]);
                                }
                                else {
                                    formatTime = formatTimeString(timeString);
                                }
                                time = timeString + '——————' + formatTime;
                                break;
                            //第五个捕获型分组保存着注释的内容
                            default:
                                
                                content = information[5];
                                break;
                        }
                    }

                    //将信息都保存起来
                    annotation.title = title;                                
                    annotation.author = author;
                    annotation.position = position;
                    annotation.time = time;
                    annotation.content = content;

                    //将该条信息添加到注释数组中
                    annotationList.push(annotation);                    
                }

                //以apply方式调用一次selectionAnnotation函数，将showAll标签作为参数，所以一开始可以显示所有注释
                selectAnnotation.apply(showAll);
            };
        }
    };
};

//删除数组中的空数组
function deleteEmptyArr(arr) {              
    var i;
    for (i = 0; i < arr.length; i++) {
        if (arr[i] == '') {
            arr.splice(i, 1);
        }
    }
}

//考虑了包含作者的括号出现了括号的情况的处理函数
function getTitle(str) {                    
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

function selectAnnotation() {
    var i;
    var annotationContainer;
    var titleContainer;
    var authorContainer;
    var positionContainer;
    var timeContainer;
    var contentContainer;

    //先将annotationBox里边的内容全部删除
    annotationBox.innerHTML = '';                                         
    
    for (i = 0; i < annotationList.length; i++) {

        //如果li标签的内容为"显示所有注释"，则将所有注释显示出来
        if (this.innerHTML == '显示所有注释') {
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
        }
            
        //如果不是所选的标题的注释，则直接跳过这条注释    
        else if (this.innerHTML != annotationList[i].title) {
            continue;
        }
        else {
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
        }

        //创建一个annotationContainer来容纳一条注释
        annotationContainer = document.createElement('div');       
        
        annotationContainer.className = 'annotationContainer';
        annotationContainer.appendChild(titleContainer);
        annotationContainer.appendChild(authorContainer);
        annotationContainer.appendChild(positionContainer);
        annotationContainer.appendChild(timeContainer);
        annotationContainer.appendChild(contentContainer);
        annotationBox.appendChild(annotationContainer);
    }
}


