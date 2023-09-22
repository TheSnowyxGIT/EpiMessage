const pool = require("./ddb_epimessage");
const date_sqlFormat = require("../others/date_sqlFormat");

function get_groups(callback) {
  let sql_req = "SELECT * FROM groups";
  pool.query(sql_req, (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function get_groups_of_user(user_id, callback) {
  let sql_req =
    "SELECT * FROM groups WHERE id IN (SELECT group_id FROM groups_permissions WHERE user_id=$1)";
  pool.query(sql_req, [user_id], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function send_groups_msgs(sender_id, group_id, data, callback) {
  let sql_req =
    "INSERT INTO group_messages (group_id, id_sender, message_body) VALUES ($1, $2, $3)";
  pool.query(sql_req, [group_id, sender_id, data], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function send_groups_img(sender_id, group_id, data, callback) {
  let sql_req =
    "INSERT INTO group_messages (group_id, id_sender, message_body, type) VALUES ($1, $2, $3, 'img')";
  pool.query(sql_req, [group_id, sender_id, data], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function send_groups_file(sender_id, group_id, data, callback) {
  let sql_req =
    "INSERT INTO group_messages (group_id, id_sender, message_body, type) VALUES ($1, $2, $3, 'file')";
  pool.query(sql_req, [group_id, sender_id, data], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function send_groups_video(sender_id, group_id, data, callback) {
  let sql_req =
    "INSERT INTO group_messages (group_id, id_sender, message_body, type) VALUES ($1, $2, $3, 'video')";
  pool.query(sql_req, [group_id, sender_id, data], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function get_group_msgs(group_id, date, callback) {
  let limit = 100;
  date = date_sqlFormat(date); // Ensure that this function returns a date in the correct PostgreSQL date format
  let sql_req =
    "SELECT * FROM group_messages WHERE EXTRACT(epoch FROM date) <= EXTRACT(epoch FROM $1::timestamp) AND group_id=$2 ORDER BY EXTRACT(epoch FROM date) DESC LIMIT $3";
  pool.query(sql_req, [date, group_id, limit], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function get_last_message_per_groups_user(user_id, callback) {
  let sql_req = `
      SELECT * 
      FROM group_messages 
      WHERE (group_id, message_id) IN (
        SELECT t.group_id AS group_id, MAX(t.message_id) AS message_id 
        FROM (
          SELECT message_id, group_id 
          FROM group_messages 
          WHERE (group_id, date) IN (
            SELECT a.group_id AS group_id, MAX(a.date) AS date 
            FROM (
              SELECT * 
              FROM group_messages 
              WHERE group_id IN (
                SELECT group_id 
                FROM groups_permissions 
                WHERE user_id=$1
              )
            ) a 
            GROUP BY a.group_id
          )
        ) t 
        GROUP BY t.group_id
      ) 
      ORDER BY date DESC`;

  pool.query(sql_req, [user_id], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows);
  });
}

function createGroup(group_name, img_url, callback) {
  let sql_req = "INSERT INTO groups (display_name, img_url) VALUES ($1, $2)";
  pool.query(sql_req, [group_name, img_url], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    getGroup(group_name, (err, group) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, group);
    });
  });
}

function getGroup(group_name, callback) {
  let sql_req = "SELECT * FROM groups WHERE display_name=$1";
  pool.query(sql_req, [group_name], (err, results) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, results.rows[0]);
  });
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

  createGroup: createGroup,
  getGroup: getGroup,
};
