const cookie = require('cookie');
const fs = require('fs');
const phpUnserialize = require('php-unserialize');


const SESS_PATH = "/var/lib/php/sessions/";


function getSession_request(req, res, next){
    if(typeof req.headers.cookie === "string") {
        let sid = cookie.parse(req.headers.cookie);
        if(typeof sid.PHPSESSID === "undefined") {
            res.redirect("https://epinotes.core2duo.fr/");
        }else{
            fs.readFile(SESS_PATH + "sess_" + sid.PHPSESSID, 'utf-8', function(err,data) {
                if(!err) {
                    var sd = phpUnserialize.unserializeSession(data);
                    if (sd.Id != undefined){
                        req.session = sd;
                        next();
                    }else{
                        res.redirect("https://epinotes.core2duo.fr/");
                    }
                }
                else {
                    res.redirect("https://epinotes.core2duo.fr/");
                }
            });
        }
    }else{
        res.redirect("https://epinotes.core2duo.fr/");
    }
}

function getSession_socket(socket, callback){
    if(typeof socket.handshake.headers.cookie === "string") {
        var sid = cookie.parse(socket.handshake.headers.cookie);
        if(typeof sid.PHPSESSID === "undefined") {
            callback({error: "PHPSESSID of the cookie is undefined."}, null);
        }else{
            fs.readFile(SESS_PATH + "sess_" + sid.PHPSESSID, 'utf-8', function(err,data) {
                if(!err) {
                    var sd = phpUnserialize.unserializeSession(data);
                    if (sd.Id != undefined){
                        callback(null, sd);
                    }else{
                        callback({error: "Id is undefined in the sessions varaibles."}, null);
                    }
                }
                else {
                    callback({error: "Error during the reading of the session file. Maybe the file does not exist."}, null);
                }
            });
        }
    }else{
        callback({error: "The cookie type is not a string"}, null);
    }
}

module.exports = {
    type_request: getSession_request,
    type_socket: getSession_socket
};