/**
 * Created by Alex on 2017/4/14.
 */
window.onload = function () {
    var readFile = new FileReader();
    var fileInput = document.getElementById("getFile");
    var pattern = /(.+\))[^\d]+(\d+(?:-\d+)?).+(\|.+:\d+)(\s+[AM|PM]+)?(.+)?/;          //用来匹配注释的正则表达式
    var titleOl = document.getElementById("titleList");
    var titleList = []; //用来保存标题的数组
    var annotationList = []; //用来保存所有注释的数组
    fileInput.onchange = function () {
        var i, j, k;
        var showAll = document.createElement("li");             //创建的可以显示所有注释的标签
        showAll.innerHTML = "显示所有注释";
        titleOl.appendChild(showAll);
        showAll.onclick = function () {
            var annotationBox = document.getElementById("annotationBox");               //先将annotationBox里边的内容全部删除
            annotationBox.innerHTML = "";
            for (i = 0; i < annotationList.length; i++) {
                var annotationContainer = document.createElement("div");       //创建一个annotationContainer来容纳一条注释
                annotationContainer.className = "annotationContainer";
                var title = document.createElement("h2");
                title.innerHTML = "title：" + annotationList[i].title;
                annotationContainer.appendChild(title);
                var author = document.createElement("div");
                author.innerHTML = annotationList[i].author;
                annotationContainer.appendChild(author);
                var position = document.createElement("div");
                position.innerHTML = annotationList[i].position;
                annotationContainer.appendChild(position);
                var time = document.createElement("div");
                time.innerHTML = annotationList[i].time;
                annotationContainer.appendChild(time);
                var content = document.createElement("div");
                content.innerHTML = annotationList[i].content;
                annotationContainer.appendChild(content);
                annotationBox.appendChild(annotationContainer);
            }
        };
        for (i = 0; i < fileInput.files.length; i++) {
            var file = fileInput.files[i];
            readFile.readAsText(file);
            readFile.onload = function () {
                var result = readFile.result.replace(/[\f\n\r\t\u000B\u00A0\u2028\u2029\u21B5]+/g, "");//先将字符串中除了空格字符之外的所有空白字符删除(考虑到英文的问题，所以不可以删除空格符号)
                var annotationArr = result.split(/={7,}/);         //获取数组形式的注释(=大于等于7个的时候才分割，避免注释其它部分出现少量等号而导致的错误分割的情况发生)
                deleteEmptyArr(annotationArr);                  //将数组中的空数组删除
                for (j = 0; j < annotationArr.length; j++) {
                    var informations = annotationArr[j].match(pattern);
                    if (informations == null) continue;                            //如果这条字符串不能匹配，则直接跳到下一条字符串
                    if (informations[5] == undefined) continue;                   //如果注释的内容为空，则直接跳过该条注释
                    var annotationContainer = document.createElement("div");       //创建一个annotationContainer来容纳一条注释
                    annotationContainer.className = "annotationContainer";
                    for (k = 1; k < informations.length; k++) {
                        switch (k) {
                            case 1:
                                var title = document.createElement("h2");
                                title.innerHTML = "title：" + "《" + getTitle(informations[1]).trim() + "》";
                                annotationContainer.appendChild(title);
                                if (titleList.indexOf("《" + getTitle(informations[1]).trim() + "》") == (-1)) {            //如果新的标题不存在于标题数组之中
                                    titleList.push("《" + getTitle(informations[1]).trim() + "》");                    //将新的标题添加到标题数组之中
                                    var li = document.createElement("li");                           //创建一个新的包含标题的li标签并且添加到列表当中
                                    li.innerHTML = "《" + getTitle(informations[1]).trim() + "》";
                                    titleOl.appendChild(li);
                                }
                                var author = document.createElement("div");
                                author.innerHTML = "author：" + getAuthor(informations[1]);
                                annotationContainer.appendChild(author);
                                break;
                            case 2:
                                var position = document.createElement("div");
                                position.innerHTML = "position：" + informations[2];
                                annotationContainer.appendChild(position);
                                break;
                            case 3:
                                var time = document.createElement("div");
                                time.innerHTML = "time：" + getTimeString(informations[3]);            //对之前提取的时间信息进行进一步分析
                                annotationContainer.appendChild(time);
                                break;
                            case 4:                                                                 //对第五个捕获型分组进行判断
                                if (informations[4] != undefined) {                                 //如果其不等于空，则将其添加到时间信息后面
                                    time.innerHTML = "time：" + getTimeString(informations[3]) + informations[4];
                                    time.innerHTML = time.innerHTML + "——————" + formatTimeString(getTimeString(informations[3]) + informations[4]);
                                    break;
                                }
                                else {
                                    time.innerHTML = time.innerHTML + "——————" + formatTimeString(getTimeString(informations[3]));
                                    break;
                                }
                            default:
                                var content = document.createElement("div");
                                content.innerHTML = "content：" + informations[5];
                                annotationContainer.appendChild(content);
                                break;
                        }
                    }
                    var annotation = {};
                    annotation.title = "《" + getTitle(informations[1]).trim() + "》";
                    annotation.author = author.innerHTML;
                    annotation.position = position.innerHTML;
                    annotation.time = time.innerHTML;
                    annotation.content = content.innerHTML;
                    annotationList.push(annotation);
                    li.onclick = function () {
                        var annotationBox = document.getElementById("annotationBox");                    //先将annotationBox里边的内容全部删除
                        annotationBox.innerHTML = "";
                        for (i = 0; i < annotationList.length; i++) {
                            if (annotationList[i].title == this.innerHTML) {
                                var annotationContainer = document.createElement("div");       //创建一个annotationContainer来容纳一条注释
                                annotationContainer.className = "annotationContainer";
                                var title = document.createElement("h2");
                                title.innerHTML = "title：" + annotationList[i].title;
                                annotationContainer.appendChild(title);
                                var author = document.createElement("div");
                                author.innerHTML = annotationList[i].author;
                                annotationContainer.appendChild(author);
                                var position = document.createElement("div");
                                position.innerHTML = annotationList[i].position;
                                annotationContainer.appendChild(position);
                                var time = document.createElement("div");
                                time.innerHTML = annotationList[i].time;
                                annotationContainer.appendChild(time);
                                var content = document.createElement("div");
                                content.innerHTML = annotationList[i].content;
                                annotationContainer.appendChild(content);
                                annotationBox.appendChild(annotationContainer);
                            }
                        }
                    };
                    document.getElementById("annotationBox").appendChild(annotationContainer);
                }
            }
        }
    };
}
    function deleteEmptyArr(arr) {              //删除数组中的空数组
        var i;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] == "") {
                arr.splice(i, 1);
            }
        }
    }

    function getTitle(str) {                    //考虑了包含作者的括号出现了括号的情况的处理函数
        var count = 0;
        var position = str.length - 1;
        while (true) {
            var i, j;
            i = str.lastIndexOf(")", position);
            j = str.lastIndexOf("(", position);
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
            i = str.lastIndexOf(")", position);
            j = str.lastIndexOf("(", position);
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

