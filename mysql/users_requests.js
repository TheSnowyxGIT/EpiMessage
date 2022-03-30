const connection = require('./ddb_epinotes');


/**
 * Recupère tous les utilisateurs d'epinotes avec : {id, login, status, name}
 * 
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
function get_users(callback){
    connection.execute(
        'SELECT `login`,`id`,`statut`,`name` FROM `users` WHERE 1',
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}

/**
 * Recupère l'utilisateur d'epinotes avec : {id, login, status, name}
 * 
 * @param {number} user_id l'id de l'utilisateur epinotes
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
 function get_user(user_id, callback){
    connection.execute(
        'SELECT `login`,`id`,`statut`,`name` FROM `users` WHERE id = ?',
        [user_id],
        (err, results, fields) => {
            callback(err, results, fields);
        }
      );
}


module.exports = {
    get_users: get_users,
    get_user: get_user
};