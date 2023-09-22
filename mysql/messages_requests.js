const pool = require("./ddb_epimessage");
const date_sqlFormat = require("../others/date_sqlFormat");
function send_private_msgs(sender_id, receiver_id, msg, callback) {
  pool.query(
    "INSERT INTO private_messages (id_sender, id_receiver, message_body) VALUES ($1,$2,$3)",
    [sender_id, receiver_id, msg],
    (err, results) => {
      callback(err, results);
    }
  );
}

function send_private_img(sender_id, receiver_id, data, callback) {
  pool.query(
    "INSERT INTO private_messages (id_sender, id_receiver, message_body, type) VALUES ($1,$2,$3,'img')",
    [sender_id, receiver_id, data],
    (err, results) => {
      callback(err, results);
    }
  );
}

function send_private_file(sender_id, receiver_id, data, callback) {
  pool.query(
    "INSERT INTO private_messages (id_sender, id_receiver, message_body, type) VALUES ($1,$2,$3,'file')",
    [sender_id, receiver_id, data],
    (err, results) => {
      callback(err, results);
    }
  );
}

function send_private_video(sender_id, receiver_id, data, callback) {
  pool.query(
    "INSERT INTO private_messages (id_sender, id_receiver, message_body, type) VALUES ($1,$2,$3,'video')",
    [sender_id, receiver_id, data],
    (err, results) => {
      callback(err, results);
    }
  );
}

function get_private_msgs(user1_id, user2_id, date, callback) {
  let limit = 100;

  date = date_sqlFormat(date);
  pool.query(
    'SELECT * FROM private_messages WHERE EXTRACT(EPOCH FROM "date") <= EXTRACT(EPOCH FROM $1::timestamp) AND ' +
      "((id_sender = $2 AND id_receiver= $3) OR (id_sender = $4 AND id_receiver= $5)) " +
      'ORDER BY EXTRACT(EPOCH FROM "date") DESC LIMIT $6',
    [date, user1_id, user2_id, user2_id, user1_id, limit],
    (err, results) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, results.rows);
    }
  );
}

function set_private_msgs_readed(receiver_id, sender_id, callback) {
  pool.query(
    "UPDATE private_messages SET read_by_receiver=1 WHERE read_by_receiver=0 AND id_sender=$1 AND id_receiver=$2",
    [sender_id, receiver_id],
    (err, results) => {
      callback(err, results);
    }
  );
}

function get_last_msg_received_per_user(user_id, callback) {
  const sql_req = `
          SELECT * FROM private_messages
          WHERE (id_sender, message_id) IN (
              SELECT t.id_sender, MAX(t.message_id) 
              FROM (
                  SELECT message_id, id_sender 
                  FROM private_messages 
                  WHERE id_receiver = $1 AND (id_sender, date) IN (
                      SELECT id_sender, MAX(date) 
                      FROM private_messages 
                      WHERE id_receiver = $1 
                      GROUP BY id_sender
                  )
              ) t 
              GROUP BY t.id_sender
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

function get_last_msg_sended_per_user(user_id, callback) {
  const sql_req = `
          SELECT * FROM private_messages 
          WHERE (id_receiver, message_id) IN (
              SELECT t.id_receiver, MAX(t.message_id)
              FROM (
                  SELECT message_id, id_receiver
                  FROM private_messages
                  WHERE id_sender = $1 AND (id_receiver, date) IN (
                      SELECT id_receiver, MAX(date)
                      FROM private_messages
                      WHERE id_sender = $1
                      GROUP BY id_receiver
                  )
              ) t 
              GROUP BY t.id_receiver
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

/**
 * AFAIRE
 *
 * @param {function} callback La fonction qui sera appellée avec le resulat mysql
 */
function get_last_msg_both_per_user(user_id, callback) {
  get_last_msg_received_per_user(user_id, (err_received, res_received) => {
    if (err_received == null) {
      get_last_msg_sended_per_user(user_id, (err_sended, res_sended) => {
        if (err_sended == null) {
          let result = [];
          for (let i = 0; i < res_received.length; i++) {
            const received_last_msg = res_received[i];
            const sended_last_msg = res_sended.find(
              (e) => e.id_receiver == received_last_msg.id_sender
            );
            if (sended_last_msg == undefined) {
              result.push(received_last_msg);
            } else {
              let date_r = new Date(received_last_msg.date);
              let date_s = new Date(sended_last_msg.date);
              if (date_r.getTime() >= date_s.getTime()) {
                result.push(received_last_msg);
              } else {
                result.push(sended_last_msg);
              }
            }
          }
          for (let i = 0; i < res_sended.length; i++) {
            const sended_last_msg = res_sended[i];
            const received_last_msg = res_received.find(
              (e) => e.id_receiver == sended_last_msg.id_sender
            );
            if (received_last_msg == undefined) {
              result.push(sended_last_msg);
            } else {
              let date_r = new Date(received_last_msg.date);
              let date_s = new Date(sended_last_msg.date);
              if (date_r.getTime() >= date_s.getTime()) {
                result.push(received_last_msg);
              } else {
                result.push(sended_last_msg);
              }
            }
          }
          result.sort((a, b) => {
            let date_a = new Date(a.date);
            let date_b = new Date(b.date);
            if (date_a.getTime() == date_b.getTime()) {
              return 0;
            } else if (date_a.getTime() > date_b.getTime()) {
              return -1;
            } else {
              return 1;
            }
          });
          callback(err_sended, result);
        } else {
          callback(err_sended, null);
        }
      });
    } else {
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
