module.exports = (server_data) => {


    const JWT_SECRET = "adrien le plus beau";



    const express = require('express');
    const twig = require('twig');
    const app = express();
    const sessions = require('./others/sessions');
    const file_gestion = require("./others/files_gestion");
    const data_format = require('./others/data_format');
    const cors = require('cors');

    var jwt = require('jsonwebtoken');
    
    const ddb_permissions = require('./mysql/files_permissions_request');
    const ddb_epimessage = require("./mysql/messages_requests");
    
    var siofu = require("socketio-file-upload");
    
    // TWIG
    app.set('views', 'views');
    app.set('view engine', 'html');
    app.engine('html', twig.__express);
    

    app.use(cors({
        origin : "http://localhost:8080",
        credentials: true,
    }))

    app.use(siofu.router).listen(8000);
    app.use(express.static(__dirname + '/public'));

    app.use(express.json());
    app.use(express.urlencoded({
      extended: true
    }));
    

    
    app.get("/storage/:file_name", sessions.type_request, (req, res, next)=>{
        const file_name = req.params.file_name;
        file_gestion.exist_file(file_name, err => {
            if (err == null){
                ddb_permissions.user_has_access_to_file(req.session.Id, file_name, (err_find, res_find)=>{
                    if (err_find == null){
                        if (res_find){
                            res.sendFile(file_gestion.files_path + file_name);
                        }else{
                            res.status(401).json({err: "Vous n'avez pas les droits pour voir ce fichier"});
                        }
                    }else{
                        res.status(500).json({err: "Error during the verification of the files permissions."});
                    }
                });
            }else{
                res.status(404).json({err: "fichier introuvable."});
            }
        });
    });
    
    app.get("/emoji", (req, res, next)=>{
        res.sendFile("/var/node_js/epimessages/node_modules/node-emoji/lib/emoji.json");
    });
    
    app.get("/", sessions.type_request, (req, res, next) => {
        res.set({
            'Content-Type': 'text/html',
        });
        res.render("main");
    });
    
    
    
    /* BETA API */
    app.get("/api/send_call_invite", (req, res, next) => {

        res.status(200).json({message: "Lien envoyé"});
        return;
        const caller_id = req.session.Id;
        const responder_id = req.query.user_id;
        const responder_name = req.query.user_name;
        if (responder_id == undefined || responder_name == undefined){
            return;
        }

        let msg_body = "https://epinotes.core2duo.fr/EpiCall/epicall.php?call_dest_name="+responder_name+"#"+responder_id;

        ddb_epimessage.send_private_msgs(caller_id, responder_id, msg_body, (err_send) => {
            if (err_send == null){
              const msg = data_format.make_client_msg_private_format(caller_id, responder_id, msg_body);
              if (server_data.users_socket[caller_id] != undefined){
                server_data.users_socket[caller_id].emit("new_private_msg", msg);
              }
              if (server_data.users_socket[responder_id] != undefined){
                server_data.users_socket[responder_id].emit("new_private_msg", msg);
              }
            }
          });

          res.status(200).json({message: "Lien envoyé"});
    });

    app.get("/api/auth/token", (req, res, next) => {
        if (req.body && req.body.epinotes_id){
            var token = jwt.sign({
                epinotesid: req.body.epinotes_id
            }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({
                success: 1,
                token: token
            });
        }
        res.status(400).json({
            success: 0,
            error: "Veuillez bien renseigner l'<epinotes_id> dans le body."
        });
    });
    
    

    return app;
}

