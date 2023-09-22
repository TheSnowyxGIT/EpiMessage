const ddb_epinotes = require("../mysql/users_requests");
const ddb_epimessage = require("../mysql/messages_requests");
const ddb_epimessage_groups = require("../mysql/message_request_groups");
const users_online_methodes = require("./users_online_methodes");
const data_format = require("./data_format");

function get_init_data(session, server_data, callback) {
  const users_socket = server_data.users_socket;
  let obj = {};
  const user_id = session.Id;
  ddb_epinotes.get_users((err_users, users) => {
    if (err_users == null) {
      obj["users"] = users;
      obj["me"] = {};
      obj["users_connected"] =
        users_online_methodes.get_online_users(users_socket);
      if (!obj["users_connected"].includes(user_id)) {
        obj["users_connected"].push(user_id);
      }
      ddb_epinotes.get_user(user_id, (err_user, user) => {
        if (err_user == null) {
          user = user[0];
          obj.me["id"] = user_id;
          obj.me["user"] = user;

          ddb_epimessage.get_last_msg_both_per_user(
            user_id,
            (err_lastmsgs_private, last_msgs_private) => {
              if (err_lastmsgs_private == null) {
                let msgs_formated = [];
                for (let i = 0; i < last_msgs_private.length; i++) {
                  let row = last_msgs_private[i];
                  let type = row.type;
                  let formated_data;
                  if (type == "text") {
                    formated_data =
                      data_format.make_client_msg_private_format_all(
                        row.id_sender,
                        row.id_receiver,
                        row.message_body,
                        new Date(row.date),
                        row.read_by_receiver
                      );
                  } else if (type == "img") {
                    let img_sql_data = JSON.parse(row.message_body);
                    formated_data =
                      data_format.make_client_img_private_format_all(
                        row.id_sender,
                        row.id_receiver,
                        data_format.get_url_from_filename(
                          img_sql_data.file_name
                        ),
                        img_sql_data.file_type,
                        new Date(row.date),
                        row.read_by_receiver
                      );
                  } else if (type == "file") {
                    let file_sql_data = JSON.parse(row.message_body);
                    formated_data =
                      data_format.make_client_file_private_format_all(
                        row.id_sender,
                        row.id_receiver,
                        data_format.get_url_from_filename(
                          file_sql_data.file_name
                        ),
                        file_sql_data.name,
                        file_sql_data.file_type,
                        new Date(row.date),
                        row.read_by_receiver
                      );
                  } else if (type == "video") {
                    let video_sql_data = JSON.parse(row.message_body);
                    formated_data =
                      data_format.make_client_video_private_format_all(
                        row.id_sender,
                        row.id_receiver,
                        data_format.get_url_from_filename(
                          video_sql_data.file_name
                        ),
                        video_sql_data.name,
                        video_sql_data.file_type,
                        new Date(row.date),
                        row.read_by_receiver
                      );
                  } else {
                    formated_data = null;
                  }
                  msgs_formated.push(formated_data);
                }
                obj["lastmsgs_private"] = msgs_formated;
                ddb_epimessage_groups.get_groups_of_user(
                  user_id,
                  (err_groups, groups) => {
                    if (err_groups == null) {
                      obj["groups"] = groups;
                      ddb_epimessage_groups.get_last_message_per_groups_user(
                        user_id,
                        (err_lastmsgs_groups, last_msgs_groups) => {
                          if (err_lastmsgs_groups == null) {
                            msgs_formated = [];
                            for (let i = 0; i < last_msgs_groups.length; i++) {
                              let row = last_msgs_groups[i];
                              let type = row.type;
                              let formated_data;
                              if (type == "text") {
                                formated_data =
                                  data_format.make_client_msg_group_format_all(
                                    row.id_sender,
                                    row.group_id,
                                    row.message_body,
                                    new Date(row.date)
                                  );
                              } else if (type == "img") {
                                let img_sql_data = JSON.parse(row.message_body);
                                formated_data =
                                  data_format.make_client_img_group_format_all(
                                    row.id_sender,
                                    row.group_id,
                                    data_format.get_url_from_filename(
                                      img_sql_data.file_name
                                    ),
                                    img_sql_data.file_type,
                                    new Date(row.date)
                                  );
                              } else if (type == "file") {
                                let file_sql_data = JSON.parse(
                                  row.message_body
                                );
                                formated_data =
                                  data_format.make_client_file_group_format_all(
                                    row.id_sender,
                                    row.group_id,
                                    data_format.get_url_from_filename(
                                      file_sql_data.file_name
                                    ),
                                    file_sql_data.name,
                                    file_sql_data.file_type,
                                    new Date(row.date)
                                  );
                              } else if (type == "video") {
                                let video_sql_data = JSON.parse(
                                  row.message_body
                                );
                                formated_data =
                                  data_format.make_client_video_group_format_all(
                                    row.id_sender,
                                    row.group_id,
                                    data_format.get_url_from_filename(
                                      video_sql_data.file_name
                                    ),
                                    video_sql_data.name,
                                    video_sql_data.file_type,
                                    new Date(row.date)
                                  );
                              } else {
                                formated_data = null;
                              }
                              msgs_formated.push(formated_data);
                            }

                            obj["lastmsgs_groups"] = msgs_formated;
                            callback(false, obj);
                          } else {
                            console.log(err_lastmsgs_groups);
                            callback(true, null);
                          }
                        }
                      );
                    } else {
                      callback(true, null);
                    }
                  }
                );
              } else {
                console.log(err_lastmsgs_private);
                callback(true, null);
              }
            }
          );
        } else {
          callback(true, null);
        }
      });
    } else {
      callback(true, null);
    }
  });
}

module.exports = {
  get_init_data: get_init_data,
};
