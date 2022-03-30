const connection = require('./ddb_epimessage');
const date_sqlFormat = require("../others/date_sqlFormat");
 


/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function send_private_msgs(sender_id, receiver_id, msg, callback){

    let sql_req = "INSERT INTO `private_messages` (`id_sender`, `id_receiver`, `message_body`) VALUES (?,?,?)";

    connection.execute(
        sql_req,
        [sender_id, receiver_id, msg],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function send_private_img(sender_id, receiver_id, data, callback){

    let sql_req = "INSERT INTO `private_messages` (`id_sender`, `id_receiver`, `message_body`, `type`) VALUES (?,?,?,?)";

    connection.execute(
        sql_req,
        [sender_id, receiver_id, data, "img"],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function send_private_file(sender_id, receiver_id, data, callback){

    let sql_req = "INSERT INTO `private_messages` (`id_sender`, `id_receiver`, `message_body`, `type`) VALUES (?,?,?,?)";

    connection.execute(
        sql_req,
        [sender_id, receiver_id, data, "file"],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function send_private_video(sender_id, receiver_id, data, callback){

    let sql_req = "INSERT INTO `private_messages` (`id_sender`, `id_receiver`, `message_body`, `type`) VALUES (?,?,?,?)";

    connection.execute(
        sql_req,
        [sender_id, receiver_id, data, "video"],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}



/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function get_private_msgs(user1_id, user2_id, date, callback){

    let limit = "100";
    date = date_sqlFormat(date);
    let sql_req = "SELECT * FROM `private_messages` ";
    sql_req += "WHERE unix_timestamp(`date`) <= unix_timestamp(?) AND ";
    sql_req += "((`id_sender` = ? AND `id_receiver`= ?) OR (`id_sender` = ? AND `id_receiver`= ?)) ";
    sql_req += "ORDER BY unix_timestamp(`date`) DESC LIMIT ?";

    connection.execute(
        sql_req,
        [date, user1_id, user2_id, user2_id, user1_id, limit],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}



function set_private_msgs_readed(receiver_id, sender_id, callback){
    let sql_req = "UPDATE `private_messages` SET `read_by_receiver`=1 WHERE `read_by_receiver`=0 AND `id_sender`=? AND `id_receiver`=? ";

    connection.execute(
        sql_req,
        [sender_id, receiver_id],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
function get_last_msg_received_per_user(user_id, callback){

    let sql_req = "SELECT * FROM `private_messages` WHERE (`id_sender`,`message_id`) IN (";
    sql_req += "SELECT t.id_sender AS id_sender ,MAX(t.message_id) AS message_id FROM (";
    sql_req += "SELECT `message_id`,`id_sender` FROM `private_messages` WHERE `id_receiver`=? AND (`id_sender`, `date`) IN ";
    sql_req += "(SELECT `id_sender`,MAX(`date`) AS date FROM `private_messages` WHERE `id_receiver`=? GROUP BY `id_sender`)) t GROUP BY t.id_sender)";
    sql_req += " ORDER BY `date` DESC";

    connection.execute(
        sql_req,
        [user_id, user_id],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
function get_last_msg_sended_per_user(user_id, callback){

    let sql_req = "SELECT * FROM `private_messages` WHERE (`id_receiver`,`message_id`) IN (";
    sql_req += "SELECT t.id_receiver AS id_receiver ,MAX(t.message_id) AS message_id FROM (";
    sql_req += "SELECT `message_id`,`id_receiver` FROM `private_messages` WHERE `id_sender`=? AND (`id_receiver`, `date`) IN ";
    sql_req += "(SELECT `id_receiver`,MAX(`date`) AS date FROM `private_messages` WHERE `id_sender`=? GROUP BY `id_receiver`)) t GROUP BY t.id_receiver)";
    sql_req += " ORDER BY `date` DESC";

    connection.execute(
        sql_req,
        [user_id, user_id],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}


/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
function get_last_msg_both_per_user(user_id, callback){
    get_last_msg_received_per_user(user_id, (err_received, res_received)=>{
        if (err_received == null){
            get_last_msg_sended_per_user(user_id, (err_sended, res_sended)=>{
                if (err_sended == null){
                    let result = [];
                    for (let i = 0; i < res_received.length; i++){
                        const received_last_msg = res_received[i];
                        const sended_last_msg = res_sended.find(e => e.id_receiver == received_last_msg.id_sender);
                        if (sended_last_msg == undefined){
                            result.push(received_last_msg);
                        }else{
                            let date_r = new Date(received_last_msg.date);
                            let date_s = new Date(sended_last_msg.date);
                            if(date_r.getTime() >= date_s.getTime()){
                                result.push(received_last_msg);
                            }else{
                                result.push(sended_last_msg);
                            }
                        }
                    }
                    for (let i = 0; i < res_sended.length; i++){
                        const sended_last_msg = res_sended[i];
                        const received_last_msg = res_received.find(e => e.id_receiver == sended_last_msg.id_sender);
                        if (received_last_msg == undefined){
                            result.push(sended_last_msg);
                        }else{
                            let date_r = new Date(received_last_msg.date);
                            let date_s = new Date(sended_last_msg.date);
                            if(date_r.getTime() >= date_s.getTime()){
                                result.push(received_last_msg);
                            }else{
                                result.push(sended_last_msg);
                            }
                        }
                    }
                    result.sort((a,b)=>{
                        let date_a = new Date(a.date);
                        let date_b = new Date(b.date);
                        if(date_a.getTime() == date_b.getTime()){
                            return 0;
                        }else if (date_a.getTime() > date_b.getTime()){
                            return -1;
                        }else{
                            return 1;
                        }
                    });
                    callback(err_sended, result);
                }else{
                    callback(err_sended, null);
                }
            });
        }else{
            callback(err_received, null);
        }
    });
}




module.exports = {
    get_last_msg_received_per_user: get_last_msg_received_per_user,
    get_last_msg_sended_per_user: get_last_msg_sended_per_user,
    get_last_msg_both_per_user: get_last_msg_both_per_user,
    get_private_msgs: get_private_msgs,

    send_private_msgs: send_private_msgs,
    send_private_img: send_private_img,
    send_private_file: send_private_file,
    send_private_video: send_private_video,

    set_private_msgs_readed: set_private_msgs_readed,
};