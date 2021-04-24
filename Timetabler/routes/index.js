var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const loginDetails = require('../loginDetails.json');
const connection = mysql.createConnection(loginDetails);

function middlewareAuth(req, res, next) {
  if (req.session && req.session.userId) {
    connection.query('SELECT * FROM user WHERE id=?', [req.session.userId], function(err, results, fields) {
      if (results[0]) next();
      else res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
}

//set up db
connection.query('CREATE TABLE IF NOT EXISTS user( id varchar(255) PRIMARY KEY NOT NULL, username varchar(255) UNIQUE NOT NULL, password varchar(255) NOT NULL );', function(err, results, fields) {
  if (err == null) {
    connection.query('CREATE TABLE IF NOT EXISTS calendar( id varchar(255) PRIMARY KEY NOT NULL, title varchar(255) NOT NULL );', function(err, results, fields) {
      if (err == null) {
        connection.query('CREATE TABLE IF NOT EXISTS availability( PRIMARY KEY (user, calendar, datetime), user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, datetime varchar(255) NOT NULL, free bool NOT NULL, CONSTRAINT fk_user FOREIGN KEY (user) REFERENCES user(id), CONSTRAINT fk_calendar FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
          if (err == null) {
            connection.query('CREATE TABLE IF NOT EXISTS access( PRIMARY KEY (user, calendar), user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, access varchar(255) NOT NULL, CONSTRAINT fk_user_access FOREIGN KEY (user) REFERENCES user(id), CONSTRAINT fk_calendar_access FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
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
router.get('/', middlewareAuth, (req, res, next) => {
  connection.execute('SELECT access.calendar, access.access, calendar.title FROM access INNER JOIN calendar ON access.calendar=calendar.id WHERE access.user=?;', [req.session.userId], (err, results, fields) => {
    console.log(JSON.stringify(results));
    res.render('index', { title: 'Timetabler', calendars: results });
  });
});
router.get('/user', middlewareAuth, (req, res, next) => {
  connection.execute('SELECT access.access, calendar.title FROM access INNER JOIN calendar ON access.calendar=calendar.id WHERE access.user=? AND calendar.id=?', [req.session.userId, req.query.calendar], function(err, results, fields) {
    if (results[0] === null) {
      res.redirect("./");
    } else {
      if (err === null) {
        res.render('UserClient', {access: results[0].access, calendarTitle: results[0].title});
      } else {
        res.send(err);
      }
    }
  })
});
router.get('/admin', middlewareAuth, (req, res, next) => {
  connection.execute('SELECT title FROM calendar WHERE id=?;', [req.query.calendar], function(err, results, fields) {
    if (results[0] === null) {
      res.redirect("./");
    } else {
      if (err === null) {
        res.render('AdminClient', {calendar: req.query.calendar, calendarTitle: results[0].title});
      } else {
        res.send(err);
      }
    }
  });
});
router.get('/login', (req, res, next) => res.render('login'));

/* POST methods */
router.post('/clearUserAvailability', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('DELETE FROM availability WHERE user=? AND calendar=?', [req.session.userId, req.body.calendar], (err, results, fields) => {
    if (err) console.error(err);
    res.send(err ? "failure" : "success");
  });
});

router.post('/saveUserAvailability', middlewareAuth, (req, res, next) => {
  if ([req.body.calendar, req.body.datetime, req.body.free].includes(undefined)) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('INSERT INTO availability (user, calendar, datetime, free) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE free=?', [req.session.userId, req.body.calendar, req.body.datetime, req.body.free, req.body.free], (err, results, fields) => {
    if (err) console.error(err);
    res.send(err ? "failure" : "success");
  });
});

router.post('/getUserAvailability', middlewareAuth, (req, res, next) => {
  if (req.body.datetime === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT free FROM availability WHERE user=? AND calendar=? AND datetime=?;", [req.session.userId, req.body.calendar, req.body.datetime], function(err, results, fields) {
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

router.post('/getAllAvailabilities', middlewareAuth, (req, res, next) => {
  if (req.body.datetime === undefined || req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT free FROM availability WHERE calendar=? AND datetime=?;", [req.body.calendar, req.body.datetime], (err, results, fields) => {
    if (err) {
      res.send("Error");
    } else if (results.length === 0) {
      res.send("Empty");
    } else {
      res.send(results);
    }
  })
})

router.post('/getAvailabilities', middlewareAuth, (req, res) => {
  if (req.body.datetime === undefined || req.body.calendar === undefined || req.body.subset === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  req.body.subset = req.body.subset.split(',')
  console.log(`SELECT free FROM availability WHERE calendar=? AND datetime=? AND id IN (${req.body.subset.map((result) => result).join()})`)
  connection.execute(`SELECT free FROM availability WHERE calendar=? AND datetime=? AND user IN (${req.body.subset.map(() => "?").join()})`, [...[req.body.calendar, req.body.datetime], ...req.body.subset], (err, results) => {
    if (err) {
      res.send("Error");
    } else if (results.length === 0) {
      res.send("Empty");
    } else {
      res.send(results);
    }
  })
})

router.post('/getCalendarAccess', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('SELECT user FROM access WHERE calendar=?', [req.body.calendar],  (err, results) => {
    if (err) {
      res.send("Error")
    } else if (results.length === 0) {
      res.send("Empty")
    } else {
      connection.execute(`SELECT id, username FROM user WHERE id IN (${results.map(() => "?").join()})`, results.map((result) => result.user), (err, results) => {
        res.send(results)
      })

      // res.send(results);
    }
  })
})

router.post('/createCalendar', middlewareAuth, (req, res, next) => {
  if (req.body.calendarName === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT uuid();", function(err, results, fields) {
    let id = results[0]["uuid()"];
    console.log(JSON.stringify(results));
    if (err === null) {
      connection.execute("INSERT INTO calendar VALUES (?, ?);", [id, req.body.calendarName], function(err, results, fields) {
        if (err === null) {
          connection.execute("INSERT INTO access VALUES (?, ?, 'admin');", [req.session.userId, id], function(err, results, fields) {
            res.redirect("./user?calendar=" + id);
          });
        } else {
          res.send("Error");
        }
      });
    } else {
      res.send("Error");
    }
  });
});

router.post('/inviteUser', middlewareAuth, (req, res, next) => {
  if (req.body.username === undefined || req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT id FROM user WHERE username=?", [req.body.username], function(err, results, fields) {
    if (err === null && results[0] !== null) {
      console.log(JSON.stringify(results[0]));
      connection.execute("INSERT INTO access VALUES (?, ?, 'invited')", [results[0].id, req.body.calendar], function(err, results, fields) {
        if (err === null) {
          res.redirect("/user?calendar=" + req.body.calendar);
        } else {
          res.send(err);
        }
      });
    } else {
      res.send("Error");
    }
  });
});

router.post('/acceptInvite', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("UPDATE access SET access='user' WHERE user=? AND calendar=?", [req.session.userId, req.body.calendar], function(err, results, fields) {
    if (err === null) {
      res.send("success");
    } else {
      res.send(err);
    }
  });
});

router.post('/declineInvite', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("DELETE FROM access WHERE user=? AND calendar=?", [req.session.userId, req.body.calendar], function(err, results, fields) {
    if (err === null) {
      res.send("success");
    } else {
      res.send(err);
    }
  });
})

router.post('/register', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    connection.execute("INSERT INTO user VALUES (uuid(), ?, ?);", [req.body.username, hash], function(err, results, fields) {
      if (err == null) {
        connection.execute("SELECT id FROM user WHERE username=?", [req.body.username], function(err, results, fields) {
          if (err == null) {
            req.session.userId = results[0].id;
            res.redirect("/");
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
              res.redirect("/");
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

router.post('/logout', middlewareAuth, (req, res, next) => {
  try {
    req.session.destroy();
    res.send("success");
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
