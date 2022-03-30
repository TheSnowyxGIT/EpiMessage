

// TYPE : text

const xss = require("./xss");

function make_client_msg_private_format(id_sender, id_receiver, msg){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        message_body: xss.parse_xss_injection(msg),
        date: new Date().toISOString(),
        read_by_receiver: 0,
        type: "text"
    }
}
function make_client_msg_private_format_all(id_sender, id_receiver, msg, date, read_by_receiver){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        message_body: xss.parse_xss_injection(msg),
        date: date.toISOString(),
        read_by_receiver: read_by_receiver,
        type: "text"
    }
}

function make_client_msg_group_format(id_sender, group_id, msg){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        message_body: xss.parse_xss_injection(msg),
        date: new Date().toISOString(),
        type: "text"
    }
}
function make_client_msg_group_format_all(id_sender, group_id, msg, date){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        message_body: xss.parse_xss_injection(msg),
        date: date.toISOString(),
        type: "text"
    }
}

// TYPE : img

function make_client_img_private_format(id_sender, id_receiver, url, file_type){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        read_by_receiver: 0,
        type: "img"
    }
}
function make_client_img_private_format_all(id_sender, id_receiver, url, file_type, date, read_by_receiver){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        read_by_receiver: read_by_receiver,
        type: "img"
    }
}

function make_client_img_group_format(id_sender, group_id, url, file_type){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        type: "img"
    }
}
function make_client_img_group_format_all(id_sender, group_id, url, file_type, date){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        type: "img"
    }
}


// TYPE : file

function make_client_file_private_format(id_sender, id_receiver, url, file_name, file_type){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        read_by_receiver: 0,
        type: "file"
    }
}
function make_client_file_private_format_all(id_sender, id_receiver, url, file_name, file_type, date, read_by_receiver){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        read_by_receiver: read_by_receiver,
        type: "file"
    }
}

function make_client_file_group_format(id_sender, group_id, url, file_name, file_type){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        type: "file"
    }
}
function make_client_file_group_format_all(id_sender, group_id, url, file_name, file_type, date){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        type: "file"
    }
}


// TYPE : video

function make_client_video_private_format(id_sender, id_receiver, url, file_name, file_type){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        read_by_receiver: 0,
        type: "video"
    }
}
function make_client_video_private_format_all(id_sender, id_receiver, url, file_name, file_type, date, read_by_receiver){
    return {
        channel_type: "private",
        id_sender: id_sender,
        id_receiver: id_receiver,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        read_by_receiver: read_by_receiver,
        type: "video"
    }
}

function make_client_video_group_format(id_sender, group_id, url, file_name, file_type){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: new Date().toISOString(),
        type: "video"
    }
}
function make_client_video_group_format_all(id_sender, group_id, url, file_name, file_type, date){
    return {
        channel_type: "group",
        id_sender: id_sender,
        group_id: group_id,
        url: xss.parse_xss_injection(url),
        file_name: xss.parse_xss_injection(file_name),
        file_type: xss.parse_xss_injection(file_type),
        date: date.toISOString(),
        type: "video"
    }
}


function image_sql_format(file_name, file_type){
    return `{"file_name": "${file_name}", "file_type": "${file_type}"}`;
}

function file_sql_format(name, file_name, file_type){
    return `{"file_name": "${file_name}", "file_type": "${file_type}", "name": "${name}"}`;
}

function video_sql_format(name, file_name, file_type){
    return `{"file_name": "${file_name}", "file_type": "${file_type}", "name": "${name}"}`;
}

function get_url_from_filename(file_name){
    return "/storage/"+file_name;
}

module.exports = {
    make_client_msg_private_format: make_client_msg_private_format,
    make_client_msg_private_format_all: make_client_msg_private_format_all,
    make_client_msg_group_format: make_client_msg_group_format,
    make_client_msg_group_format_all: make_client_msg_group_format_all,

    make_client_img_private_format: make_client_img_private_format,
    make_client_img_private_format_all: make_client_img_private_format_all,
    make_client_img_group_format: make_client_img_group_format,
    make_client_img_group_format_all: make_client_img_group_format_all,

    make_client_file_private_format: make_client_file_private_format,
    make_client_file_private_format_all: make_client_file_private_format_all,
    make_client_file_group_format: make_client_file_group_format,
    make_client_file_group_format_all: make_client_file_group_format_all,

    make_client_video_private_format: make_client_video_private_format,
    make_client_video_private_format_all: make_client_video_private_format_all,
    make_client_video_group_format: make_client_video_group_format,
    make_client_video_group_format_all: make_client_video_group_format_all,

    image_sql_format: image_sql_format,
    file_sql_format: file_sql_format,
    video_sql_format: video_sql_format,
    
    get_url_from_filename: get_url_from_filename,
}