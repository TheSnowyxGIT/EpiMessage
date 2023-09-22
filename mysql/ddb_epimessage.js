const { Pool, Client } = require("pg");
const fs = require("fs");

const host = process.env.DDB_HOST;
const username = process.env.DDB_USER;
const password = process.env.DDB_PASSWORD;
const database = process.env.DDB_NAME;

const pool = new Pool({
  user: username,
  host: host,
  database: database,
  password: password,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
    ca: [fs.readFileSync("eu-west-3-bundle.pem").toString()],
  },
});

module.exports = pool;
