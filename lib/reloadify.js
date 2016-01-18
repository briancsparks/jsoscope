
var _             = require('underscore');
var sendevent     = require('sendevent');
var watch         = require('watch');
//var uglify        = require('uglify-js');
var fs            = require('fs');
var path          = require('path');

var ENV   = process.env.NODE_ENV || 'development';

var polyfill = fs.readFileSync(path.join(__dirname, 'assets', 'eventsource-polyfill.js'), 'utf8');
var clientScript = fs.readFileSync(path.join(__dirname, 'assets', 'client-script.js'), 'utf8');

//var script  = uglify.minify(polyfill + clientScript, { fromString:true }).code;
var script  = polyfill + clientScript;

var reloadify = function(app, subdirs) {
  if (ENV !== 'development') {
    app.locals.watchScript = '';
    return;
  }

  var events = sendevent('/eventstream');

  app.use(events);

  var onChange = function(fs, curr, prev) {
    if (_.isString(fs)) {
      console.log('changed: ', fs);
    } else {
      console.log('changed: ', _.reduce(fs, function(m, f, key) {

        m[key] = true;
        return m;

      }, {}));
    }
    events.broadcast({msg:'reload'});
  };

  _.each(subdirs, function(subdir) {
    watch.watchTree(path.join(__dirname, '../', subdir), onChange);
  });

  app.locals.watchScript = '<script>' + script + '</script>';
};

module.exports = reloadify;

