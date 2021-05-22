"use strict";
const http = require("http");
const Router = require("router");
const finalhandler = require("finalhandler");
const path = require("path");
const view = require("consolidate");
const qs = require("querystring");

const app = new Router();

const shortid = require("shortid");

const level = require("level");
const { read } = require("fs");
const dbpath = path.resolve("./db");
const db = level(dbpath);

app.use((req, res, next) => {
  res.render = function render(filename, params) {
    var file = path.resolve(__dirname, "..", "views", filename);
    view.mustache(file, params || {}, function (err, html) {
      if (err) {
        return next(err);
      }
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    });
  };
  next();
});

//parse froms
app.use((req, res, next) => {
  if (req.method !== "POST") {
    return next();
  }
  let body = "";
  req.on("data", (buf) => {
    body = body + buf.toString();
  });

  req.on("end", () => {
    req.body = qs.parse(body);
    next();
  });
});

app.get("/", (req, res) => {
  res.render("home.html");
});

app.post("/", (req, res) => {
  if (!req.body.url) {
    return res.render("home.html", {
      msg: "url missing",
    });
  }
  let id = shortid.generate();
  db.put(id, req.body.url, (err) => {
    if (err) {
      return res.render("home.html", {
        msg: err.toString(),
      });
    }

    let url = `http://${process.env.VIRTUAL_HOST}/${id}`;
    res.render("home.html", {
      msg: `Your url: ${url}`,
    });
  });
});

app.get("/:id", (req, res) => {
  db.get(req.params.id, (err, url) => {
    res.setHeader("Content-Type", "text-html");
    if (err) {
      res.statusCode = 404;
      return res.end("404 not found");
    }
    res.statusCode = 301;
    res.setHeader("Location", url);
    res.end();
  });
});

const server = http.createServer();
server.on("request", (req, res) => {
  app(req, res, finalhandler(req, res));
});

module.exports = server;
