#!/usr/bin/env node

'use strict';

const Path = require('path');

var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic(process.env.NEO4J_UID, process.env.NEO4J_PWD));

driver.onCompleted = function() {
  console.log('Successfully connected to Neo4J');
};

driver.onError = function(error) {
  console.log('Neo4J Driver instantiation failed', error);
};

var session = driver.session();


require('seneca')()
  .use('seneca-amqp-transport')
  .add('cmd:getNode,route:*', function(message, done) {
    var queryString = "MATCH (a:Route { cuid: '" + message.route + "' }) -[r:ROUTES_TO]-> (b) RETURN b";
    console.log(queryString);
    session
      .run(queryString)
      .then(function(result) {
        session.close();
        return done(null, result.records[0]._fields);
      })
      .catch(function(error) {
        console.log(error);
      });
  })
  .listen({
    type: 'amqp',
    pin: 'cmd:getNode,route:*',
    url: process.env.AMQP_URL
  });
