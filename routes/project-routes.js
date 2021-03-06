'use strict';

var _ = require('lodash'),
    sqs = require('../lib/aws/sqs');

module.exports = function (app, rootRef) {
  // process a POST generated by Zapier when new deal won in BASE
  app.post('/webhooks/base_crm', function(req, res, next) {
    var project = {
      name: req.body.deal__name,
      location: 'Lagos',
      billable: true,
      internal_billable: false
    };
    var projectRef = rootRef.child('projects').push(project);

    project.id = projectRef.toString().split('/').pop();
    sqs.broadcast({event_type: 'project_new', data: project});

    res.status(200).send('OK');
    next();
  });

  app.get('/api/v1/projects', function(req, res) {
    var projectsRef = rootRef.child('projects');
    var results = [];

    projectsRef.once('value', function(snap) {
      _.each(snap.val(), function(project, projectId) {
        project.id = projectId;
        results.push(project);
      });
      res.status(200).json(results);
    }, function(err) {
      res.status(500).json(err);
    });
  });
};
