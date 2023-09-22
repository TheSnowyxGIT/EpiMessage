module.exports = (server_data) => {
  const JWT_SECRET = "adrien le plus beau";

  const express = require("express");
  const twig = require("twig");
  const app = express();
  const sessions = require("./others/sessions");
  const file_gestion = require("./others/files_gestion");
  const data_format = require("./others/data_format");
  const cors = require("cors");
  const session = require("express-session");
  const { check_user, register } = require("./mysql/users_requests");
  const pool = require("./mysql/ddb_epimessage");
  const pgSession = require("connect-pg-simple")(session);

  const path = require("path");
  var jwt = require("jsonwebtoken");

  const ddb_permissions = require("./mysql/files_permissions_request");
  const ddb_epimessage = require("./mysql/messages_requests");

  var siofu = require("socketio-file-upload");

  // TWIG
  app.set("views", "views");
  app.set("view engine", "html");
  app.engine("html", twig.__express);

  app.use(
    cors({
      origin: "http://localhost:8080",
      credentials: true,
    })
  );

  app.use(
    session({
      store: new pgSession({
        pool: pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(siofu.router);
  app.use(express.static(__dirname + "/public"));

  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  app.get("/storage/:file_name", sessions.type_request, (req, res, next) => {
    const file_name = req.params.file_name;
    file_gestion.exist_file(file_name, (err) => {
      if (err == null) {
        ddb_permissions.user_has_access_to_file(
          req.session.Id,
          file_name,
          (err_find, res_find) => {
            if (err_find == null) {
              if (res_find) {
                res.sendFile(file_gestion.files_path + file_name);
              } else {
                res.status(401).json({
                  err: "Vous n'avez pas les droits pour voir ce fichier",
                });
              }
            } else {
              res.status(500).json({
                err: "Error during the verification of the files permissions.",
              });
            }
          }
        );
      } else {
        res.status(404).json({ err: "fichier introuvable." });
      }
    });
  });

  app.get("/emoji", (req, res, next) => {
    res.sendFile(path.resolve("node_modules/node-emoji/lib/emoji.json"));
  });

  app.get("/login", sessions.type_request_not, (req, res, next) => {
    res.set({
      "Content-Type": "text/html",
    });
    res.render("login");
  });

  app.post("/login", (req, res, next) => {
    const { email, password } = req.body;
    check_user(email, password, (err, res_find) => {
      if (err == null) {
        req.session.Id = res_find.id;
        req.session.name = res_find.name;
      } else {
        console.log(err);
        res.redirect("/login");
        return;
      }
      res.redirect("/");
    });
  });

  app.get("/register", sessions.type_request_not, (req, res, next) => {
    res.set({
      "Content-Type": "text/html",
    });
    res.render("register");
  });

  app.post("/register", (req, res, next) => {
    const { email, password, name } = req.body;
    register(email, password, name, (err, res_find) => {
      if (err == null) {
        req.session.Id = res_find.id;
        req.session.name = res_find.name;
      } else {
        console.log(err);
        res.redirect("/register");
        return;
      }
      res.redirect("/");
    });
  });

  app.get("/", sessions.type_request, (req, res, next) => {
    res.set({
      "Content-Type": "text/html",
    });
    res.render("main");
  });

  /* BETA API */
  app.get("/api/send_call_invite", (req, res, next) => {
    res.status(200).json({ message: "Lien envoyé" });
    return;
  });

  app.get("/api/auth/token", (req, res, next) => {
    if (req.body && req.body.epinotes_id) {
      var token = jwt.sign(
        {
          epinotesid: req.body.epinotes_id,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.status(200).json({
        success: 1,
        token: token,
      });
    }
    res.status(400).json({
      success: 0,
      error: "Veuillez bien renseigner l'<epinotes_id> dans le body.",
    });
  });

  return app;
};
