/*
* @license plyfe-widgets-bootstrap Copyright (c) 2015, Plyfe Inc.
* All Rights Reserved.
* Available via the MIT license.
* see: http://github.com/plyfe/plyfe-widgets-bootstrap/LICENSE for details
*/

define(function(require) {
  'use strict';

  var utils = require('utils');
  var settings = require('settings');
  var widget = require('widget');
  var switchboard = require('switchboard');
  var environments = require('env');

  switchboard.setup();

  var globalInitFnName = 'plyfeAsyncInit';

  // Find <script> tag that loaded this code
  var scripts = document.getElementsByTagName('script');
  for(var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i];
    if(/\/plyfe-widgets-bootstrap.*?\.js(\?|#|$)/.test(script.src)) {
      settings.scheme = utils.dataAttr(script, 'scheme', settings.scheme);
      settings.env = utils.dataAttr(script, 'env', settings.env);

      var env = environments[settings.env] || environments.production;

      settings.domain = env.domain;
      settings.port   = env.port;

      settings.domain = utils.dataAttr(script, 'domain', settings.domain);
      settings.port   = +utils.dataAttr(script, 'port') || settings.port; // '+' casts to int

      globalInitFnName = utils.dataAttr(script, 'init-name', globalInitFnName);
      break;
    }
  }

  utils.domReady(function() {
    if(window[globalInitFnName] && typeof window[globalInitFnName] === 'function') {
      // NOTE: Have to use setTimeout to make sure that the rest of the
      // main.js executes first before we call the callback. If we don't then
      // there is a race condition where the window.Plyfe object won't exist
      // yet.
      setTimeout(window[globalInitFnName], 0);
    } else {
      createWidgets();
    }
  });

  function createWidgets() {
    var divs = document.querySelectorAll(settings.selector);
    for(var i = 0; i < divs.length; i++) {
      widget.create(divs[i]);
    }
  }

  function createWidget(el) {
    return widget.create(el);
  }

  function cardEvent(data, eventName) {
    // default to id of 0 when there is no data
    var user = utils.objectMerge(data.user, {id: 0});
    var card = utils.objectMerge(data.card, {id: 0, type: 'no_type'});
    plyfeObj['onCard' + eventName].call(plyfeObj, card, user);
  }

  function choiceEvent(data, eventName) {
    var user = utils.objectMerge(data.user, {id: 0});
    var card = utils.objectMerge(data.card, {id: 0, type: 'no_type'});
    var choice = utils.objectMerge(data.choice, {id: 0, name: 'no_name', correct: null});

    plyfeObj['onChoice' + eventName].call(plyfeObj, card, user, choice);
  }

  switchboard.on('card:start', function(data) { cardEvent(data, 'Start'); });
  switchboard.on('card:complete', function(data) { cardEvent(data, 'Complete'); });
  switchboard.on('choice:selection', function(data) { choiceEvent(data, 'Selection'); });

  var onCardStart = window.Plyfe && window.Plyfe.onCardStart || function(){} ;
  var onCardComplete = window.Plyfe && window.Plyfe.onCardComplete || function(){} ;
  var onChoiceSelection = window.Plyfe && window.Plyfe.onChoiceSelection || function(){} ;

  var plyfeObj = {
    settings: settings,
    createWidgets: createWidgets,
    createWidget: createWidget,
    onCardStart: onCardStart,
    onCardComplete: onCardComplete,
    onChoiceSelection: onChoiceSelection
  };

  return plyfeObj;
});
