/**
 * Created by Alex on 2017/4/15.
 */
//格式化时间字符串，转化为标准的时间格式 YYYY-MM-DD hh:mm:ss
function formatTimeString(str) {
    var timePattern;
    var year;
    var month;
    var day;
    var hour;
    var minute;
    var second;
    var timeContentArr = [];
    var outStr = '';

    //分中文日期字符串和英文日期字符串两种情况来考虑
    if (str.indexOf('年') !== (-1)) {

        //用来匹配中文日期字符串的正则表达式
        timePattern = /(\d+)[^\d]+(\d+)[^\d]+(\d+)([^\d]+)(\d+):(\d+):(\d+)/;
        timeContentArr = str.match(timePattern);
        year = timeContentArr[1];
        month = parseInt(timeContentArr[2], 10) < 10 ? '0' + timeContentArr[2] : timeContentArr[2];
        day = parseInt(timeContentArr[3], 10) < 10 ? "0" + timeContentArr[3] : timeContentArr[3];

        //判断是上午还是下午，上午的话小时不变
        if (timeContentArr[4].indexOf('上午') !== (-1)) {
            if (parseInt(timeContentArr[5], 10) < 10) {
                hour = '0' + timeContentArr[5];
            }
            else {
                hour = timeContentArr[5];
            }
        }

        //下午的话除了12点都加12个小时
        else {
            if (parseInt(timeContentArr[5], 10) === 12) {
                hour = timeContentArr[5];
            }
            else {
                hour = (parseInt(timeContentArr[5], 10) + 12).toString();
            }
        }
        minute = timeContentArr[6];
        second = timeContentArr[7];
        outStr = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }

    //英文日期字符串的情况
    else {

        //用来匹配英文日期字符串的正则表达式
        timePattern = /([a-zA-Z]+),[\u0020]+([a-zA-Z]+)[\u0020]+(\d+),[\u0020]+(\d+)[\u0020]+(\d+):(\d+):(\d+)[\u0020]+([a-zA-Z]+)/;
        timeContentArr = str.match(timePattern);
        year = timeContentArr[4];
        month = getMonthNumber(timeContentArr[2]);
        day = parseInt(timeContentArr[3], 10) < 10 ? '0' + timeContentArr[3] : timeContentArr[3];

        //判断是早上还是晚上，上午的话小时不变
        if (timeContentArr[8].indexOf('AM') !== (-1)) {
            if (parseInt(timeContentArr[5], 10) < 10) {
                hour = '0' + timeContentArr[5];
            }
            else {
                hour = timeContentArr[5];
            }
        }

        //下午的话除了12点都加12个小时
        else {
            if (parseInt(timeContentArr[5], 10) === 12) {
                hour = timeContentArr[5];
            }
            else {
                hour = (parseInt(timeContentArr[5], 10) + 12).toString();
            }
        }
        minute = timeContentArr[6];
        second = timeContentArr[7];
        outStr = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }
    return outStr;
}

//将月份的字符串转化为数字
function getMonthNumber(str) {
    var outPut;
    var monthArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if ((monthArr.indexOf(str) + 1) < 10) {
        outPut = '0' + (monthArr.indexOf(str) + 1).toString();
    }
    else {
        outPut = (monthArr.indexOf(str) + 1).toString();
    }
    return outPut;
}

//对获取的时间信息做进一步的处理
function getTimeString(str) {
    var outStr = '';
    if (str.indexOf('| 添加于 ') !== (-1)) {
        outStr = str.replace('| 添加于 ', '');
    }
    else {
        outStr = str.replace('| Added on ', '');
    }
    return outStr;
}