var bugsnag = require("bugsnag");
bugsnag.register(process.env.BUGSNAG_API_KEY);

global._ = require('lodash');
global.t = require('moment');

var cookieParser = require('cookie-parser'),
    env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env],
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    firebaseAuth = require('./lib/firebase/auth'),
    baseWorker = require('./workers/base-worker')(),
    moment = require('moment-timezone'),
    routes = require('./routes');
    cron = require('./workers/base-worker');


function run(appdir, rootRef) {
app.use(cron);
  app.use(cookieParser());

  app.dir = appdir;

  // things to do on each request
  app.use(function (req, res, next) {
    // log each request in development environment
    if(env !== 'production') console.log(t().format('HH:MM'), req.method, req.url, req.socket.bytesRead); 
    // tell the client what firebase to use
    res.cookie('rootRef', rootRef.toString());

    next();
  });

  // static files
  app.use(express.static(app.dir + '/public'));

  // Standard error handling
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  // to support JSON-encoded bodies
  app.use(bodyParser.json());
  // to support URL-encoded bodies
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  //start cron worker
  app.use(moment,baseWorker);

  routes(app, config, rootRef);

  // Fire up server
  var server = app.listen(process.env.PORT || 5555, function() {
    console.log('Listening on port %d', server.address().port);
  });
}

firebaseAuth.authWithCustomToken(function(err, rootRef) {
  run(process.cwd(), rootRef);
});