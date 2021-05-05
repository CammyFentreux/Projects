var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const loginDetails = require('../loginDetails.json');
const connection = mysql.createConnection(loginDetails);
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(require('../emailDetails.json'));
const Crypto = require('crypto')

function randomString(size = 21) {
  return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}

function reportError(err) {
  if (process.env.NODE_ENV !== "production") {
    return "We encountered an error. Please try again later.";
  } else {
    return err;
  }
}

function middlewareAuth(req, res, next) {
  if (req.session && req.session.username) {
    connection.query('SELECT * FROM user WHERE username=?', [req.session.username], function(err, results, fields) {
      if (!err && results[0]) next();
      else res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
}

function hasAccessToCalendar(req, res, next) {
  if (req.body.calendar) {
    connection.execute("SELECT access FROM access WHERE user=? AND calendar=?;", [req.session.username, req.body.calendar], function(err, results, fields) {
      if (!err && results[0]) next();
      else res.redirect("/login");
    });
  }
}

//set up db
connection.query('CREATE TABLE IF NOT EXISTS user( username varchar(255) PRIMARY KEY NOT NULL, password varchar(255) NOT NULL, email varchar(255) NOT NULL, verified bool DEFAULT "0" NOT NULL, emailHash varchar(255) );', function(err, results, fields) {
  if (err == null) {
    connection.query('CREATE TABLE IF NOT EXISTS calendar( id varchar(255) PRIMARY KEY NOT NULL, title varchar(255) NOT NULL, days varchar(255) DEFAULT "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday", times varchar(255) DEFAULT "9, 10, 11, 12, 1, 2, 3, 4, 5" );', function(err, results, fields) {
      if (err == null) {
        connection.query('CREATE TABLE IF NOT EXISTS availability( PRIMARY KEY (user, calendar, datetime), user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, datetime varchar(255) NOT NULL, free bool NOT NULL, CONSTRAINT fk_user_availability FOREIGN KEY (user) REFERENCES user(username), CONSTRAINT fk_calendar_availability FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
          if (err == null) {
            connection.query('CREATE TABLE IF NOT EXISTS access( PRIMARY KEY (user, calendar), user varchar(255) NOT NULL, calendar varchar(255) NOT NULL, access varchar(255) NOT NULL, CONSTRAINT fk_user_access FOREIGN KEY (user) REFERENCES user(username), CONSTRAINT fk_calendar_access FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
              if (err == null) {
                connection.query('CREATE TABLE IF NOT EXISTS inviteLinks( calendar varchar(255) PRIMARY KEY, inviteHash varchar(255) NOT NULL, inviteEndDate datetime NOT NULL, CONSTRAINT fk_inviteLinks_calendar FOREIGN KEY (calendar) REFERENCES calendar(id));', function(err, results, fields) {
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
  } else {
    console.log(err);
  }
});


function renderIndex(req, res, verified, errMessage) {
  connection.execute('SELECT access.calendar, access.access, calendar.title FROM access INNER JOIN calendar ON access.calendar=calendar.id WHERE access.user=?;', [req.session.username], (err, results, fields) => {
    var options = { title: 'Timetabler<br>Nice!', calendars: results };
    var errString = "";
    if (err) errString += reportError(err) + "<br>";
    if (errMessage) errString += errMessage;
    if (errString !== "") options.error = errString;
    if (typeof verified !== 'undefined') options.verified = verified;
    res.render('index', options);
  });
}

/* GET methods */
router.get('/', middlewareAuth, (req, res, next) => {
  renderIndex(req, res);
});

router.get('/user', middlewareAuth, (req, res, next) => {
  connection.execute('SELECT access.access, calendar.title, calendar.days, calendar.times FROM access INNER JOIN calendar ON access.calendar=calendar.id WHERE access.user=? AND calendar.id=?', [req.session.username, req.query.calendar], function(err, results, fields) {
    if (results[0] === null || !results[0].access) {
      res.redirect("./");
    } else {
      if (err === null) {
        res.render('UserClient', {access: results[0].access, calendarTitle: results[0].title, calendarDays: results[0].days, calendarTimes: results[0].times});
      } else {
        res.render('UserClient', {error: reportError(err)});
      }
    }
  })
});

router.get('/admin', middlewareAuth, (req, res, next) => {
  connection.execute('SELECT access.access, calendar.title, calendar.days, calendar.times FROM access INNER JOIN calendar ON access.calendar=calendar.id WHERE access.user=? AND calendar.id=?;', [req.session.username, req.query.calendar], function(err, results, fields) {
    console.log(err);
    if (!results || results[0] === null || results[0].access !== "admin") {
      res.redirect("./");
    } else {
      if (err === null) {
        res.render('AdminClient', {calendar: req.query.calendar, calendarTitle: results[0].title, calendarDays: results[0].days, calendarTimes: results[0].times});
      } else {
        res.render('AdminClient', {error: reportError(err)});
      }
    }
  });
});

router.get('/login', (req, res, next) => res.render('login'));

router.get('/joinCalendar', middlewareAuth, (req, res, next) => {
  connection.execute("SELECT inviteEndDate FROM inviteLinks WHERE calendar=? AND inviteHash=?", [req.query.calendar, req.query.inviteHash], function(err, results, fields) {
    if (err === null) {
      if (results[0]) {
        var inviteEndDate = new Date(results[0].inviteEndDate);
        if (new Date() < inviteEndDate) {
          connection.execute("INSERT INTO access VALUES (?, ?, 'user')", [req.session.username, req.query.calendar], function(err, results, fields) {
            if (err === null) {
              res.redirect("/user?calendar=" + req.query.calendar);
            } else {
              renderIndex(req, res, undefined, reportError(err));
            }
          });
        } else {
          renderIndex(req, res, undefined, "Invite link expired. Please ask the calendar admin for a new invitation.");
        }
      }
    } else {
      renderIndex(req, res, undefined, reportError(err));
    }
  })
});

router.get('/verifyEmail', (req, res, next) => {
  connection.execute("SELECT verified FROM user WHERE username=?", [decodeURIComponent(req.query.user)], function(err, results, fields) {
    if (err) {
      renderIndex(req, res, false, reportError(err));
    } else if (!results[0]) {
      renderIndex(req, res, false, "User not found. Please try again");
    } else {
      if (results[0].verified) {
        renderIndex(req, res, true);
      } else {
        connection.execute("UPDATE user SET verified='1' WHERE username=? AND emailHash=?;", [decodeURIComponent(req.query.user), decodeURIComponent(req.query.emailHash)], function(err, results, fields) {
          if (err === null) {
            if (results.changedRows === 0) {
              renderIndex(req, res, false);
            } else {
              renderIndex(req, res, true);
            }
          } else {
            renderIndex(req, res, false, reportError(err));
          }
        });
      }
    }
  })
});

/* POST methods */
router.post('/clearUserAvailability', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('DELETE FROM availability WHERE user=? AND calendar=?', [req.session.username, req.body.calendar], (err, results, fields) => {
    res.send(err ? reportError(err) : "success");
  });
});

router.post('/saveUserAvailability', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  if ([req.body.calendar, req.body.datetime, req.body.free].includes(undefined)) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('INSERT INTO availability (user, calendar, datetime, free) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE free=?', [req.session.username, req.body.calendar, req.body.datetime, req.body.free, req.body.free], (err, results, fields) => {
    res.send(err ? reportError(err) : "success");
  });
});

router.post('/getUserAvailability', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  if (req.body.calendar === undefined || req.body.datetime === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT free FROM availability WHERE user=? AND calendar=? AND datetime=?;", [req.session.username, req.body.calendar, req.body.datetime], function(err, results, fields) {
    if (err == null) {
      if (results[0]) {
        res.send(results[0].free + "");
      } else {
        res.send("empty");
      }
    } else {
      res.send(reportError(err));
    }
  });
});

router.post('/getAllAvailabilities', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  if (req.body.datetime === undefined || req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT free FROM availability WHERE calendar=? AND datetime=?;", [req.body.calendar, req.body.datetime], (err, results, fields) => {
    if (err) {
      res.send(reportError(err));
    } else if (results.length === 0) {
      res.send("empty");
    } else {
      res.send(results);
    }
  })
})

router.post('/getAvailabilities', middlewareAuth, hasAccessToCalendar, (req, res) => {
  if (req.body.datetime === undefined || req.body.calendar === undefined || req.body.subset === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  req.body.subset = req.body.subset.split(',')
  console.log(`SELECT free FROM availability WHERE calendar=? AND datetime=? AND user IN (${req.body.subset.map((result) => result).join()})`)
  connection.execute(`SELECT free FROM availability WHERE calendar=? AND datetime=? AND user IN (${req.body.subset.map(() => "?").join()})`, [...[req.body.calendar, req.body.datetime], ...req.body.subset], (err, results) => {
    if (err) {
      res.send(reportError(err));
    } else if (results.length === 0) {
      res.send("empty");
    } else {
      res.send(results);
    }
  })
})

router.post('/getCalendarAccess', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute('SELECT user FROM access WHERE calendar=?', [req.body.calendar],  (err, results) => {
    if (err) {
      res.send(reportError(err));
    } else if (results.length === 0) {
      res.send("empty");
    } else {
      connection.execute(`SELECT username FROM user WHERE username IN (${results.map(() => "?").join()})`, results.map((result) => result.user), (err, results) => {
        if (err) {
          res.send(reportError(err));
        } else {
          res.send(results);
        }
      });
    }
  });
});

router.post('/createCalendar', middlewareAuth, (req, res, next) => {
  if (req.body.calendarName === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT uuid();", function(err, results, fields) {
    let id = results[0]["uuid()"];
    if (err === null) {
      var days = "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday";
      if (req.body.calendarDays !== null && req.body.calendarDays !== "") days = req.body.calendarDays;
      var times = "9, 10, 11, 12, 1, 2, 3, 4, 5";
      if (req.body.calendarTimes !== null && req.body.calendarTimes !== "") times = req.body.calendarTimes;
      connection.execute("INSERT INTO calendar VALUES (?, ?, ?, ?);", [id, req.body.calendarName, days, times], function(err, results, fields) {
        if (err === null) {
          connection.execute("INSERT INTO access VALUES (?, ?, 'admin');", [req.session.username, id], function(err, results, fields) {
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

router.post('/createInviteLink', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  var inviteHash = randomString();
  connection.execute("SELECT * FROM inviteLinks WHERE calendar=?", [req.body.calendar], function(err, results, fields) {
    if (err === null) {
      var query = "UPDATE inviteLinks SET inviteHash=?, inviteEndDate=? WHERE calendar=?";
      var params = [inviteHash, new Date(new Date().getTime() + 86400000), req.body.calendar];
      if (!results[0]) {
        query = "INSERT INTO inviteLinks VALUES (?, ?, ?)";
        params = [req.body.calendar, inviteHash, new Date(new Date().getTime() + 86400000)];
      }
      connection.execute(query, params, function(err, results, fields) {
        if (err === null) {
          res.send("success: " + inviteHash);
        } else {
          res.send(err);
        }
      });
    }
  })
});

router.post('/inviteUser', middlewareAuth, hasAccessToCalendar, (req, res, next) => {
  if (req.body.username === undefined || req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  var access = "invited";
  if (req.body.inviteAsAdmin === "on") access = "invitedAsAdmin";
  console.log(req.body.inviteAsAdmin + ": " + access);
  connection.execute("INSERT INTO access VALUES (?, ?, ?)", [req.body.username, req.body.calendar, access], function(err, results, fields) {
    if (err === null) {
      res.redirect("/user?calendar=" + req.body.calendar);
    } else {
      res.send(err);
    }
  });
});

router.post('/revokeAccess', middlewareAuth, (req, res) => {
  if (req.body.calendar === undefined || req.body.username === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("DELETE FROM access WHERE calendar=? AND user=?", [req.body.calendar, req.body.username], (err, results) => {
    if (err === null) {
      connection.execute("DELETE FROM availability WHERE calendar=? AND user=?", [req.body.calendar, req.body.username], (err) => {
        if (err === null) {
          res.send("Success")
        } else {
          res.send("Error")
        }
      })
    } else {
      res.send("Error")
    }
  })
})

router.post('/acceptInvite', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("SELECT access FROM access WHERE user=? AND calendar=?", [req.session.username, req.body.calendar], function(err, results, fields) {
    if (err === null) {
      var access = "user";
      if (results[0].access === "invitedAsAdmin") access = "admin";
      console.log(access);
      connection.execute("UPDATE access SET access=? WHERE user=? AND calendar=?", [access, req.session.username, req.body.calendar], function(err, results, fields) {
        if (err === null) {
          res.send("success");
        } else {
          res.send(err);
        }
      });
    }
  });
});

router.post('/declineInvite', middlewareAuth, (req, res, next) => {
  if (req.body.calendar === undefined) {
    return res.status(400).send({ message: 'Invalid request', request: req.body });
  }
  connection.execute("DELETE FROM access WHERE user=? AND calendar=?", [req.session.username, req.body.calendar], function(err, results, fields) {
    if (err === null) {
      res.send("success");
    } else {
      res.send(err);
    }
  });
})

router.post('/register', (req, res, next) => {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    var emailHash = randomString();
    connection.execute("INSERT INTO user (username, password, email, emailHash) VALUES (?, ?, ?, ?);", [req.body.username, hash, req.body.email, emailHash], function(err, results, fields) {
      if (err === null) {
        req.session.username = req.body.username;
        sendVerificationEmail(res, req.body, emailHash);
        res.redirect("/");
      } else {
        res.send(err);
      }
    });
  });
});

function sendVerificationEmail(res, body, emailHash) {
  transporter.sendMail({
    from: "admin@timetabler.joeherbert.dev",
    to: body.email,
    subject: "Welcome to Timetabler!",
    html: "<h1>Welcome to Timetabler!</h1><h3>Please verify your email, " + body.username + "</h3><p>Thanks for signing up! Please confirm your email address and get started by clicking the button below</p><a href='https://timetabler.joeherbert.dev/verifyEmail?user=" + encodeURIComponent(body.username).replace(/\'/g, "&#39;") + "&emailHash=" + encodeURIComponent(emailHash).replace(/\'/g, "&#39;") + "'>Verify Now</a></body>"
  }, function(err, info) {
    if (err) {
      res.send(err);
    }
  });
}

router.post('/sendVerificationEmail', (req, res, next) => {
  var emailHash = randomString();
  connection.execute("UPDATE user SET emailHash=? WHERE username=?;", [emailHash, req.session.username], function(err, results, fields) {
    if (err === null) {
      connection.execute("SELECT email FROM user WHERE username=?;", [req.session.username], function(err, results, fields) {
        if (err === null && results[0]) {
          sendVerificationEmail(res, {
            email: results[0].email,
            username: req.session.username
          }, emailHash);
          res.send("success");
        } else {
          res.send(err);
        }
      });
    } else {
      res.send(err);
    }
  });
});

router.post('/login', (req, res, next) => {
  connection.execute("SELECT password FROM user WHERE username=?;", [req.body.username], function(err, results, fields) {
    if (err === null) {
      if (results[0]) {
        bcrypt.compare(req.body.password, results[0].password, function(err, result) {
          if (err) {
            res.send("Error logging in: " + err);
          } else {
            if (result) {
              req.session.username = req.body.username;
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
