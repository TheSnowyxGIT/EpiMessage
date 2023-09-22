const cookie = require("cookie");
const fs = require("fs");
const { get_session } = require("../mysql/users_session");

function getSession_request(req, res, next) {
  if (req.session.Id === null || req.session.Id === undefined) {
    res.redirect("/login");
    return;
  }
  next();
}

function getSession_request_not(req, res, next) {
  if (req.session.Id === null || req.session.Id === undefined) {
    next();
    return;
  }
  res.redirect("/");
}

function getSession_socket(socket, callback) {
  if (typeof socket.handshake.headers.cookie === "string") {
    var sid = cookie.parse(socket.handshake.headers.cookie);

    if (typeof sid["connect.sid"] === "undefined") {
      callback({ error: "connect.sid of the cookie is undefined." }, null);
    } else {
      var sid = sid["connect.sid"].split(":")[1].split(".")[0];
      get_session(sid, (err, res) => {
        if (err) {
          callback(err, null);
        } else {
          if (res.Id === null || res.Id === undefined) {
            callback({ error: "user not found" }, null);
          }
          callback(null, res);
        }
      });
    }
  } else {
    callback({ error: "The cookie type is not a string" }, null);
  }
}

module.exports = {
  type_request: getSession_request,
  type_request_not: getSession_request_not,
  type_socket: getSession_socket,
};
