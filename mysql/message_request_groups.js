const connection = require('./ddb_epimessage');
const date_sqlFormat = require("../others/date_sqlFormat");
const ddb_groups_permissions = require('./groups_permissions_requests');

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function get_groups(callback){

    let sql_req = "SELECT * FROM `groups` WHERE 1";

    connection.execute(
        sql_req,
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}


function get_groups_of_user(user_id, callback){

    let sql_req = "SELECT * FROM `groups` WHERE (`id`) IN (SELECT `group_id` FROM `groups_permissions` WHERE `user_id`=?)";

    connection.execute(
        sql_req,
        [user_id],
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
 function send_groups_msgs(sender_id, group_id, data, callback){
    let sql_req = "INSERT INTO `group_messages` (`group_id`, `id_sender`, `message_body`) VALUES (?,?,?)";
    connection.execute(
        sql_req,
        [group_id, sender_id, data],
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
 function send_groups_img(sender_id, group_id, data, callback){
    let sql_req = "INSERT INTO `group_messages` (`group_id`, `id_sender`, `message_body`, `type`) VALUES (?,?,?,?)";
    connection.execute(
        sql_req,
        [group_id, sender_id, data, "img"],
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
 function send_groups_file(sender_id, group_id, data, callback){
    let sql_req = "INSERT INTO `group_messages` (`group_id`, `id_sender`, `message_body`, `type`) VALUES (?,?,?,?)";
    connection.execute(
        sql_req,
        [group_id, sender_id, data, "file"],
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
 function send_groups_video(sender_id, group_id, data, callback){
    let sql_req = "INSERT INTO `group_messages` (`group_id`, `id_sender`, `message_body`, `type`) VALUES (?,?,?,?)";
    connection.execute(
        sql_req,
        [group_id, sender_id, data, "video"],
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
 function get_group_msgs(group_id, date, callback){

    let limit = "100";
    date = date_sqlFormat(date);
    let sql_req = "SELECT * FROM `group_messages` ";
    sql_req += "WHERE unix_timestamp(`date`) <= unix_timestamp(?) AND `group_id`=?";
    sql_req += " ORDER BY unix_timestamp(`date`) DESC LIMIT ?";

    connection.execute(
        sql_req,
        [date, group_id, limit],
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
 function get_last_message_per_groups_user(user_id, callback){

    let sql_req = "SELECT * FROM `group_messages` WHERE (`group_id`,`message_id`) IN (";
    sql_req += "SELECT t.group_id AS group_id ,MAX(t.message_id) AS message_id FROM (";
    sql_req += "SELECT `message_id`,`group_id` FROM `group_messages` WHERE (`group_id`, `date`) IN ";
    sql_req += "(SELECT a.group_id AS group_id,MAX(a.date) AS date FROM (";
    sql_req += "SELECT * FROM `group_messages` WHERE (`group_id`) IN (SELECT `group_id` FROM `groups_permissions` WHERE `user_id`=?)"
    sql_req += ") a GROUP BY a.group_id)) t GROUP BY t.group_id)";
    sql_req += " ORDER BY `date` DESC";

    connection.execute(
        sql_req,
        [user_id],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}


module.exports = {
    get_groups: get_groups,
    get_groups_of_user: get_groups_of_user,

    send_groups_msgs: send_groups_msgs,
    send_groups_img: send_groups_img,
    send_groups_file: send_groups_file,
    send_groups_video: send_groups_video,

    get_group_msgs: get_group_msgs,
    get_last_message_per_groups_user: get_last_message_per_groups_user,
};