var express = require('express');
var router = express.Router();

function determineLegality(x,y, position, length) {
  return x > 0 && y > 0 && x < length && y < length && position === ""
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.post('/requestMoves', ((req, res) => {
  if (req.body.x === undefined || req.body.y === undefined || req.body.roomCode === undefined) {
    return res.status(400).send({message: 'Invalid request', request: req.body})
  }
  const length = req.session.games[req.body.roomCode].length,
        piece  = req.session.games[req.body.roomCode].board[req.body.x][req.body.y],
        potentialMoves = [[-1.1], [1,1]],
        legalMoves     = []
  if (piece[0] === "P") {
    potentialMoves.push([-1,-1])
    potentialMoves.push([1,-1])
  }

  for (let vector of potentialMoves) {
    const nx = req.body.x + vector[0],
          ny = req.body.y + vector[y],
          npiece = req.session.games[req.body.roomCode].board[nx][ny]

   if (determineLegality(nx, ny, npiece, length)) {
     legalMoves.push(vector)
   }
  }

  res.send(legalMoves)
}))


module.exports = router;
