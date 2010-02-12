#!/usr/bin/env node

process.mixin(GLOBAL, require('assert'));
process.mixin(GLOBAL, require('sys'));

var Riak = require('riak');

var jjj = JSON.stringify;

var db = new Riak.Client({
  host: 'localhost',
  port: 8098,
});

var plan = 7;
var tc = 0;

/*
  /people/alice
    employee => /companies/widgets_inc
    author => /post/post0
    author => /post/post1
    author => /post/post2
*/


function addAuthor() {
  db.store('people', 'alice', 'writer extraordinare')
  .addCallback(function () {
    var headers = {
        'link': db.makeLinkHeader([
          { doc: '/memos/memo0', tag: 'author' },
          { doc: '/memos/memo1', tag: 'author' },
          { doc: '/memos/memo2', tag: 'author' }
        ])
    };
    db.store('people', 'alice', undefined,
             { headers: headers })
    .addCallback(function () {
      db.walk( ['people', 'alice'], [['_', 'author', 1]])
      .addCallback(function (resp) {
          debug("I walked: " + inspect(resp));
      });
    });
  });
}

var linkData = [
    { doc: "/memo/memo0", tag: "author" },
    { doc: "/memo/memo1", tag: "author" },
    { doc: "/memo/memo2", tag: "author" }
];

// TODO figure out a method to launch these in parallel (promise.Group ?)
db.store('memos', 'memo0', 'memo the first')
.addCallback(function () {
  equal(db.makeLinkHeader(linkData),
       '</raw/memo/memo0>; riaktag="author", ' +
       '</raw/memo/memo1>; riaktag="author", ' +
       '</raw/memo/memo2>; riaktag="author"');

  db.store('memos', 'memo1', 'memo the second')
  .addCallback(function () {

    db.store('memos', 'memo2', 'memo the third')
    .addCallback(function () {
      addAuthor();
    });
  });
});
