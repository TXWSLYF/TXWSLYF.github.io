/**
 * Created by Alex on 2017/7/27.
 */

var singleUpload = document.getElementById('single-file-upload');

//为singleUpload添加ondragover事件，阻止其默认触发事件。
singleUpload.addEventListener('dragover', function (e) {
    e.preventDefault();
});

singleUpload.addEventListener('drop', function (e) {
    e.preventDefault();

    //e.dataTransfer.files包含拖拽释放的文件对象
    console.log(e.dataTransfer.files);
});