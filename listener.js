const sessions = require('./others/sessions');
const error = require('./others/error');
const data_format = require('./others/data_format');
const emoji = require("./others/emoji");
const data_received_check = require('./others/data_received_check');

const ddb_epimessage = require("./mysql/messages_requests");
const ddb_epimessage_groups = require("./mysql/message_request_groups");
const ddb_groups_permissions = require('./mysql/groups_permissions_requests');

module.exports = function(socket, server_data) {

  const users_socket = server_data.users_socket;

  socket.on('send_message', data => {
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket == null){

        /** SPAM */
        if (!server_data.spam.is_allow_to_send(session.Id)){
          socket.emit("error", {code: error.code.SPAM, msg: error.get_error(error.code.SPAM)});
          return;
        }
        server_data.spam.user_sent(session.Id);



        if (data.type == "text"){
          if (data_received_check.check_textmsg(data)){ // CHECK DATA STRUCTURE
            /* EMOJI */
            data.message_body = emoji.lib.emojify(data.message_body);
            if (data.channel_type == "private"){
              send_private_text_msg(socket, users_socket, data, session);
            }else if (data.channel_type == "group"){
              send_group_text_msg(socket, users_socket, data, session);
            }else{
              socket.emit("error", {code: error.code.UNKNOWN_CHANNEL_TYPE, msg: error.get_error(error.code.UNKNOWN_CHANNEL_TYPE, {
                type: data.channel_type
            })});
            }
          }else{
            socket.emit("error", {code: error.code.SENDING_WRONG_DATA, msg: error.get_error(error.code.SENDING_WRONG_DATA)});
          }
        }else{
          socket.emit("error", {code: error.code.UNKNOWN_MSG_TYPE, msg: error.get_error(error.code.UNKNOWN_MSG_TYPE, {
              type: data.type
          })});
        }
      }else{
        socket.emit("error", {code: error.code.DISCONNECTED, msg: error.get_error(error.code.DISCONNECTED)});
      }
    });
  });

  socket.on("ask_private_msgs", data =>{
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket == null){

        if (!data_received_check.check_askmsg_private(data)){ // CHECK DATA STRUCTURE
          socket.emit("error", {code: error.code.DATA_INCORRECT, msg: error.get_error(error.code.DATA_INCORRECT)});
          return;
        }

        ddb_epimessage.get_private_msgs(session.Id, data.user, new Date(), (err_msg, msgs)=>{
          if (err_msg == null){
            let msgs_formated = [];
            for(let i = 0; i < msgs.length; i++){
              let row = msgs[i];
              let type = row.type;
              let formated_data;
              if (type == "text"){
                formated_data = data_format.make_client_msg_private_format_all(row.id_sender, row.id_receiver, row.message_body, new Date(row.date), row.read_by_receiver);
              }else if (type == "img"){
                let img_sql_data = JSON.parse(row.message_body);
                formated_data = data_format.make_client_img_private_format_all(row.id_sender, row.id_receiver, data_format.get_url_from_filename(img_sql_data.file_name), img_sql_data.file_type, new Date(row.date), row.read_by_receiver);
              }else if (type == "file"){
                let file_sql_data = JSON.parse(row.message_body);
                formated_data = data_format.make_client_file_private_format_all(row.id_sender, row.id_receiver, data_format.get_url_from_filename(file_sql_data.file_name), file_sql_data.name, file_sql_data.file_type, new Date(row.date), row.read_by_receiver);
              }else if (type == "video"){
                let video_sql_data = JSON.parse(row.message_body);
                formated_data = data_format.make_client_video_private_format_all(row.id_sender, row.id_receiver, data_format.get_url_from_filename(video_sql_data.file_name), video_sql_data.name, video_sql_data.file_type, new Date(row.date), row.read_by_receiver);
              }else{
                formated_data = null;
              }
              msgs_formated.push(formated_data);
            }
            socket.emit("load_messages", msgs_formated);
          }else{
            socket.emit("error", {code: error.code.LOADING_PRIVATE_MSGS, msg: error.get_error(error.code.LOADING_PRIVATE_MSGS)});
          }
        });
      }else{
        socket.emit("error", {code: error.code.DISCONNECTED, msg: error.get_error(error.code.DISCONNECTED)});
      }
    });
  });

  socket.on("ask_group_msgs", data =>{
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket == null){
        
        if (!data_received_check.check_askmsg_group(data)){ // CHECK DATA STRUCTURE
          socket.emit("error", {code: error.code.DATA_INCORRECT, msg: error.get_error(error.code.DATA_INCORRECT)});
          return;
        }

        ddb_groups_permissions.Has_access_to_group(session.Id, data.group_id, (err_perm, has_access)=>{
          if (err_perm == null && has_access){
            ddb_epimessage_groups.get_group_msgs(data.group_id, new Date(), (err_msg, msgs)=>{
              if (err_msg == null){
                let msgs_formated = [];
                for(let i = 0; i < msgs.length; i++){
                  let row = msgs[i];
                  let type = row.type;
                  let formated_data;
                  if (type == "text"){
                    formated_data = data_format.make_client_msg_group_format_all(row.id_sender, row.group_id, row.message_body, new Date(row.date));
                  }else if (type == "img"){
                    let img_sql_data = JSON.parse(row.message_body);
                    formated_data = data_format.make_client_img_group_format_all(row.id_sender, row.group_id, data_format.get_url_from_filename(img_sql_data.file_name), img_sql_data.file_type, new Date(row.date));
                  }else if (type == "file"){
                    let file_sql_data = JSON.parse(row.message_body);
                    formated_data = data_format.make_client_file_group_format_all(row.id_sender, row.group_id, data_format.get_url_from_filename(file_sql_data.file_name), file_sql_data.name, file_sql_data.file_type, new Date(row.date));
                  }else if (type == "video"){
                    let video_sql_data = JSON.parse(row.message_body);
                    formated_data = data_format.make_client_video_group_format_all(row.id_sender, row.group_id, data_format.get_url_from_filename(video_sql_data.file_name), video_sql_data.name, video_sql_data.file_type, new Date(row.date));
                  }else{
                    formated_data = null;
                  }
                  msgs_formated.push(formated_data);
                }
                socket.emit("load_messages", msgs_formated);
              }else{
                socket.emit("error", {code: error.code.LOADING_PRIVATE_MSGS, msg: error.get_error(error.code.LOADING_PRIVATE_MSGS)});
              }
            });
          }else{
            socket.emit("error", {code: error.code.ACCESS_GROUP_PERMISSIONS, msg: error.get_error(error.code.ACCESS_GROUP_PERMISSIONS,{
              group_id: data.group_id
            })});
          }
        });
      }else{
        socket.emit("error", {code: error.code.DISCONNECTED, msg: error.get_error(error.code.DISCONNECTED)});
      }
    });
  });

  socket.on("read_message", data =>{
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket == null){
        ddb_epimessage.set_private_msgs_readed(session.Id, data.id_sender, (err_read)=>{
        });
      }else{
        socket.emit("error", {code: error.code.DISCONNECTED, msg: error.get_error(error.code.DISCONNECTED)});
      }
    });
  });
  
};







  function send_private_text_msg(socket, users_socket, data, session){
    ddb_epimessage.send_private_msgs(session.Id, data.id_receiver, data.message_body, (err_send) => {
      if (err_send == null){
        const msg = data_format.make_client_msg_private_format(session.Id, data.id_receiver, data.message_body);
        socket.emit("new_private_msg", msg);
        if (users_socket[data.id_receiver] != undefined){
          users_socket[data.id_receiver].emit("new_private_msg", msg);
        }
      }else{
        socket.emit("error", {code: error.code.SENDING_PRIVATE_MSGS, msg: error.get_error(error.code.SENDING_PRIVATE_MSGS)});
      }
    });
  }

  function send_group_text_msg(socket, users_socket, data, session){
    ddb_groups_permissions.Has_access_to_group(session.Id, data.group_id, (err_perm, has_access)=>{
      if (err_perm == null && has_access){
        ddb_epimessage_groups.send_groups_msgs(session.Id, data.group_id, data.message_body, (err_send) => {
          if (err_send == null){
            const msg = data_format.make_client_msg_group_format(session.Id, data.group_id, data.message_body);
            socket.emit("new_private_msg", msg);
            socket.broadcast.emit("new_private_msg", msg);
          }else{
            socket.emit("error", {code: error.code.SENDING_PRIVATE_MSGS, msg: error.get_error(error.code.SENDING_PRIVATE_MSGS)});
          }
        });
      }else{
        socket.emit("error", {code: error.code.ACCESS_GROUP_PERMISSIONS, msg: error.get_error(error.code.ACCESS_GROUP_PERMISSIONS,{
          group_id: data.group_id
        })});
      }
    });
  }