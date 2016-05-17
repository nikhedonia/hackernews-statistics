"use strict";
var hn = require('./hn.js');
var express = require('express');
var app = express();
var co = require('co');
var bodyParser = require('body-parser');

function wait(ms){
  return new Promise( done=> setTimeout(done, ms) );
}

var db = {};

var N = 100;

function fetchHN(time, cb) {
  return co(function*(){
    while(1) {
      const start = Date.now();
      let tops = yield hn.getTopStories();
      let news = yield hn.getNewStories();

      let cache = {};
      let rankTime = Date.now();

      tops.slice(0,N)
        .map( (id, rank) => ({id, rank}) )
        .forEach( ({id, rank}) => {
          cache[id] = {id, rank, rankTime};
        })

      news.slice(0,N)
        .map( (id, pos) => ({id, pos}) )
        .forEach( ({id, pos}) => {
          if(cache[id])
            cache[id].pos = pos;
          else {
            cache[id] = {id, pos, rankTime};
          }
        })

      var items = [];
      for(let id in cache) {
        items.push( cache[id] );
      }

      var stories = yield items.map(
        ({id}) => hn.getItem(id)
      );

      var data = stories.map( s=> Object.assign(
        {age: cache[s.id].rankTime-s.time*1000},
        cache[s.id],
        s
      ));

      if( yield cb(data) ) return;
      const end = Date.now();
      yield wait(time - (end-start) );
    }
  });
}


var mongoose = require('mongoose');
var env = process.env;

var dbName = process.env.OPENSHIFT_APP_NAME || 'hn';
var url = '127.0.0.1:27017/' + dbName;
var port = process.env.OPENSHIFT_NODEJS_PORT  || 8080;

// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
  url = process.env.OPENSHIFT_MONGODB_DB_URL +
  process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect(url);
app.listen(port);

var StoryItem = mongoose.model('Story', mongoose.Schema({
  id: Number,
  rankTime: Number,
  rank: Number,
  pos: Number,
  score: Number,
  age: Number,
  kids: [Number],
  type: String,
  url: String,
  by: String,
  text: String,
  descendants: Number,
  title: String
}));



fetchHN(1000 * 60, (data) => {
  return new Promise( (done, reject) => {
    StoryItem.create(data, (err) => {
      if(err){ console.log(err); reject(err); }
      done();
    })
  });
});


app.get('*',express.static('public'));

app.post('/find', bodyParser.urlencoded({ extended: true }));
app.post('/find', bodyParser.json() );

app.post('/find',  (req, res) => {
  StoryItem.find(JSON.parse(req.body.q) , (e, data) =>
    res.end(e||JSON.stringify(data))
  );
});



