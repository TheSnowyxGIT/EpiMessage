const pool = require("./ddb_epimessage");
const bcrypt = require("bcrypt");
const { give_perms } = require("./groups_permissions_requests");
const { getGroup, createGroup } = require("./message_request_groups");
const saltRounds = 10;

const generalGroup = "Global";

function get_users(callback) {
  const sql_req = "SELECT id, name FROM users";

  pool
    .query(sql_req)
    .then((res) => callback(null, res.rows, res.fields))
    .catch((err) => callback(err, null, null));
}

function get_user(user_id, callback) {
  const sql_req = "SELECT id, name FROM users WHERE id = $1";

  pool
    .query(sql_req, [user_id])
    .then((res) => callback(null, res.rows, res.fields))
    .catch((err) => callback(err, null, null));
}

function check_user(email, password, callback) {
  const sql_req = "SELECT * FROM users WHERE email = $1";
  // check hash password
  pool
    .query(sql_req, [email])
    .then((res) => {
      if (res.rows.length == 0) {
        callback("user not found", null);
        return;
      }
      bcrypt.compare(password, res.rows[0].password, function (err, result) {
        if (result) {
          callback(null, res.rows[0]);
        } else {
          callback("wrong password", null);
        }
      });
    })
    .catch((err) => callback(err, null, null));
}

function register(email, password, name, callback) {
  const sql_req = "SELECT * FROM users WHERE email = $1";
  // check hash password
  pool
    .query(sql_req, [email])
    .then((res) => {
      if (res.rows.length != 0) {
        callback("user already exist", null);
        return;
      }
      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
          callback(err, null);
          return;
        }
        const sql_req =
          "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)";
        pool
          .query(sql_req, [email, hash, name])
          .then((res) => {
            check_user(email, password, (err, user) => {
              // add it to general group
              getGroup(generalGroup, (err, group) => {
                if (err) {
                  callback(err, null);
                  return;
                }
                if (!group) {
                  console.log("create group");
                  createGroup(generalGroup, "", (err, group) => {
                    console.log("groupe ", group);

                    if (err) {
                      callback(err, null);
                      return;
                    }
                    give_perms(user.id, group.id, (err, res) => {
                      if (err) {
                        callback(err, null);
                        return;
                      }
                      callback(null, user);
                    });
                  });
                } else {
                  console.log("already group");
                  give_perms(user.id, group.id, (err, res) => {
                    if (err) {
                      callback(err, null);
                      return;
                    }
                    callback(null, user);
                  });
                }
              });
            });
          })
          .catch((err) => callback(err, null));
      });
    })
    .catch((err) => callback(err, null, null));
}

module.exports = {
  get_users: get_users,
  get_user: get_user,
  check_user: check_user,
  register: register,
};
