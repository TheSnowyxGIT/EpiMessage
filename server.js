const https = require("https");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const port = 8000;

const options = {};

let server_data = {
  spam: require("./others/spam"),
  users_socket: {},
};
const app = require("./app")(server_data);

const server = app.listen(port, function () {
  console.log("Server running on " + port);
});

const socketLib = require("socket.io");
const io = socketLib(server);
const sessions = require("./others/sessions");
const join_data = require("./others/join_data");
const error = require("./others/error");

io.on("connection", function (socket) {
  sessions.type_socket(socket, (err_socket, session) => {
    if (err_socket == null) {
      console.log("user " + session.Id + " connected");
      require("./uploader_listener")(socket, server_data);
      join_data.get_init_data(session, server_data, (err_data, data) => {
        if (!err_data) {
          server_data.users_socket[session.Id] = socket;
          server_data.spam.addUser(session.Id);

          socket.emit("init", data);
          socket.broadcast.emit("new_connected", session.Id);
          socket.on("disconnect", () => {
            socket.broadcast.emit("new_disconnected", session.Id);
            delete server_data.users_socket[session.Id];
            server_data.spam.removeUser(session.Id);
          });
          require("./listener")(socket, server_data);
        } else {
          socket.emit("error", {
            code: error.code.INIT_DATA_JOIN,
            msg: error.get_error(error.code.INIT_DATA_JOIN),
          });
        }
      });
    } else {
      socket.emit("error", {
        code: error.code.DISCONNECTED,
        msg: error.get_error(error.code.DISCONNECTED),
      });
    }
  });
});
