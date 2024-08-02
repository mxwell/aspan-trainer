function zeroPad2(num) {
    if (num < 10) {
        return `0${num}`;
    }
    return `${num}`;
}

function datetimeToString(dt) {
    const y = dt.getFullYear();
    const mo = dt.getMonth() + 1;
    const d = dt.getDate();
    const h = dt.getHours();
    const mi = dt.getMinutes();
    const s = dt.getSeconds();
    return `${y}-${zeroPad2(mo)}-${zeroPad2(d)} ${zeroPad2(h)}:${zeroPad2(mi)}:${zeroPad2(s)}`;
}

function unixEpochToString(timestamp) {
    let dt = new Date(0);
    dt.setUTCSeconds(timestamp);
    return datetimeToString(dt);
}

export {
    unixEpochToString,
};