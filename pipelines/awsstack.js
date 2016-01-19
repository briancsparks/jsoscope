#!/usr/bin/env node

var _                     = require('underscore');
var superAgent            = require('superagent');
var libPath               = require('path');
var printf                = require('printf');
var assert                = require('assert');
var async                 = require('async');

var key;

var request = superAgent;

var ordinals = {};
var ordinal = function(scope, id) {
  var sc = ordinals[scope] = ordinals[scope] || {};
  if (!sc[id]) {
    sc[id] = _.keys(sc).length;
  }
  return sc[id];
};

var ordinalItems = {};
var addOrdinalItem = function(scope, id, sortable) {
  var sc = ordinalItems[scope] = ordinalItems[scope] || {};
  if (!sc[id]) {
    sc[id] = {id:id, ord:_.keys(sc).length, sortable:sortable};
  }
};

var sortOrdinalItems = function(scope) {
  var sc = ordinalItems[scope];
  var arr = _.chain(sc).map(function(item) {
    return item;
  }).sort(function(a,b) {
    if (a.sortable > b.sortable) { return 1; }
    if (a.sortable < b.sortable) { return -1; }
    return 0;
  }).value();

  sc = _.chain(arr).reduce(function(m, item, index) {
    m[item.id] = {id:item.id, sortable:item.sortable, ord:index};
    return m;
  }, {}).value();
  ordinalItems[scope] = sc;
};

var fixup = function(data) {
  data.cx *= 25;
  data.cy *= 10;

  data.cx += 30;
  data.cy += 20;
  return data;
};

request.get('http://localhost:3999/api/instances').end(function(err, res) {
  _.each(res.body, function(reservation) {
    _.each(reservation.Instances, function(instance) {
      addOrdinalItem('launchTime', instance.LaunchTime, (new Date(instance.LaunchTime)).getTime());
    });
  });

  sortOrdinalItems('launchTime');

  _.each(res.body, function(reservation) {
    return _.each(reservation.Instances, function(instance) {
      var data = {
        //cx  : instance.PrivateIpAddress.split('.')[3],
        cx  : ordinalItems.launchTime[instance.LaunchTime].ord,
        cy  : ordinal('vpc', instance.VpcId),
        fill: 'blue',
        r   : 8,
        _id : instance.InstanceId
      };
      data = fixup(data);

      data = _.extend(data, instance);

      request.put('http://localhost:3000/data')
        .send(data)
        .end(function(err, res) {
//          console.log(err, res.body);
        });
    });
  });

//  console.log(instances);
});

