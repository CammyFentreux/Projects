var express = require('express');
var router = express.Router();
const mysql = require('mysql2');
const loginDeatils = require('./loginDetails.json');
const connection = mysql.createConnection(loginDetails);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Timetabler' });
});

module.exports = router;
