const pool = require("./ddb_epimessage");

function get_session(sid, callback) {
  const sql_req = "SELECT sess FROM user_sessions WHERE sid = $1";

  pool.query(sql_req, [sid]).then((res) => {
    if (res.rows.length == 0) {
      callback("user not found", null);
      return;
    }
    callback(null, res.rows[0].sess);
  });
}

module.exports = {
  get_session: get_session,
};
