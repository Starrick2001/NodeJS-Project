"use strict"

require("dotenv").config({silent: true});

const server = require("./lib/app");

server.listen(process.env.PORT || 2507);