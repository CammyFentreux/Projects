var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const loginDetails = require('../loginDetails.json');
const connection = mysql.createConnection(loginDetails);

//set up db
connection.query('CREATE TABLE IF NOT EXISTS user( id varchar(255) PRIMARY KEY NOT NULL, username varchar(255) UNIQUE NOT NULL, password varchar(255) NOT NULL );', function(err, results, fields) {
  if (err == null) {
    connection.query('CREATE TABLE IF NOT EXISTS calendar( id varchar(255) PRIMARY KEY NOT NULL, title varchar(255) NOT NULL );', function(err, results, fields) {
      if (err == null) {
        connection.query('CREATE TABLE IF NOT EXISTS availability( PRIMARY KEY (user, calendar, datetime), user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, datetime varchar(255) NOT NULL, free bool NOT NULL, CONSTRAINT fk_user FOREIGN KEY (user) REFERENCES user(id), CONSTRAINT fk_calendar FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
          if (err == null) {
            connection.query('CREATE TABLE IF NOT EXISTS access( id varchar(255) PRIMARY KEY NOT NULL, user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, access varchar(255) NOT NULL, CONSTRAINT fk_user_access FOREIGN KEY (user) REFERENCES user(id), CONSTRAINT fk_calendar_access FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
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


/* GET methods */
router.get('/', (req, res, next) => res.render('index', { title: 'Timetabler' }));
router.get('/user', (req, res, next) => res.render('UserClient'));
router.get('/admin', (req, res, next) => res.render('AdminClient'));
router.get('/login', (req, res, next) => res.render('login'));

/* POST methods */
router.post('/clearUserAvailability', (req, res, next) => {
  if ([req.body.user, req.body.calendar].includes(undefined)) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('DELETE FROM availability WHERE user=? AND calendar=?', [req.body.user, req.body.calendar], (err, results, fields) => {
    if (err) console.error(err);
    res.send(err ? "failure" : "success");
  });
});

router.post('/saveUserAvailability', (req, res, next) => {
  if ([req.body.user, req.body.calendar, req.body.datetime, req.body.free].includes(undefined)) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('INSERT INTO availability (user, calendar, datetime, free) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE free=?', [req.body.user, req.body.calendar, req.body.datetime, req.body.free, req.body.free], (err, results, fields) => {
    if (err) console.error(err);
    res.send(err ? "failure" : "success");
  });
});

router.post('/getUserAvailability', (req, res, next) => {
  connection.execute("SELECT free FROM availability WHERE user=? AND datetime=?;", [req.body.user, req.body.datetime], function(err, results, fields) {
    if (err == null) {
      if (results[0]) {
        res.send(results[0].free + "");
      } else {
        res.send("empty");
      }
    } else {
      res.send("Error");
    }
  });
});

router.post('/register', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    connection.execute("INSERT INTO user VALUES (uuid(), ?, ?);", [req.body.username, hash], function(err, results, fields) {
      if (err == null) {
        connection.execute("SELECT id FROM user WHERE username=?", [req.body.username], function(err, results, fields) {
          if (err == null) {
            req.session.userId = results[0].id;
            res.redirect("/user");
          } else {
            res.send(err);
          }
        });
      } else {
        res.send(err);
      }
    });
  });
});

router.post('/login', (req, res, next) => {
  connection.execute("SELECT id, password FROM user WHERE username=?;", [req.body.username], function(err, results, fields) {
    if (err === null) {
      if (results[0]) {
        bcrypt.compare(req.body.password, results[0].password, function(err, result) {
          if (err) {
            res.send("Error logging in: " + err);
          } else {
            if (result) {
              req.session.userId = results[0].id;
              res.redirect("/user");
            } else {
              res.send("Incorrect Credentials");
            }
          }
        });
      } else {
        res.send("Incorrect Credentials")
      }
    } else {
      res.send("Error logging in: " + err);
    }
  });
});

router.post('/logout', (req, res, next) => {
  try {
    req.session.destroy();
    res.send("success");
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
