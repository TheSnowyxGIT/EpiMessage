class FileUploader{
    constructor(socket){
        this.uploader = new SocketIOFileUpload(socket);
        this.nb_files_uploading = 0;
        this.size_of_upload = 0;
        this.files_progress_size = {};

        this.max_files = 30;
        this.selected_files = [];

        this.uploader.addEventListener('progress', (event)=>this.on_progress(event));
        this.uploader.addEventListener('complete', (event)=>this.on_complete(event));
        this.uploader.addEventListener('error', (event)=>this.on_error(event));

        this.fileItem_default_html = `<div class="file_item">
        <div class="file_item_logo"><i class="fas fa-file"></i></div>
        <span class="file_item_name"></span>
        <button class="file_item_button"><i class="fas fa-times"></i></button>
        </div>`;
        this.fileItem_img_html = `<div class="file_item">
        <div class="file_item_img_container"><img src=""></div>
        <button class="file_item_button"><i class="fas fa-times"></i></button>
        </div>`;
    }

    add_files(filelist){
        for (const file of Object.values(filelist)){
            this.add_file(file);
        }
    }

    add_file(file){
        if (this.selected_files.length < this.max_files && this.selected_files.indexOf(file)==-1){
            this.selected_files.push(file);
            this.html_fileList_add_fileItem(file);
            this.html_fileList_update_visibility();
        }
    }

    remove_file(file){
        const index = this.selected_files.indexOf(file);
        if (index >= 0 && index < this.selected_files.length) {
            this.selected_files.splice(index, 1);
            this.html_fileList_update_visibility();
        }
    }

    remove_all_files(){
        this.selected_files = [];
        this.html_fileList_clear();
        this.html_fileList_update_visibility();
    }

    on_start(){
        $("#img_button").addClass("disabled");
        $("#file_button").addClass("disabled");
    }

    on_progress(event){
        this.files_progress_size[event.file.id] = event.bytesLoaded;
        let all_bytes = Object.values(this.files_progress_size).reduce((t, e) => t + e, 0);
        this.progressBar_update(all_bytes / this.size_of_upload);
    }

    on_complete(event){
        this.nb_files_uploading -= 1;
        if (this.nb_files_uploading <= 0){
             this.on_upload_end()   
        }
    }

    on_error(event){
        this.nb_files_uploading -= 1;
        if (this.nb_files_uploading <= 0){
             this.on_upload_end()   
        }
    }

    on_upload_end(){
        this.nb_files_uploading = 0;
        this.size_of_upload = 0;
        this.files_progress_size = {};
        $("#img_button").removeClass("disabled");
        $("#file_button").removeClass("disabled");
        this.progressBar_hide();
    }

    is_uploading(){
        return this.nb_files_uploading != 0;
    }

    has_files(){
        return this.selected_files.length > 0;
    }

    get_files(){
        return this.selected_files;
    }

    upload_files(filelist, data){
        if (!this.is_uploading()){
            this.size_of_upload = Object.values(filelist).reduce((t, {size}) => t + size, 0)
            this.nb_files_uploading = filelist.length;
            this.uploader.addEventListener('start', (event)=>{
                this.on_start();
                event.file.meta = data;
            }, {once: true});
            this.uploader.submitFiles(filelist);
            this.remove_all_files();
        }
    }

    
    progressBar_hide(){
        $("#upload_progress").css("width","0px");
    }

    progressBar_update(value){
        value = value * 90;
        $("#upload_progress").css("width", value+"%");
    }

    html_fileList_update_visibility(){
        if (this.selected_files.length == 0){
            $("#files_list").addClass("hide");
        }else{
            $("#files_list").removeClass("hide");
        }
    }

    html_fileList_clear(){
        $("#files_list").empty();
    }

    is_image(type_mime){
        var imageType = /^image\//;
        return imageType.test(type_mime)
    }

    get_image_preview(file, callback){
        var reader = new FileReader();
        reader.onload = e => {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    html_fileList_add_fileItem(file){
        let fileItem;
        if (this.is_image(file.type)){
            fileItem = $(this.fileItem_img_html);
            this.get_image_preview(file, (preview)=>{
                fileItem.find(".file_item_img_container img").attr("src", preview);
            });
        }else{
            fileItem = $(this.fileItem_default_html);
            fileItem.find(".file_item_name").text(file.name);
        }
        
        fileItem.find(".file_item_button").click(()=>{
            fileItem.remove();
            this.remove_file(file);
        });
        $("#files_list").append(fileItem);
    }

}


const socket = io();


var uploader = new FileUploader(socket);



let is_init = false;
let all_users = undefined;
let all_users_connected = undefined;
let all_groups = undefined;

let me_id = undefined;
let me_user = undefined;

let last_msgs_private_ordered = undefined;
let last_msgs_groups_ordered = undefined;
let selected_channel = undefined;

let menu_selected = "private";


/*--------------------- 
    SOCKETS EVENTS
-----------------------*/

socket.on("connect", () => {
    console.log("connected to server!")
});

socket.on("error", error => {
    if (error.code != 1){
        alertBox("error", error.msg);
    }else{
        window.location.href = "https://epinotes.core2duo.fr/Errors/reconnect.php";
    }
});

socket.on("info", info => {
    alertBox("INFO", info.msg);
});

socket.on("init", data =>{

    all_users = data.users;
    all_users_connected = data.users_connected;
    all_groups = data.groups;
    me_id = data.me.id;
    me_user = data.me.user;

    last_msgs_private_ordered = data.lastmsgs_private;
    last_msgs_groups_ordered = data.lastmsgs_groups;

    is_init = true;
    console.log(data)
    init_selected_channel();
    display_on_init();
});

socket.on("new_private_msg", data => {
    if (data.channel_type == "private"){
        add_msg_into_last_msgs_private_ordered(data);
        if (data.id_sender == me_id){
            if (selected_channel.channel_type == "private" && selected_channel.user_id == data.id_receiver){
                // ajouter son propre message
                console.log("NEWMESSAGE: doit ajouter un messageBox de ma part!");
                append_messageBox(data);
                scroll_end_messages_panel();
            }
        }else{
            if (selected_channel.channel_type == "private" && selected_channel.user_id == data.id_sender){
                console.log("NEWMESSAGE: doit ajouter un messageBox de la part de " + get_user_by_id(data.id_sender).name + "!");
                append_messageBox(data);
                scroll_end_messages_panel();
                set_msgs_readed(selected_channel.user_id);
            }
        }
    }else if (data.channel_type == "group"){
        add_msg_into_last_msgs_groups_ordered(data);
        if (selected_channel.channel_type == "group" && selected_channel.group_id == data.group_id){
            console.log("NEWMESSAGE de group !");
            append_messageBox(data);
            scroll_end_messages_panel();
        }
    }else{
        return;
    }
    update_display_channelBox();
});

socket.on("load_messages", data => {
    clear_messages_panel();
    for(let i = 0; i < data.length; i++){
        insert_messageBox(data[i]);
    }
    scroll_end_messages_panel();

    if (selected_channel.channel_type == "private"){
        set_msgs_readed(selected_channel.user_id);
        update_display_channelBox();
    }else if (data.type == "group"){
        update_display_channelBox();
    }
});


socket.on("new_connected", (user_id)=>{
    if (is_init){
        if (!all_users_connected.includes(user_id)){
            all_users_connected.push(user_id);
        }
    }
    if (all_userBox[user_id]){
        update_userBox(all_userBox[user_id]);
    }
    if (selected_channel.channel_type == "private" && selected_channel.user_id == user_id){
        update_header_channel();
    }
});
socket.on("new_disconnected", (user_id)=>{
    if (is_init){
        const index = all_users_connected.indexOf(user_id);
        if (index > -1) {
            all_users_connected.splice(index, 1);
        }
    }
    if (all_userBox[user_id]){
        update_userBox(all_userBox[user_id]);
    }
    if (selected_channel.channel_type == "private" && selected_channel.user_id == user_id){
        update_header_channel();
    }
});


/*---------------------*/

/*--------------------- 
    SOCKETS EMIT
-----------------------*/

function send_private_msg(msg, user_id){
    if (msg != ""){
        msg = emoji_lib.emojify(msg);
        let data = {
            channel_type: "private",
            type: "text",
            message_body: msg,
            id_receiver: user_id
        };
        socket.emit("send_message", data);
    }
}
function send_group_msg(msg, group_id){
    if (msg != ""){
        msg = emoji_lib.emojify(msg);
        let data = {
            channel_type: "group",
            type: "text",
            message_body: msg,
            group_id: group_id
        };
        socket.emit("send_message", data);
    }
}

function send_private_files(filelist, user_id){
    if (uploader.is_uploading()){
        return;
    }
    const data = {
        channel_type: "private",
        id_receiver: user_id
    };
    console.log("okey")
    uploader.upload_files(filelist, data);
}
function send_group_files(filelist, group_id){
    if (uploader.is_uploading()){
        return;
    }
    const data = {
        channel_type: "group",
        group_id: group_id
    };
    uploader.upload_files(filelist, data);
}


/*---------------------*/


/*--------------------- 
    display Functions
-----------------------*/

function display_on_init(){
    update_select_menu();
    update_display_channelBox();
}

function display_last_users_in_userBox(){
    clear_channelBoxes();
    let latest_user_list = [];
    for(let i = 0; i < last_msgs_private_ordered.length; i++){
        if (last_msgs_private_ordered[i].id_sender == last_msgs_private_ordered[i].id_receiver){
            latest_user_list.push(me_user);
        }else{
            if (last_msgs_private_ordered[i].id_sender == me_id){
                latest_user_list.push(get_user_by_id(last_msgs_private_ordered[i].id_receiver));
            }else{
                latest_user_list.push(get_user_by_id(last_msgs_private_ordered[i].id_sender));
            }
        }
    }
    display_userBoxes(latest_user_list);
}

function update_select_menu(){
    $("#search-bar").val("");
    if (menu_selected == "group"){
        $("#group_button").addClass("active");
        $("#private_button").removeClass("active");
    }else{
        $("#private_button").addClass("active");
        $("#group_button").removeClass("active");
    }
}



/*---------------------*/




/*--------------------- 
    JQUERY EVENTS
-----------------------*/



/* USER SEARCH BAR */
let searchbar_focused = false;
$('#search-bar').on('input', function () {
    update_display_channelBox();
});
$('#search-bar').on('focusin', function () {
    if(menu_selected == "group"){
        $('#private_button').trigger('click');
    }
    searchbar_focused = true;
    update_display_channelBox();
});
$('#search-bar').on('focusout', function () {
    searchbar_focused = false;
    setTimeout(()=>{update_display_channelBox();}, 350)
});

function update_display_channelBox(){
    if (!is_init){
        return;
    }
    if (menu_selected == "private"){
        let value = $('#search-bar').val();
        if (value != "") {
            const option = {
                key: ['name']
            };
            const result = fuzzysort.go(value, all_users, option);
            const result_objs = result.map(fuzzy_user => (fuzzy_user.obj));
            console.log(result_objs);
            display_userBoxes(result_objs);
        } else {
            if (!searchbar_focused){
                display_last_users_in_userBox();
            }else{
                display_userBoxes(all_users);
            }
        }
    }else if (menu_selected == "group"){
        display_groupBoxes(all_groups);
    }
}

// When a client clik on a user_box
$(document).on('click', '.user_box', function () {
    let user_id = parseInt($(this).attr('user_id'));
    uploader.remove_all_files();
    change_channel({channel_type: "private", user_id: user_id});
});
$(document).on('click', '.group_box', function () {
    let group_id = parseInt($(this).attr('group_id'));
    uploader.remove_all_files();
    change_channel({channel_type: "group", group_id: group_id});
});



$("#message-bar").on('keydown', function (e) {
    if (e.keyCode == 13) {
        input_send_press();
    }
});
$("#send_button").on('click', function (e) {
    input_send_press();
});
function input_send_press(){
    let msg = $('#message-bar').val();
    if (selected_channel.channel_type == "private"){
        send_private_msg(msg, selected_channel.user_id);
    }else if (selected_channel.channel_type == "group"){
        send_group_msg(msg, selected_channel.group_id);
    }
    $('#message-bar').val("");

    if (uploader.has_files()){
        let filelist = uploader.get_files();
        if (selected_channel.channel_type == "private"){
            send_private_files(filelist, selected_channel.user_id);
        }else if (selected_channel.channel_type == "group"){
            send_group_files(filelist, selected_channel.group_id)
        }
    }
}


$("#file_button").on('click', function (e) {
    if (!uploader.is_uploading()){
        $('#file_file_chooser').trigger('click');
    }
});
$("#file_file_chooser").on("change", function(){
    const filelist = $("#file_file_chooser")[0].files;
    uploader.add_files(filelist);
});


$(".msg_right_container").on("dragover", function(event) {
    event.preventDefault();  
    event.stopPropagation();
});
$(".msg_right_container").on("dragleave", function(event) {
    event.preventDefault();  
    event.stopPropagation();
});
$(".msg_right_container").on("drop", function(event) {
    event.preventDefault();  
    event.stopPropagation();
    var files = event.originalEvent.dataTransfer.files;
    uploader.add_files(files);
});


$(window).on("paste", event =>{
    var files = event.originalEvent.clipboardData.files;
    uploader.add_files(files);
})



$("#private_button").on("click", function(){
    menu_selected = "private";
    update_select_menu();
    update_display_channelBox();
});
$("#group_button").on("click", function(){
    menu_selected = "group";
    update_select_menu();
    update_display_channelBox();
});

/*---------------------*/



function change_channel(selected_data) {
    clear_messages_panel();
    selected_channel = selected_data;
    display_msgs();
    update_header_channel();
}


/*--------------------- 
    HEADER CHANNEL
-----------------------*/

function update_header_channel() {
    if (selected_channel.channel_type == "private"){
        let user = get_user_by_id(selected_channel.user_id);
        $('.msg_right_header_title').text(user.name);
        $('.msg_right_header img').attr('src', get_image_url(user.login));
        if (user_is_connected(get_user_by_id(selected_channel.user_id))){
            $('.msg_right_header').find(".header_user_state").addClass("connected");
        }else{
            $('.msg_right_header').find(".header_user_state").removeClass("connected");
        }
    }else if (selected_channel.channel_type == "group"){
        const group = get_group_by_id(selected_channel.group_id);
        if (group != undefined){
            $('.msg_right_header_title').text(group.display_name);
            $('.msg_right_header img').attr('src', group.img_url);
        }
        $('.msg_right_header').find(".header_user_state").removeClass("connected");
    }else{
        return;
    }
}

/*---------------------*/


/*--------------------- 
   CREATION HTML ELMT
-----------------------*/


function update_userBox(user_box){
    const user = get_user_by_id(parseInt(user_box.attr("user_id")));
    let msg = user_has_last_msg(user);
    if (msg == null){
        msg = {
            type: "text",
            message_body: "Soyez le premier à envoyer un message !"
        };
    }
    user_box.find('img').attr('src', get_image_url(user.login));
    user_box.find('.last_message_name').text(user.name);

    if (user_has_send_unread_msgs(user)){
        user_box.addClass("unread");
    }else{
        user_box.addClass("read");
    }
    if (user_is_connected(user)){
        user_box.addClass("connected");
    }else{
        user_box.addClass("disconnected");
    }

    if (msg.type == "text"){
        user_box.find('.last_message_body').text(msg.message_body);
    }else if (msg.type == "img"){
        if(msg.id_sender == me_id){
            user_box.find('.last_message_body').text("Vous avez envoyé une photo.");
        }else{
            user_box.find('.last_message_body').text("Vous avez reçu une photo.");
        }
    }else if (msg.type == "file"){
        if(msg.id_sender == me_id){
            user_box.find('.last_message_body').text("Vous avez envoyé un fichier.");
        }else{
            user_box.find('.last_message_body').text("Vous avez reçu un fichier.");
        }
    }else if (msg.type == "video"){
        if(msg.id_sender == me_id){
            user_box.find('.last_message_body').text("Vous avez envoyé une vidéo.");
        }else{
            user_box.find('.last_message_body').text("Vous avez reçu une vidéo.");
        }
    }else{
        user_box.find('.last_message_body').text("UNKNOWN");
    }
    user_box.find('.last_message_date').text(time_string_between_now(new Date(msg.date)));
}

function get_clone_userBox(user) {

    var clone = $('#user_box_origin').clone();
    clone.css('display', 'flex');
    clone.removeAttr('id');
    clone.attr('user_id', user.id);
    return clone;
}

function update_groupBox(group_box){
    console.log(group_box);
    const group = get_group_by_id(parseInt(group_box.attr("group_id")));
    let msg = group_has_last_msg(group);
    if (msg == null){
        msg = {
            default: true,
            type: "text",
            message_body: "Soyez le premier à envoyer un message !"
        };
    }
    
    group_box.find('.last_message_title').text(group.display_name);
    group_box.find('img').attr('src', group.img_url);

    group_box.addClass("read");

    if (msg.default == true){
        group_box.find('.last_message_name').text("");
    }else if(msg.id_sender == me_id){
        group_box.find('.last_message_name').text("Vous : ");
    }else{
        group_box.find('.last_message_name').text(get_user_by_id(msg.id_sender).name+" : ");
    }

    if (msg.type == "text"){
        group_box.find('.last_message_body').text(msg.message_body);
    }else if (msg.type == "img"){
        group_box.find('.last_message_body').text("[IMAGE]");
    }else if (msg.type == "file"){
        group_box.find('.last_message_body').text("[FICHIER]");
    }else if (msg.type == "video"){
        group_box.find('.last_message_body').text("[VIDEO]");
    }else{
        group_box.find('.last_message_body').text("[UNKNOWN]");
    }

    group_box.find('.last_message_date').text(time_string_between_now(new Date(msg.date)));

}


function get_clone_groupBox(group) {
    var clone = $('#group_box_origin').clone();
    clone.css('display', 'flex');
    clone.removeAttr('id');
    clone.attr('group_id', group.id);
    return clone;
}




function create_message_box(data)
{
    let clone = $('#msg_line_origin').clone();
    clone.css('display', 'flex');
    clone.removeAttr('id');
    var msg_date = new Date(data.date);
    clone.find(".msg_line_date").text(hours_format(msg_date));

    let message_container_class;
    if (data.id_sender == me_id) {
        message_container_class = "msg_sended";
        clone.attr('class', 'msg_line_sended');
        clone.find('.msg_line_type').attr('class', message_container_class);
        clone.find("img").attr("src", get_image_url(me_user.login));
    }else{
        message_container_class = "msg_received";
        clone.attr('class', 'msg_line_received');
        clone.find('.msg_line_type').attr('class', message_container_class);
        clone.find("img").attr("src", get_image_url(get_user_by_id(data.id_sender).login));
    }
    
    if (data.type == "text"){
        messageBox_to_type_text(clone.find(`.${message_container_class}`), data.message_body);
    }else if (data.type == "img"){
        messageBox_to_type_img(clone.find(`.${message_container_class}`), data.url);
    }else if (data.type == "file"){
        messageBox_to_type_file(clone.find(`.${message_container_class}`), data.file_name, data.url);
    }else if (data.type == "video"){
        messageBox_to_type_video(clone.find(`.${message_container_class}`), data.file_type, data.url);
    }
    return clone;
}


function messageBox_to_type_text(msgBox_container,  msg){
    let text_div = `<div class="msg_line_text">${msg}</div>`;
    $(text_div).prependTo(msgBox_container);
}
function messageBox_to_type_img(msgBox_container, url){
    let img_div = `<a href="${url}" target="_blank"><img src="${url}" width="200"></a>`;
    $(img_div).prependTo(msgBox_container);
}
function messageBox_to_type_file(msgBox_container, file_name, url){
    let file_div = `<div class="msg_line_file">
    <div class="filename">${file_name}</div>
    <a class="download_button" href="${url}" download>
    <i class="fas fa-download"></i>
    </a></div>`;
    $(file_div).prependTo(msgBox_container);
}
function messageBox_to_type_video(msgBox_container, file_mime, url){
    let file_div = `<video controls crossorigin playsinline id="player" style="width: 100%">
    <source src="${url}" type="${file_mime}">
    <a href="${url}" download>Download</a></video>`;
    $(file_div).prependTo(msgBox_container);
}

/*---------------------*/


/*--------------------- 
        ChannelBOX
-----------------------*/

let all_userBox = {};
let all_groupBox = {};

// Ajoute à la fin de la liste un userBox 
function append_userBox(user){
    if (all_userBox[user.id]){
        all_userBox[user.id].remove();
    }
    var user_box = get_clone_userBox(user);
    user_box.appendTo('.msg_channel_list');
    all_userBox[user.id] = user_box;
    update_userBox(all_userBox[user.id]);
}
// Ajoute à la fin de la liste un userBox 
function append_groupBox(group){
    if (all_groupBox[group.id]){
        all_groupBox[group.id].remove();
    }
    var group_box = get_clone_groupBox(group);
    group_box.appendTo('.msg_channel_list');
    all_groupBox[group.id] = group_box;
    update_groupBox(all_groupBox[group.id]);
}

// Clear la liste de userBox et ajoute toute les userBox d'une liste d'users
function display_userBoxes(users_list) {
    clear_channelBoxes();
    users_list.forEach(function (user) {
        append_userBox(user);
    });
}

// Clear la liste de userBox et ajoute toute les userBox d'une liste d'users
function display_groupBoxes(group_list) {
    clear_channelBoxes();
    group_list.forEach(function (group) {
        append_groupBox(group);
    });
}

function clear_channelBoxes(){
    $('.msg_channel_list').empty();
    all_userBox = {};
}

/*---------------------*/




/*--------------------- 
        MESSAGEBOX
-----------------------*/

// Ajoute les messages en bas de page
function append_messageBox(data) {
    let message_box = create_message_box(data);
    message_box.appendTo('.msg_right_container');
}
// Ajoute les messages en haut de page après scrolling
function insert_messageBox(data) {
    let message_box = create_message_box(data);
    message_box.prependTo('.msg_right_container');
}

function clear_messages_panel(){
    let copy = $('#msg_line_origin');
    $('.msg_right_container').empty();
    copy.appendTo('.msg_right_container');
}

function display_msgs(){
    if (selected_channel.channel_type == "private"){
        socket.emit("ask_private_msgs", {user: selected_channel.user_id});
    }else if (selected_channel.channel_type == "group"){
        socket.emit("ask_group_msgs", {group_id: selected_channel.group_id});
    }else{
        return;
    }
}

/*---------------------*/



/*--------------------- 
        Other
-----------------------*/

function scroll_end_messages_panel() {
    $('.msg_right_container').animate({ scrollTop: $('.msg_right_container')[0].scrollHeight }, 100);
}

function get_image_url(login)
{
    return "https://photos.cri.epita.fr/thumb/" + login;
}

function get_user_by_id(id)
{
    return all_users.find(e => e.id == id);
}
function get_group_by_id(id)
{
    return all_groups.find(e => e.id == id);
}

function time_string_between_now(date){
    const datetime = date.getTime();
    const nowtime = new Date().getTime();
    let time_bet = (nowtime - datetime) / 1000;
    if(time_bet < 0){
        time_bet = 0;
    }
    if (time_bet < 60 * 60){
        let mins = Math.floor(time_bet / 60);
        if (mins == 0){
            mins = 1;
        }
        return mins + " min";
    }else if (time_bet < 60 * 60 * 24){
        let hours = Math.floor(time_bet / (60 * 60));
        return hours + " h";
    }else if (time_bet < 60 * 60 * 24 * 7){
        let days = Math.floor(time_bet / (60 * 60 * 24));
        return days + " j";
    }else{
        let weeks = Math.floor(time_bet / (60 * 60 * 24 * 7));
        return weeks + " sem";
    }
}

function hours_format(date){
    var min = date.getMinutes();
    if (parseInt(min) < 10)
    {
        min = "0" + min;
    }
    return date.getHours() + ":" + min;
}

function init_selected_channel(){
    if (last_msgs_private_ordered.length == 0 && last_msgs_groups_ordered.length == 0){
        selected_channel = {
            channel_type: "private",
            user_id: all_users[0].id
        };
        menu_selected = "private";
    }else{
        if (last_msgs_private_ordered.length == 0){
            selected_channel = {
                channel_type: "group",
                group_id: last_msgs_groups_ordered[0].group_id
            };
            menu_selected = "group";
        }else if (last_msgs_groups_ordered.length == 0){
            if (last_msgs_private_ordered[0].id_sender != me_id){
                selected_channel = {
                    channel_type: "private",
                    user_id: last_msgs_private_ordered[0].id_sender
                };
                menu_selected = "private";
            }else{
                selected_channel = {
                    channel_type: "private",
                    user_id: last_msgs_private_ordered[0].id_receiver
                };
                menu_selected = "private";
            }
        }else{
            if (new Date(last_msgs_groups_ordered[0].date).getTime() > new Date(last_msgs_private_ordered[0].date).getTime()){
                selected_channel = {
                    channel_type: "group",
                    group_id: last_msgs_groups_ordered[0].group_id
                };
                menu_selected = "group";
            }else{
                if (last_msgs_private_ordered[0].id_sender != me_id){
                    selected_channel = {
                        channel_type: "private",
                        user_id: last_msgs_private_ordered[0].id_sender
                    };
                    menu_selected = "private";
                }else{
                    selected_channel = {
                        channel_type: "private",
                        user_id: last_msgs_private_ordered[0].id_receiver
                    };
                    menu_selected = "private";
                }
            }
        }
    }
    update_select_menu();
    update_header_channel();
    display_msgs();
}


function user_has_last_msg(user){
    const msg_sended = last_msgs_private_ordered.find(e => e.id_sender == user.id && e.id_receiver == me_id);
    if (msg_sended == undefined){
        const msg_received = last_msgs_private_ordered.find(e => e.id_receiver == user.id && e.id_sender == me_id);
        if (msg_received == undefined){
            return null;
        }
        return msg_received;
    }
    return msg_sended;
}
function group_has_last_msg(group){
    const msg = last_msgs_groups_ordered.find(e => e.group_id == group.id);
    if (msg == undefined){
        return null;
    }
    return msg;
}

function user_has_send_unread_msgs(user){
    const msg_sended = last_msgs_private_ordered.find(e => e.id_sender == user.id && e.id_receiver == me_id);
    if (msg_sended == undefined){
        return false;
    }
    if (msg_sended.read_by_receiver == 0){
        return true;
    }
    return false;
}

function user_is_connected(user){
    return all_users_connected.includes(user.id);
}


function add_msg_into_last_msgs_private_ordered(msg){
    const msg_1 = last_msgs_private_ordered.find(e => e.id_sender == msg.id_sender && e.id_receiver == msg.id_receiver);
    if (msg_1 != undefined){
        removeElement(last_msgs_private_ordered, msg_1);
    }
    const msg_2 = last_msgs_private_ordered.find(e => e.id_sender == msg.id_receiver && e.id_receiver == msg.id_sender);
    if (msg_2 != undefined){
        removeElement(last_msgs_private_ordered, msg_2);
    }
    last_msgs_private_ordered.splice(0,0,msg);
}
function add_msg_into_last_msgs_groups_ordered(msg){
    const msg_1 = last_msgs_groups_ordered.find(e => e.group_id == msg.group_id);
    if (msg_1 != undefined){
        removeElement(last_msgs_groups_ordered, msg_1);
    }
    last_msgs_groups_ordered.splice(0,0,msg);
}


function set_msgs_readed(user_id){
    let last_msg = last_msgs_private_ordered.find(e => e.id_sender == user_id);
    if (last_msg != undefined){
        last_msg.read_by_receiver = 1;
    }
    socket.emit("read_message", {id_sender: user_id});
}

function removeElement(array, elem) {
    var index = array.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
}
/*---------------------*/





/*--------------------- 
    EMOJI GESTION
-----------------------*/

const emoji_picker_item_html = '<div class="emoji_picker_item"><div class="emoji_item_icon"></div><div class="emoji_item_code"></div></div>';
const emoji_picker_max_items = 10;

$('#message-bar').on('input', function () {
    const value = this.value;
    const cursor_pos = $("#message-bar")[0].selectionStart;
    if (value[cursor_pos-1] == ":"){
        const code = get_emojiCode_from_position(value, cursor_pos-1);
        if(code.find){
            if (emoji_lib.exists(code.code)){
                let res = value.substring(0, code.index);
                res += emoji_lib.get(code.code);
                res += value.substring(code.index + code.code.length + 2);
                $("#message-bar").val(res);
                $("#message-bar").focus();
            }
        }
        $("#emoji_picker").hide();
    }else{
        const code = get_emojiCode_from_position(value, cursor_pos);
        if (code.find){
            const match_codes = emoji_lib.find(code.code).slice(0, emoji_picker_max_items);
            if (match_codes.length != 0){
                emoji_picker_update(match_codes);
                $("#emoji_picker").show();
            }else{
                $("#emoji_picker").hide();
            }
        }else{
            $("#emoji_picker").hide();
        }
    }
});
$("#message-bar").bind("keydown click focus", function() {
    const value = this.value;
    const cursor_pos = $("#message-bar")[0].selectionStart;
    const code = get_emojiCode_from_position(value, cursor_pos);
    if (code.find){
        const match_codes = emoji_lib.find(code.code).slice(0, emoji_picker_max_items);
        if (match_codes.length != 0){
            emoji_picker_update(match_codes);
            $("#emoji_picker").show();
        }else{
            $("#emoji_picker").hide();
        }
    }else{
        $("#emoji_picker").hide();
    }
});

$('#message-bar').on('focusout', function () {
    setTimeout(()=>{$("#emoji_picker").hide();}, 350);
});

function get_emojiCode_from_position(value, position){
    let res = "";
    let i = position - 1;
    while (i >= 0){
        res = value[i] + res;
        if (value[i] == ":" || !value[i].match(/^[0-9a-zA-Z_-]+$/)){
            break;
        }
        i--;
    }
    let find = false;
    if (res.length != 0 && res[0] == ":"){
        find = true;
    }
    return {
        find: find,
        code: res.substring(1),
        index: i
    };
}

function emoji_picker_update(codes){
    codes = codes.slice(0, emoji_picker_max_items);
    let list = $("#emoji_picker").find(".emoji_picker_list");
    list.empty();
    for (let i = 0; i < codes.length; i++){
        const item = emoji_picker_create_item(codes[i]);
        list.append(item);
    }
}

function emoji_picker_create_item(code){
    const emoji = emoji_lib.get(code);
    let item = $(emoji_picker_item_html);
    item.find(".emoji_item_icon").text(emoji);
    item.find(".emoji_item_code").text(code);
    return item;
}


$(document).on('click', '.emoji_picker_item', function () {
    const code = $(this).find(".emoji_item_code").text();
    const emoji = emoji_lib.get(code);
    const value = $("#message-bar").val();
    const cursor_pos = $("#message-bar")[0].selectionStart;
    const emojicode = get_emojiCode_from_position(value, cursor_pos);
    if (emojicode.find){
        let res = value.substring(0, emojicode.index);
        res += emoji;
        res += value.substring(emojicode.index + emojicode.code.length + 1);
        $("#message-bar").val(res);
        $("#message-bar").focus();
    }
    $("#emoji_picker").hide();
});









const alertBox_time = 4500;
function alertBox(type, msg){
    let alert = $(".alert_box");
    alert.show();
    alert.find(".alert_msg").text(msg);
    alert.removeAttr("class");
    alert.attr("class", "alert_box");
    if (type == "WARNING"){
        alert.addClass("warning");
    }else if (type == "SUCCESS"){
        alert.addClass("success");
    }else if (type == "INFO"){
        alert.addClass("info");
    }else{
        alert.addClass("error");
    }
    setTimeout(()=>{
        alert.hide();
    }, alertBox_time)
    
}












