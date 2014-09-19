/*
* @license plyfe-widgets-bootstrap Copyright (c) 2014, Plyfe Inc.
* All Rights Reserved.
* Available via the MIT license.
* see: http://github.com/plyfe/plyfe-widgets-bootstrap/LICENSE for details
*/

define(function(require) {
  'use strict';

  var utils = require('utils');
  var settings = require('settings');
  var environments = require('env');

  var widgets = [];
  var widgetCount = 0;
  var WIDGET_READY_TIMEOUT = 5000;

  var WIDGET_CSS = '' +
    '.plyfe-widget {' +
      'opacity: 0;' +
      'overflow-x: hidden;' +
      utils.cssRule('transition', 'opacity 300ms') +
    '}' +
    '\n' +
    '.plyfe-widget.ready {' +
      'opacity: 1;' +
    '}' +
    '\n' +
    '.plyfe-widget iframe {' +
      'display: block;' +
      'width: 100%;' +
      'height: 100%;' +
      'border-width: 0;' + // NOTE: has to be border-width for IE
      'overflow: hidden;' +
    '}';

  utils.customStyleSheet(WIDGET_CSS, { id: 'plyfe-widget-css' });

  function throwAttrRequired(attr) {
    throw new utils.PlyfeError('data-' + attr + ' attribute required');
  }

  function Widget(el) {
    this.el = el;
    this.venue = utils.dataAttr(el, 'venue');
    this.type  = utils.dataAttr(el, 'type');
    this.id    = utils.dataAttr(el, 'id');

    if(!this.venue) { throwAttrRequired('venue'); }
    if(!this.type) { throwAttrRequired('type'); }
    if(!this.id) { throwAttrRequired('id'); }

    var scheme = utils.dataAttr(el, 'scheme', settings.scheme);

    var domain = settings.domain;
    var port = settings.port;

    // Override the domain & port in settings only if there is a data-env set
    var env = utils.dataAttr(el, 'env');
    if(env) {
      domain = environments[env].domain;
      port = environments[env].port;
    }

    // Now override the domain & port again if there is a data-domain or data-
    // port present.
    domain = utils.dataAttr(el, 'domain', domain);
    port   = utils.dataAttr(el, 'port', port);

    var height = +utils.dataAttr(el, 'height');
    if(!height) { throwAttrRequired('height'); }

    var path = ['w', this.venue, this.type, this.id];

    var params = {
      theme:      utils.dataAttr(el, 'theme', settings.theme),
      theme_data: utils.dataAttr(el, 'theme-overrides'),
      treatment:  utils.dataAttr(el, 'treatment'),
      height:     height
    };

    if(utils.dataAttr(el, 'transparent-bg')) {
      params.transparent = 'true';
    }

    var url = utils.buildUrl(scheme, domain, port, path.join('/'), params);

    function widgetIsReady() {
      clearTimeout(readyTimeout);
      utils.addClass(el, 'ready');
    }

    var iframeName = 'plyfe-' + (++widgetCount);
    var iframe = document.createElement('iframe');
    iframe.onload = widgetIsReady;
    iframe.name = iframeName;
    iframe.src = url;
    iframe.scrolling = 'no';
    iframe.frameBorder = '0'; // NOTE: For IE <= 8
    iframe.allowTransparency = 'true'; // For IE <= 8
    utils.setStyles(iframe, { height: height });
    this.el.innerHTML = '';
    this.el.appendChild(iframe);
    this.iframe = iframe;
    var readyTimeout = setTimeout(widgetIsReady, WIDGET_READY_TIMEOUT);
  }

  function createWidget(el) {
    if(!el && el.nodeType === 3) { throw new utils.PlyfeError('createWidget() must be called with a DOM element'); }
    // Be defensive against repeated calls to createWidget()
    if(el.firstChild === null || el.firstChild.nodeName !== 'iframe') {
      widgets.push(new Widget(el));
    }
  }

  function destroyWidget(el) {
    if(el.nodeName !== 'iframe') {
      el = el.firstChild;
    }

    if(el && el.nodeName === 'iframe') {
      for(var i = widgets.length - 1; i >= 0; i--) {
        var widget = widgets[i];
        if(widget.iframe === el) {
          widgets.splice(i, 1); // delete the reference from the widgets array.
          el.parentNode.innerHTML = ''; // clean DOM
        }
      }
    }
  }

  function forEach(callback) {
    for(var i = widgets.length - 1; i >= 0; i--) {
      callback(widgets[i]);
    }
  }

  return {
    create: createWidget,
    distroy: destroyWidget,
    list: widgets,
    forEach: forEach
  };
});
