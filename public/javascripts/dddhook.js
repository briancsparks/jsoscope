
/*global jQuery:false, d3:false, _:false, window:false, moment:false */

(function($, _, g) {

  if (!g.dddhook) {
    g.dddhook = {};
  }

  var ddd = g.dddhook;

  var groups = {};

  var svgWidth  = ddd.width  = 1350;
  var svgHeight = ddd.height = 500;

  var kv = ddd.kv = function(o, key, value) {
    o[key] = value;
    return o;
  };

  // Move an attr to the dest obj, and remove from src
  var move = function(dest, key, src) {
    dest[key] = src[key];
    delete src[key];
    return dest;
  };

  var resolve = ddd.resolve = function(container, key) {
    var item;

    if (container.d3) {
      item = resolve(container.d3, key);
      if (item) {
        return item;
      }
    }

    item = container[key];
    if (_.isFunction(item)) {
      item = item.call(this, container);
      return item;
    }
    return item;
  };

  /* var pageParam = */ ddd.pageParam = function(name, def) {
    var search = window.location.search.substr(1);
    var query = _.reduce(search.split('&'), function(m, param) {
      var parts = param.split('=');
      return kv(m, parts[0], _.rest(parts).join('='));
    }, {});
    return query[name] || def;
  };

  var D3Dataset = ddd.D3Dataset = function(options_) {
    var self = this;

//    self.dataset = [];
    self.datamap = {};

    var options                = options_          || {};
    var classed                = options.classed;
    var selector               = options.selector  || 'body';

    var shape     = self.shape = options.shape     || 'circle';

    options.onEach  = options.onEach || function(){};

    var inserter;
    if (options.inserter) {
      inserter    = options.inserter;
    } else if (shape) {
      if (classed) {
        inserter  = [shape, classed].join('.');
      } else {
        inserter  = shape;
      }
    }

    self.fetch = function(callback) {

      var query = options.query || {};

      return ddd.getJsonp(query.dbName, query.collection, query.query, {sort:query.sort}, function(response) {
        _.each(response.result, function(item) {
          return options.onEach(item);
        });
        return callback();
      });
    };

//    self.push = function(d3_, origItem) {
//      var d3 = _.extend({}, d3_, options.staticAttrs || {});
//      var item = _.extend({d3:d3}, origItem || {});
//      self.dataset.push(item);
//    };

    self.add = function(key, d3_, origItem) {
      var d3 = _.extend({}, d3_, options.staticAttrs || {});
      var item = _.extend({d3:d3}, origItem || {});
      self.datamap[key] = item;
    };


    self.draw = function() {

      // Put all the map items into the dataset
      var dataset = _.map(self.datamap, function(item, key) {
        item.d3._id = key;
        return item;
      });
      console.log('------------', self.datamap, dataset);

      // Each data item in self.dataset is in the 'original' format -- as fetched
      // from the server.  However, the D3-ified attributes are on item.d3.

      // Here, we get an object that has keys for all the d3' keys (all
      // set to true.)
      //
      // Loop over each datum in dataset
      var dataAttrs = _.reduce(dataset, function(m, datum) {
        // Loop over datum.d3 for the attribute names
        return _.extend(m, _.reduce(datum.d3, function(m2, val, key) {
          return kv(m2, key, true);
        }, {}));
      }, {});

      // DATA JOIN
      var records = d3.select(selector).selectAll(inserter).data(dataset, function(d) { return resolve(d, '_id'); });

      if (dataAttrs._id) {
        delete dataAttrs._id;
      }

      // ENTER - Create new elements as needed
      // New records
      var added = records.enter().append(shape);

      if (classed) {
        added.classed(classed, true);
      }

      // ENTER + UPDATE - apply stuff to all entering and updating elements
      if (dataAttrs.text) {
        records.text(function(d) { /*console.log('--------datext: ', d, resolve(d, 'text'));*/ return resolve(d, 'text'); });
        delete dataAttrs.text;
      }

      _.each(dataAttrs, function(value, key) {
        records.attr(key, function(d) { return resolve(d, key); });
      });

      // EXIT - remove old items
      records.exit().remove();
    };
  };

  /* var _tribool = */ g.dddhook._tribool = function(x, nonValue, falsyValue, truthyValue) {
    if (x === true)  { return truthyValue; }
    if (x === false) { return falsyValue; }

    return nonValue;
  };

  var getJson = g.dddhook.getJson = function(options, callback) {
    var data = _.extend({}, options || {});

    $.ajax({
      url       : 'http://localhost:3000/data',
      dataType  : 'json',
      data      : data,

      success   : function(response) {
        //console.log(response);
        callback(response);
      }
    });
  };

  $(function() {
    //$('#dddroot').empty();
    $('#dddroot').html('<div id="drawing"></div>');
    d3.select('#drawing').append('svg')
        .classed('drawing', true)
        .attr('width', svgWidth)
        .attr('height', svgHeight);

//    d3.select('svg.drawing').append('g').classed('all', true);

    var doOneRequest = function() {
      getJson({}, function(response) {

        // Dispatch all the items that we just downloaded
        _.each(response.items, function(item) {
          //if (!item.group) { return; }
          console.log(item);

          item.group = item.group || 'anon';

          var group = item.group;
          if (!groups[group]) {
            groups[group] = new D3Dataset({
              selector      : 'svg.drawing',
              shape         : 'circle',
              classed       : 'classy'
            });
          }

          var d3 = {};

          _.each(['cx', 'cy', 'r', 'fill', '_id'], function(key) {
            move(d3, key, item);
          });

          groups[group].add(resolve(d3, '_id'), d3, item);
        });

        // Draw all the groups
        _.each(groups, function(group) {
          group.draw();
        });

        return setTimeout(doOneRequest, 100);
      });
    };
    doOneRequest();
  });

}(jQuery, _, window));



