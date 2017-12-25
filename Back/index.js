const express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

const Schema = mongoose.Schema;
const app = express();

mongoose.connect('mongodb://localhost/usesdb', { useMongoClient: true });
mongoose.Promise = global.Promise;

var UsesSchema = new Schema({
  uniqueId: String,
  ip: String,
  path: String,
  type: String,
  timestamp: Number,
  selector: String,
  which: Number,
  key: String,
  keyCode: Number,
  ctrlKey: Boolean,
  altKey: Boolean,
  shiftKey: Boolean
});

var UsesEvent  = mongoose.model('Uses', UsesSchema);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.get('/id', (req, res) => {
  var id = mongoose.Types.ObjectId();
  res.json({'id': id});
});

app.post('/report', (req, res) => {
  const reject = (n) => {
    res.status(500).send("Invalid request ("+n+")");
  };
  
  const success = () => {
    res.status(200).json({report: 'ok' });
  };
  
  if(req.body.hasOwnProperty("events") && 
    req.body.hasOwnProperty("id") &&
    typeof req.body.id == "string" &&
    req.body.events instanceof Array) {
      var remoteIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      var toSave = [];
      
      for(var i=0; i<req.body.events.length; i++) {
        req.body.events[i].ip = remoteIp;
        req.body.events[i].uniqueId = req.body.id;
        
        try {
          var ev = new UsesEvent(req.body.events[i]);
          toSave.push(ev);
        } catch(err) {reject(1);} //"Invalid request (1)"
      }
      
      if(toSave.length > 0) {
        UsesEvent.collection.insert(toSave, function(err) {
          if(err) {
            console.error(JSON.stringify(err));
            reject(2); //"Invalid request (2)"
          }
          
          success();
        });
      } else {
        success();
      }
  } else {reject(0);} //"Invalid request (0)"
});

app.listen(58888, () => console.log('Uses backend listening on port 58888!'));