var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {title: 'Checkers'})
});

router.get('/game', (req, res) => {
  res.render('game', {title: 'Checkers'})
})

router.post('/createLobby', (req, res) => {
  if (req.body.length === undefined) {
    return res.status(400).send({ message: 'Invalid request; no length given', request: req.body });
  }

  const lobbyCode = Math.ceil(Math.random()*100000).toString()
  req.session.games = {}
  req.session.games[lobbyCode] = {}

  for (let i = 0; i < req.body.length; i++) {
    for (let j = 0; j < req.body.length; j++) {
      if (i%2 !== j%2) {
        if (i < 3) {
          req.session.games[lobbyCode][`${i},${j}`] = "p2"
        } else if (i >= req.body.length - 3) {
          req.session.games[lobbyCode][`${i},${j}`] = "p1"
        }
      }
    }
  }
  res.send(lobbyCode)
})

router.post('/requestBoard', (req, res) => {
  if (req.body.lobbyCode === undefined) {
    return res.status(400).send({ message: 'Invalid request; no length given', request: req.body });
  }
  res.send(req.session.games[req.body.lobbyCode])
})

module.exports = router
