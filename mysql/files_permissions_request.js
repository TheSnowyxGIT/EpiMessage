const ddb_groups_permissions = require("./groups_permissions_requests");
const pool = require("./ddb_epimessage");

function user_has_access_to_file(user_id, file_name, callback) {
  let sql_req =
    "SELECT id FROM files_permissions WHERE type = $1 AND target_id = $2 AND file_name = $3";

  pool.query(sql_req, ["user", user_id, file_name], (err_u, results_u) => {
    if (err_u == null) {
      if (results_u.rows.length > 0) {
        callback(err_u, true);
      } else {
        let sql_req =
          "SELECT target_id AS group_id FROM files_permissions WHERE type = $1 AND file_name = $2";
        pool.query(sql_req, ["group", file_name], (err_groups, groups) => {
          if (err_groups == null) {
            ddb_groups_permissions.get_user_groups(
              user_id,
              (err_user_groups, user_groups) => {
                if (err_user_groups == null) {
                  const common_group = groups.rows
                    .map((e) => e.group_id)
                    .filter((x) =>
                      user_groups.map((e) => e.group_id).includes(x)
                    );
                  if (common_group.length > 0) {
                    callback(null, true);
                  } else {
                    callback(null, false);
                  }
                } else {
                  callback(err_user_groups, null);
                }
              }
            );
          } else {
            callback(err_groups, null);
          }
        });
      }
    } else {
      callback(err_u, null);
    }
  });
}

function group_has_access_to_file(group_id, file_name, callback) {
  let sql_req =
    "SELECT id FROM files_permissions WHERE type = $1 AND target_id = $2 AND file_name = $3";
  pool.query(sql_req, ["group", group_id, file_name], (err, res) => {
    if (err == null) {
      if (res.rows.length > 0) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } else {
      callback(err, null);
    }
  });
}

function Give_user_access_to_file(user_id, file_name, callback) {
  user_has_access_to_file(user_id, file_name, (err_find, res_find) => {
    if (err_find == null) {
      if (res_find == false) {
        let sql_req =
          "INSERT INTO files_permissions (target_id, file_name) VALUES ($1, $2)";
        pool.query(sql_req, [user_id, file_name], (err, results) => {
          callback(err, results.rows);
        });
      } else {
        callback(null);
      }
    } else {
      callback(err_find);
    }
  });
}

function Give_group_access_to_file(group_id, file_name, callback) {
  group_has_access_to_file(group_id, file_name, (err_find, res_find) => {
    if (err_find == null) {
      if (res_find == false) {
        let sql_req =
          "INSERT INTO files_permissions (target_id, file_name, type) VALUES ($1, $2, $3)";
        pool.query(sql_req, [group_id, file_name, "group"], (err, results) => {
          callback(err, results.rows);
        });
      } else {
        callback(null);
      }
    } else {
      callback(err_find);
    }
  });
}

function Give_access_to_file_2users(user1_id, user2_id, file_name, callback) {
  Give_user_access_to_file(user1_id, file_name, (err_1) => {
    if (err_1 == null) {
      Give_user_access_to_file(user2_id, file_name, (err_2) => {
        if (err_2 == null) {
          callback(null);
        } else {
          callback(err_2);
        }
      });
    } else {
      callback(err_1);
    }
  });
}

module.exports = {
  user_has_access_to_file: user_has_access_to_file,
  group_has_access_to_file: group_has_access_to_file,
  Give_user_access_to_file: Give_user_access_to_file,
  Give_group_access_to_file: Give_group_access_to_file,
  Give_access_to_file_2users: Give_access_to_file_2users,
};
