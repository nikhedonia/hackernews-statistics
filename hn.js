'use strict';
var request = require('request');

function getTopStories() {
  return new Promise( (done, err) =>
    request('https://hacker-news.firebaseio.com/v0/topstories.json',
       (e, res, data) => {
         if (e || res.statusCode != 200) err();
         done(JSON.parse(data));
       }
    )
  );
}

function getNewStories() {
  return new Promise( (done, err) =>
    request('https://hacker-news.firebaseio.com/v0/newstories.json',
      (e, res, data) => {
        if (e || res.statusCode != 200) err();
        done(JSON.parse(data));
      }
    )
  );
}


function getItem(item) {
  return new Promise( (done, err) =>
    request('https://'+`hacker-news.firebaseio.com/v0/item/${item}.json`,
      (e, res, data) => {
        if (e || res.statusCode != 200) err();
        done(JSON.parse(data));
       }
    )
  );
}

module.exports = {
  getTopStories,
  getNewStories,
  getItem
};

