const connection = require('./ddb_epimessage');


/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function Has_access_to_group(user_id, group_id, callback){
    let sql_req = 'SELECT `id` FROM `groups_permissions` WHERE `user_id` = ? AND `group_id` = ?';
    connection.execute(
        sql_req,
        [user_id, group_id],
        (err, results, fields) => {
            if (err == null){
                if (results.length > 0){
                    callback(err, true, fields);
                }else{
                    callback(err, false, fields);
                }
            }else{
                callback(err, false, fields);
            }
        }
    );
 }


 function get_user_groups(user_id, callback){
    let sql_req = 'SELECT `group_id` FROM `groups_permissions` WHERE `user_id` = ?';
    connection.execute(
        sql_req,
        [user_id],
        (err, results, fields) => {
            if (err == null){
                callback(err, results, fields);
            }else{
                callback(err, false, fields);
            }
        }
    );
 }



 module.exports = {
    Has_access_to_group: Has_access_to_group,
    get_user_groups: get_user_groups,
 }