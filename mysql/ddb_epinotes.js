const mysql = require('mysql2');

const serverip = process.env.DDB_HOST;
const username = process.env.DDB_USER;
const password = process.env.DDB_PASSWORD;
const database = process.env.DDB_NAME;


const connection = mysql.createConnection({
   host: serverip,
   user: username,
   password: password,
   database: database
 });


module.exports = connection;
