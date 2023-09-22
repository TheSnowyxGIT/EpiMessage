const pool = require("./ddb_epimessage");

function Has_access_to_group(user_id, group_id, callback) {
  let sql_req =
    "SELECT id FROM groups_permissions WHERE user_id = $1 AND group_id = $2";
  pool.query(sql_req, [user_id, group_id], (err, results) => {
    if (err) {
      callback(err, false);
    } else {
      if (results.rows.length > 0) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
}

function get_user_groups(user_id, callback) {
  let sql_req = "SELECT group_id FROM groups_permissions WHERE user_id = $1";
  pool.query(sql_req, [user_id], (err, results) => {
    if (err) {
      callback(err, false);
    } else {
      callback(null, results.rows);
    }
  });
}

function give_perms(user_id, group_id, callback) {
  let sql_req =
    "INSERT INTO groups_permissions (user_id, group_id) VALUES ($1, $2)";
  pool.query(sql_req, [user_id, group_id], (err, results) => {
    if (err) {
      callback(err, false);
    } else {
      callback(null, true);
    }
  });
}

module.exports = {
  Has_access_to_group: Has_access_to_group,
  get_user_groups: get_user_groups,
  give_perms: give_perms,
};
