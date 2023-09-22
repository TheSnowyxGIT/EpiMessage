var siofu = require("socketio-file-upload");
const mmm = require("mmmagic"),
  Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);

const file_gestion = require("./others/files_gestion");
const sessions = require("./others/sessions");
const error = require("./others/error");
const data_format = require("./others/data_format");

const ddb_epimessage = require("./mysql/messages_requests");
const ddb_epimessage_groups = require("./mysql/message_request_groups");
const ddb_permissions = require("./mysql/files_permissions_request");
const ddb_groups_permissions = require("./mysql/groups_permissions_requests");

const maxFileSize = 75000000;

const types_allowed = {
  img: ["image/png", "image/jpeg", "image/gif"],
  file: ["application/pdf", "application/zip", "application/x-rar-compressed"],
  video: ["video/mp4", "video/quicktime"],
};

function get_msg_type_from_mime(mime_type) {
  for (const [type, mimes] of Object.entries(types_allowed)) {
    if (mimes.includes(mime_type)) {
      return type;
    }
  }
  return null;
}

module.exports = function (socket, server_data) {
  const users_socket = server_data.users_socket;

  var uploader = new siofu();
  uploader.dir = file_gestion.files_path_tmp;
  uploader.maxFileSize = maxFileSize;
  uploader.listen(socket);

  uploader.on("start", function (event) {
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket != null) {
        socket.emit("error", {
          code: error.code.DISCONNECTED,
          msg: error.get_error(error.code.DISCONNECTED),
        });
      } else {
        if (server_data.spam.is_allow_to_send(session.Id)) {
          if (event.file.size > maxFileSize) {
            socket.emit("error", {
              code: error.code.UPLOAD_MAX_SIZE,
              msg: error.get_error(error.code.UPLOAD_MAX_SIZE, {
                upload_max_size: maxFileSize,
                upload_file_size: event.file.size,
              }),
            });
          } else {
            socket.emit("info", { msg: "Votre fichier est en cours d'envoi." });
          }
        } else {
          socket.emit("error", {
            code: error.code.SPAM,
            msg: error.get_error(error.code.SPAM),
          });
        }
      }
    });
  });

  uploader.on("complete", function (event) {
    const file = event.file;
    const split_path = file.pathName.split("/");
    const file_name = split_path[split_path.length - 1];
    const data = file.meta;
    sessions.type_socket(socket, (err_socket, session) => {
      if (err_socket == null) {
        if (!server_data.spam.is_allow_to_send(session.Id)) {
          socket.emit("error", {
            code: error.code.SPAM,
            msg: error.get_error(error.code.SPAM),
          });
          return;
        }
        server_data.spam.user_sent(session.Id);

        magic.detectFile(
          file_gestion.files_path_tmp + file_name,
          function (err, file_mime) {
            //console.log(file_mime);
            if (!err) {
              data.mime_type = file_mime;
              data.type = get_msg_type_from_mime(file_mime);
              if (data.type == "img") {
                if (types_allowed["img"].includes(file_mime)) {
                  if (data.channel_type == "private") {
                    send_private_img_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else if (data.channel_type == "group") {
                    send_group_img_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else {
                    file_gestion.delete_tmp_file(file_name);
                    socket.emit("error", {
                      code: error.code.UNKNOWN_CHANNEL_TYPE,
                      msg: error.get_error(error.code.UNKNOWN_CHANNEL_TYPE, {
                        type: data.channel_type,
                      }),
                    });
                  }
                } else {
                  file_gestion.delete_tmp_file(file_name);
                  socket.emit("error", {
                    code: error.code.FILE_TYPE_INCORRECT,
                    msg: error.get_error(error.code.FILE_TYPE_INCORRECT, {
                      types: types_allowed["img"],
                    }),
                  });
                }
              } else if (data.type == "file") {
                if (types_allowed["file"].includes(file_mime)) {
                  if (data.channel_type == "private") {
                    send_private_file_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else if (data.channel_type == "group") {
                    send_group_file_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else {
                    file_gestion.delete_tmp_file(file_name);
                    socket.emit("error", {
                      code: error.code.UNKNOWN_CHANNEL_TYPE,
                      msg: error.get_error(error.code.UNKNOWN_CHANNEL_TYPE, {
                        type: data.channel_type,
                      }),
                    });
                  }
                } else {
                  file_gestion.delete_tmp_file(file_name);
                  socket.emit("error", {
                    code: error.code.FILE_TYPE_INCORRECT,
                    msg: error.get_error(error.code.FILE_TYPE_INCORRECT, {
                      types: types_allowed["file"],
                    }),
                  });
                }
              } else if (data.type == "video") {
                if (types_allowed["video"].includes(file_mime)) {
                  if (data.channel_type == "private") {
                    send_private_video_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else if (data.channel_type == "group") {
                    send_group_video_msg(
                      socket,
                      users_socket,
                      data,
                      session,
                      file_name
                    );
                  } else {
                    file_gestion.delete_tmp_file(file_name);
                    socket.emit("error", {
                      code: error.code.UNKNOWN_CHANNEL_TYPE,
                      msg: error.get_error(error.code.UNKNOWN_CHANNEL_TYPE, {
                        type: data.channel_type,
                      }),
                    });
                  }
                } else {
                  file_gestion.delete_tmp_file(file_name);
                  socket.emit("error", {
                    code: error.code.FILE_TYPE_INCORRECT,
                    msg: error.get_error(error.code.FILE_TYPE_INCORRECT, {
                      types: types_allowed["video"],
                    }),
                  });
                }
              } else {
                file_gestion.delete_tmp_file(file_name);
                socket.emit("error", {
                  code: error.code.UNKNOWN_MSG_TYPE,
                  msg: error.get_error(error.code.UNKNOWN_MSG_TYPE, {
                    mime_type: file_mime,
                  }),
                });
              }
            } else {
              console.log(err);
              file_gestion.delete_tmp_file(file_name);
              socket.emit("error", {
                code: error.code.GET_MIME_OF_FILE,
                msg: error.get_error(error.code.GET_MIME_OF_FILE),
              });
            }
          }
        );
      } else {
        file_gestion.delete_tmp_file(file_name);
        socket.emit("error", {
          code: error.code.DISCONNECTED,
          msg: error.get_error(error.code.DISCONNECTED),
        });
      }
    });
  });

  uploader.on("error", function (event) {
    console.log(event.error.toString());
    if (event.file) {
      const file = event.file;
      const split_path = file.pathName.split("/");
      const file_name = split_path[split_path.length - 1];
      file_gestion.delete_tmp_file(file_name);
    }
    const error_msg = event.error.toString();
    if (error_msg == "Error: Max allowed file size exceeded") {
      socket.emit("error", {
        code: error.code.UPLOAD_MAX_SIZE,
        msg: error.get_error(error.code.UPLOAD_MAX_SIZE, {
          upload_max_size: maxFileSize,
          upload_file_size: event.file.size,
        }),
      });
    } else {
      socket.emit("error", {
        code: error.code.UPLOAD_FILE,
        msg: error.get_error(error.code.UPLOAD_FILE, {
          upload_error: error_msg,
        }),
      });
    }
  });
};

function send_private_img_msg(socket, users_socket, data, session, file_name) {
  file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
    if (err_hash == null) {
      file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
        if (err_move == null) {
          let img_sql = data_format.image_sql_format(
            new_file_name,
            data.mime_type
          );
          ddb_epimessage.send_private_img(
            session.Id,
            data.id_receiver,
            img_sql,
            (err_send) => {
              if (err_send == null) {
                ddb_permissions.Give_access_to_file_2users(
                  session.Id,
                  data.id_receiver,
                  new_file_name,
                  (err_perm) => {
                    if (err_perm == null) {
                      const msg = data_format.make_client_img_private_format(
                        session.Id,
                        data.id_receiver,
                        data_format.get_url_from_filename(new_file_name),
                        data.mime_type
                      );
                      socket.emit("new_private_msg", msg);
                      if (users_socket[data.id_receiver] != undefined) {
                        users_socket[data.id_receiver].emit(
                          "new_private_msg",
                          msg
                        );
                      }
                    } else {
                      console.log(err_perm);
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.INSERT_PERMISSIONS,
                        msg: error.get_error(error.code.INSERT_PERMISSIONS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_file(new_file_name);
                socket.emit("error", {
                  code: error.code.SENDING_PRIVATE_MSGS,
                  msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                });
              }
            }
          );
        } else {
          file_gestion.delete_tmp_file(file_name);
          socket.emit("error", {
            code: error.code.MOVING_RENAMING_FILE,
            msg: error.get_error(error.code.MOVING_RENAMING_FILE),
          });
        }
      });
    } else {
      file_gestion.delete_tmp_file(file_name);
      socket.emit("error", {
        code: error.code.HASH_FILE,
        msg: error.get_error(error.code.HASH_FILE),
      });
    }
  });
}

function send_group_img_msg(socket, users_socket, data, session, file_name) {
  ddb_groups_permissions.Has_access_to_group(
    session.Id,
    data.group_id,
    (err_perm, has_access) => {
      if (err_perm == null && has_access) {
        file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
          if (err_hash == null) {
            file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
              if (err_move == null) {
                let img_sql = data_format.image_sql_format(
                  new_file_name,
                  data.mime_type
                );
                ddb_epimessage_groups.send_groups_img(
                  session.Id,
                  data.group_id,
                  img_sql,
                  (err_send) => {
                    if (err_send == null) {
                      ddb_permissions.Give_group_access_to_file(
                        data.group_id,
                        new_file_name,
                        (err_perm) => {
                          if (err_perm == null) {
                            const msg =
                              data_format.make_client_img_group_format(
                                session.Id,
                                data.group_id,
                                data_format.get_url_from_filename(
                                  new_file_name
                                ),
                                data.mime_type
                              );
                            socket.emit("new_private_msg", msg);
                            socket.broadcast.emit("new_private_msg", msg);
                          } else {
                            file_gestion.delete_file(new_file_name);
                            socket.emit("error", {
                              code: error.code.INSERT_PERMISSIONS,
                              msg: error.get_error(
                                error.code.INSERT_PERMISSIONS
                              ),
                            });
                          }
                        }
                      );
                    } else {
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.SENDING_PRIVATE_MSGS,
                        msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_tmp_file(file_name);
                socket.emit("error", {
                  code: error.code.MOVING_RENAMING_FILE,
                  msg: error.get_error(error.code.MOVING_RENAMING_FILE),
                });
              }
            });
          } else {
            file_gestion.delete_tmp_file(file_name);
            socket.emit("error", {
              code: error.code.HASH_FILE,
              msg: error.get_error(error.code.HASH_FILE),
            });
          }
        });
      } else {
        socket.emit("error", {
          code: error.code.ACCESS_GROUP_PERMISSIONS,
          msg: error.get_error(error.code.ACCESS_GROUP_PERMISSIONS, {
            group_id: data.group_id,
          }),
        });
      }
    }
  );
}

function send_private_file_msg(socket, users_socket, data, session, file_name) {
  file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
    if (err_hash == null) {
      file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
        if (err_move == null) {
          let file_sql = data_format.file_sql_format(
            file_name,
            new_file_name,
            data.mime_type
          );
          ddb_epimessage.send_private_file(
            session.Id,
            data.id_receiver,
            file_sql,
            (err_send) => {
              if (err_send == null) {
                ddb_permissions.Give_access_to_file_2users(
                  session.Id,
                  data.id_receiver,
                  new_file_name,
                  (err_perm) => {
                    if (err_perm == null) {
                      const msg = data_format.make_client_file_private_format(
                        session.Id,
                        data.id_receiver,
                        data_format.get_url_from_filename(new_file_name),
                        file_name,
                        data.mime_type
                      );
                      socket.emit("new_private_msg", msg);
                      if (users_socket[data.id_receiver] != undefined) {
                        users_socket[data.id_receiver].emit(
                          "new_private_msg",
                          msg
                        );
                      }
                    } else {
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.INSERT_PERMISSIONS,
                        msg: error.get_error(error.code.INSERT_PERMISSIONS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_file(new_file_name);
                socket.emit("error", {
                  code: error.code.SENDING_PRIVATE_MSGS,
                  msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                });
              }
            }
          );
        } else {
          file_gestion.delete_tmp_file(file_name);
          socket.emit("error", {
            code: error.code.MOVING_RENAMING_FILE,
            msg: error.get_error(error.code.MOVING_RENAMING_FILE),
          });
        }
      });
    } else {
      file_gestion.delete_tmp_file(file_name);
      socket.emit("error", {
        code: error.code.HASH_FILE,
        msg: error.get_error(error.code.HASH_FILE),
      });
    }
  });
}

function send_group_file_msg(socket, users_socket, data, session, file_name) {
  ddb_groups_permissions.Has_access_to_group(
    session.Id,
    data.group_id,
    (err_perm, has_access) => {
      if (err_perm == null && has_access) {
        file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
          if (err_hash == null) {
            file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
              if (err_move == null) {
                let file_sql = data_format.file_sql_format(
                  file_name,
                  new_file_name,
                  data.mime_type
                );
                ddb_epimessage_groups.send_groups_file(
                  session.Id,
                  data.group_id,
                  file_sql,
                  (err_send) => {
                    if (err_send == null) {
                      ddb_permissions.Give_group_access_to_file(
                        data.group_id,
                        new_file_name,
                        (err_perm) => {
                          if (err_perm == null) {
                            const msg =
                              data_format.make_client_file_group_format(
                                session.Id,
                                data.group_id,
                                data_format.get_url_from_filename(
                                  new_file_name
                                ),
                                file_name,
                                data.mime_type
                              );
                            socket.emit("new_private_msg", msg);
                            socket.broadcast.emit("new_private_msg", msg);
                          } else {
                            file_gestion.delete_file(new_file_name);
                            socket.emit("error", {
                              code: error.code.INSERT_PERMISSIONS,
                              msg: error.get_error(
                                error.code.INSERT_PERMISSIONS
                              ),
                            });
                          }
                        }
                      );
                    } else {
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.SENDING_PRIVATE_MSGS,
                        msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_tmp_file(file_name);
                socket.emit("error", {
                  code: error.code.MOVING_RENAMING_FILE,
                  msg: error.get_error(error.code.MOVING_RENAMING_FILE),
                });
              }
            });
          } else {
            file_gestion.delete_tmp_file(file_name);
            socket.emit("error", {
              code: error.code.HASH_FILE,
              msg: error.get_error(error.code.HASH_FILE),
            });
          }
        });
      } else {
        socket.emit("error", {
          code: error.code.ACCESS_GROUP_PERMISSIONS,
          msg: error.get_error(error.code.ACCESS_GROUP_PERMISSIONS, {
            group_id: data.group_id,
          }),
        });
      }
    }
  );
}

function send_private_video_msg(
  socket,
  users_socket,
  data,
  session,
  file_name
) {
  file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
    if (err_hash == null) {
      file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
        if (err_move == null) {
          let video_sql = data_format.video_sql_format(
            file_name,
            new_file_name,
            data.mime_type
          );
          ddb_epimessage.send_private_video(
            session.Id,
            data.id_receiver,
            video_sql,
            (err_send) => {
              if (err_send == null) {
                ddb_permissions.Give_access_to_file_2users(
                  session.Id,
                  data.id_receiver,
                  new_file_name,
                  (err_perm) => {
                    if (err_perm == null) {
                      const msg = data_format.make_client_video_private_format(
                        session.Id,
                        data.id_receiver,
                        data_format.get_url_from_filename(new_file_name),
                        file_name,
                        data.mime_type
                      );
                      socket.emit("new_private_msg", msg);
                      if (users_socket[data.id_receiver] != undefined) {
                        users_socket[data.id_receiver].emit(
                          "new_private_msg",
                          msg
                        );
                      }
                    } else {
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.INSERT_PERMISSIONS,
                        msg: error.get_error(error.code.INSERT_PERMISSIONS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_file(new_file_name);
                socket.emit("error", {
                  code: error.code.SENDING_PRIVATE_MSGS,
                  msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                });
              }
            }
          );
        } else {
          file_gestion.delete_tmp_file(file_name);
          socket.emit("error", {
            code: error.code.MOVING_RENAMING_FILE,
            msg: error.get_error(error.code.MOVING_RENAMING_FILE),
          });
        }
      });
    } else {
      file_gestion.delete_tmp_file(file_name);
      socket.emit("error", {
        code: error.code.HASH_FILE,
        msg: error.get_error(error.code.HASH_FILE),
      });
    }
  });
}

function send_group_video_msg(socket, users_socket, data, session, file_name) {
  ddb_groups_permissions.Has_access_to_group(
    session.Id,
    data.group_id,
    (err_perm, has_access) => {
      if (err_perm == null && has_access) {
        file_gestion.get_new_name_file(file_name, (err_hash, new_file_name) => {
          if (err_hash == null) {
            file_gestion.move_tmp_file(file_name, new_file_name, (err_move) => {
              if (err_move == null) {
                let video_sql = data_format.video_sql_format(
                  file_name,
                  new_file_name,
                  data.mime_type
                );
                ddb_epimessage_groups.send_groups_video(
                  session.Id,
                  data.group_id,
                  video_sql,
                  (err_send) => {
                    if (err_send == null) {
                      ddb_permissions.Give_group_access_to_file(
                        data.group_id,
                        new_file_name,
                        (err_perm) => {
                          if (err_perm == null) {
                            const msg =
                              data_format.make_client_video_group_format(
                                session.Id,
                                data.group_id,
                                data_format.get_url_from_filename(
                                  new_file_name
                                ),
                                file_name,
                                data.mime_type
                              );
                            socket.emit("new_private_msg", msg);
                            socket.broadcast.emit("new_private_msg", msg);
                          } else {
                            file_gestion.delete_file(new_file_name);
                            socket.emit("error", {
                              code: error.code.INSERT_PERMISSIONS,
                              msg: error.get_error(
                                error.code.INSERT_PERMISSIONS
                              ),
                            });
                          }
                        }
                      );
                    } else {
                      file_gestion.delete_file(new_file_name);
                      socket.emit("error", {
                        code: error.code.SENDING_PRIVATE_MSGS,
                        msg: error.get_error(error.code.SENDING_PRIVATE_MSGS),
                      });
                    }
                  }
                );
              } else {
                file_gestion.delete_tmp_file(file_name);
                socket.emit("error", {
                  code: error.code.MOVING_RENAMING_FILE,
                  msg: error.get_error(error.code.MOVING_RENAMING_FILE),
                });
              }
            });
          } else {
            file_gestion.delete_tmp_file(file_name);
            socket.emit("error", {
              code: error.code.HASH_FILE,
              msg: error.get_error(error.code.HASH_FILE),
            });
          }
        });
      } else {
        socket.emit("error", {
          code: error.code.ACCESS_GROUP_PERMISSIONS,
          msg: error.get_error(error.code.ACCESS_GROUP_PERMISSIONS, {
            group_id: data.group_id,
          }),
        });
      }
    }
  );
}
