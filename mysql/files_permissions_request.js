const connection = require('./ddb_epimessage');
const ddb_epinotes = require('./users_requests');
const ddb_groups_permissions = require('./groups_permissions_requests');




 function user_has_access_to_file(user_id, file_name, callback){

    let sql_req = 'SELECT `id` FROM `files_permissions` WHERE `type` = "user" AND `target_id`=? AND `file_name` = ?';

    connection.execute(
        sql_req,
        [user_id, file_name],
        (err_u, results_u, fields_u) => {
            if (err_u == null){
                if (results_u.length > 0){
                    callback(err_u, true, fields_u);
                }else{
                    let sql_req = 'SELECT `target_id` AS group_id FROM `files_permissions` WHERE `type` = "group" AND `file_name` = ?';
                    connection.execute(
                        sql_req,
                        [file_name],
                        (err_groups, groups, fields_groups)=>{
                            if (err_groups == null){
                                ddb_groups_permissions.get_user_groups(user_id, (err_user_groups, user_groups)=>{
                                    if (err_user_groups == null){
                                        const common_group = groups.map(e=>e.group_id).filter(x => user_groups.map(e=>e.group_id).includes(x));
                                        if (common_group.length > 0){
                                            callback(null, true);
                                        }else{
                                            callback(null, false);
                                        }
                                    }else{
                                        callback(err_user_groups, null);
                                    }
                                });
                            }else{
                                callback(err_groups, null, fields_groups);
                            }
                        }
                    );
                }
            }else{
                callback(err_u, null, fields_u);
            }
        }
      );
}


function group_has_access_to_file(group_id, file_name, callback){
    let sql_req = 'SELECT `id` FROM `files_permissions` WHERE `type` = "group" AND `target_id`=? AND `file_name` = ?';
    connection.execute(
        sql_req,
        [group_id, file_name],
        (err, res, fields)=>{
            if (err == null){
                if (res.length > 0){
                    callback(err, true);
                }else{
                    callback(err, false);
                }
            }else{
                callback(err, null)
            }
        }
    );
}


/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function Give_user_access_to_file(user_id, file_name, callback){

    user_has_access_to_file(user_id, file_name, (err_find, res_find, fields_find)=>{
        if (err_find == null){
            if (res_find == false){
                let sql_req = "INSERT INTO `files_permissions` (`target_id`, `file_name`) VALUES (?,?)";
                connection.execute(
                    sql_req,
                    [user_id, file_name],
                    (err, results, fields) => {
                        callback(err, results, fields);
                    }
                  );
            }else{
                callback(null);
            }
        }else{
            callback(err_find, res_find, fields_find);
        }
    });
}



/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function Give_group_access_to_file(group_id, file_name, callback){

    group_has_access_to_file(group_id, file_name, (err_find, res_find)=>{
        if (err_find == null){
            if (res_find == false){
                let sql_req = "INSERT INTO `files_permissions` (`target_id`, `file_name`,`type`) VALUES (?,?,?)";
                connection.execute(
                    sql_req,
                    [group_id, file_name, "group"],
                    (err, results, fields) => {
                        callback(err, results, fields);
                    }
                  );
            }else{
                callback(null);
            }
        }else{
            callback(err_find);
        }
    });
}

/**
 * AFAIRE
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function Give_access_to_file_2users(user1_id, user2_id, file_name, callback){
    Give_user_access_to_file(user1_id, file_name, (err_1) =>{
        if (err_1 == null){
            Give_user_access_to_file(user2_id, file_name, (err_2) =>{
                if (err_2 == null){
                    callback(null);
                }else{
                    callback(err_2)
                }
            });
        }else{
            callback(err_1)
        }
    });
}



module.exports = {
    user_has_access_to_file: user_has_access_to_file,
    group_has_access_to_file: group_has_access_to_file,
    Give_user_access_to_file: Give_user_access_to_file,
    Give_group_access_to_file: Give_group_access_to_file,
    Give_access_to_file_2users: Give_access_to_file_2users,
}