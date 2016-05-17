"use strict";
var hn = require('hackernews-api');

var N = 30; // first page only

function scrapeHN(db, timeout, cb) {

  var start = Date.now();

  var rankings = {};

  var newStoryIds = hn.getNewStories()
    .slice(0, N)
    .map((id, pos) => ({id, pos}))

  var topStoryIds = hn.getTopStories()
    .slice(0, N)
    .map((id, rank) => ({id, rank}));

  [...newStoryIds, ...topStoryIds].forEach((o) => {
    rankings[o.id] = Object.assign({}, rankings[o.id]||{}, o);
  });


  for (let id in rankings) {
    db[id] = db[id]||{item: {}, scores: []};
  }

  for (let id in rankings) {
    let item = hn.getItem(id);
    const rank = rankings[id].rank;
    const pos = rankings[id].pos;
    const age = Date.now() - item.time*1000;
    const score = item.score;

    db[id].item = item;
    db[id].scores.push( {rank, pos, age, score} );
  }

  var end = Date.now();

  console.log(end-start);
  cb(db);
  setTimeout(_=>scrapeHN(db, timeout, cb) ,timeout-(end-start));
}

scrapeHN({}, 20000 , (db)=>console.log(db));
