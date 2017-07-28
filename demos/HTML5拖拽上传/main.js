/**
 * Created by Alex on 2017/7/27.
 */

var singleUpload = document.getElementById('single-file-upload');
var manualFileChooser = document.getElementsByClassName('manual-file-chooser')[0];

//为singleUpload添加ondragover事件，阻止其默认触发事件。
singleUpload.addEventListener('dragover', function (e) {
    e.preventDefault();
});

singleUpload.addEventListener('drop', function (e) {
    e.preventDefault();
    var i = 0;

    //e.dataTransfer.files包含拖拽释放的文件对象
    var fileList = e.dataTransfer.files;

    for (i; i < fileList.length; i++) {
        console.log(fileList[i].name)
    }
});

manualFileChooser.addEventListener('change', function (e) {
    var i = 0;

    //files属性保存着上传文件的FileList对象
    var fileList = manualFileChooser.files;

    for (i; i < fileList.length; i++) {
        console.log(fileList[i].name)
    }
});