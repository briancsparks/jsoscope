var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'JS-OScope' });
});

var heldData = [], heldReqRes;

/* GET data. */
router.put('/data', function(req, res, next) {
  heldData.push(req.body);
  if (heldReqRes) {
    heldReqRes.res.json({items:heldData});
    heldReqRes = null;
    heldData = [];
  }
  res.json({ok:true, count:heldData.length});
});

/* GET data. */
router.get('/data', function(req, res, next) {
  if (heldData.length > 0) {
    res.json({items: heldData});
    heldData = [];
  } else {
    heldReqRes = {req:req, res:res};
  }
});

var diag = function() {
  console.log('number of held-data items: ' + heldData.length + ' holding a request: ' + !!heldReqRes);
  setTimeout(diag, 500000);
};
diag();

module.exports = router;
