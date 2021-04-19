var express = require('express');
var router = express.Router();
const mysql = require('mysql2');
const loginDetails = require('../loginDetails.json');
const connection = mysql.createConnection(loginDetails);

//set up db
connection.query('CREATE TABLE IF NOT EXISTS user( id varchar(255) PRIMARY KEY NOT NULL, username varchar(255) UNIQUE NOT NULL, password varchar(255) NOT NULL );', function(err, results, fields) {
    if (err == null) {
        connection.query('CREATE TABLE IF NOT EXISTS calendar( id varchar(255) PRIMARY KEY NOT NULL, title varchar(255) NOT NULL );', function(err, results, fields) {
            if (err == null) {
                connection.query('CREATE TABLE IF NOT EXISTS availability( id varchar(255) PRIMARY KEY NOT NULL, user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, datetime varchar(255) NOT NULL, free bool NOT NULL, CONSTRAINT fk_user FOREIGN KEY (user) REFERENCES user(username), CONSTRAINT fk_calendar FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
                    if (err == null) {
                        connection.query('CREATE TABLE IF NOT EXISTS access( id varchar(255) PRIMARY KEY NOT NULL, user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, access varchar(255) NOT NULL, CONSTRAINT fk_user_access FOREIGN KEY (user) REFERENCES user(username), CONSTRAINT fk_calendar_access FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
                            if (err == null) {
                                console.log("DB set up");
                            } else {
                                console.log(err);
                            }
                        });
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log(err);
            }
        });
    } else {
        console.log(err);
    }
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Timetabler' });
  //connection.query('SELECT * FROM users', function(err, results, fields) {
  //    res.render('index', { title: JSON.stringify(results) });
  //})
});

module.exports = router;
