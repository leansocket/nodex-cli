let libs = require('nodex-libs');

let args = require("./args");
libs.log.init(args.app.name);

let data = require('./data');
data.init(args.data);

let logic = require('./logic');
logic.init(args.logic);

let serv = require('./serv');
serv.start(args.serv);
