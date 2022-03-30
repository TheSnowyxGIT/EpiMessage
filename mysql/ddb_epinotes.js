const mysql = require('mysql2');

const serverip = "localhost";
const username = "admin_notes";
const password = "#1536CSlBg[6";
const database = "epinotes";


const connection = mysql.createConnection({
   host: serverip,
   user: username,
   password: password,
   database: database
 });


module.exports = connection;