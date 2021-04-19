var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Timetabler' });
});

router.get('/user', (req, res, next) => res.render('UserClient'))
router.get('/admin', (req, res, next) => res.render('AdminClient'))

module.exports = router;
