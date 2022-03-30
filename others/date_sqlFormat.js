module.exports = date => {
    let e = new Date();
    let year = e.getFullYear().toString();
    let month = (e.getMonth()+1).toString();
    if (month.length == 1){
        month = "0"+month;
    }
    let day = e.getDate().toString();
    if (day.length == 1){
        day = "0"+day;
    }
    let hour = e.getHours().toString();
    if (hour.length == 1){
        hour = "0"+hour;
    }
    let min = e.getMinutes().toString();
    if (min.length == 1){
        min = "0"+min;
    }
    let sec = e.getSeconds().toString();
    if (sec.length == 1){
        sec = "0"+sec;
    }
    let res = year+"-"+month+"-"+day+" "+hour+":"+min+":"+sec;
    return res;
}