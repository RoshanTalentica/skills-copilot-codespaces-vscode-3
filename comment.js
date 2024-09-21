//create webserver
var http = require('http');
//create filesystem
var fs = require('fs');
//create url
var url = require('url');
//create querystring
var qs = require('querystring');
//create template
var template = require('./lib/template.js');
//create db
var db = require('./lib/db');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var express = require('express');
var app = express();
var compression = require('compression');
app.use(compression());
app.use(express.static('public'));
app.get('*', function(request, response, next){
  db.query(`SELECT * FROM topic`, function(error, topics){
    request.topics = topics;
    next();
  });
});
app.get('/', function(request, response) {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(request.topics);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}`,
    `<a href="/create">create</a>`
  );
  response.send(html);
});
app.get('/page/:pageId', function(request, response, next) {
  db.query(`SELECT * FROM topic`, function(error, topics){
    if(error){
      throw error;
    }
    db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id=author.id WHERE topic.id=?`, [request.params.pageId], function(error2, topic){
      if(error2){
        throw error2;
      }
      var title = topic[0].title;
      var description = topic[0].description;
      var list = template.list(topics);
      var html = template.HTML(title, list,
        `<h2>${title}</h2>${description} <p>by ${topic[0].name}</p>`,
        `
        <a href="/create">create</a>
        <a href="/update/${request.params.pageId}">update</a>
        <form action="/delete_process" method="post">
          <input type="hidden" name="id" value="${request.params.pageId}">
          <input type="submit" value="delete">
        </form>
        `
      );
      response.send(html);
    });
  });
});
app.get('/create', function(request, response) {
  db.query(`SELECT * FROM topic`, function(error, topics){
    db.query(`SELECT