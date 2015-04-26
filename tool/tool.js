'use strict';

angular.module('Tool', [])
.factory('globalVariable', [
function () {

  function getProp(str) {
    var style = document.createElement('div').style
      , prefixs = ['webkit', 'Moz', 'ms', 'O']
      , len = prefixs.length
      , i = 0
      , prefix
      , prop
      ;

    if (str in style) {
      return str;
    } else {
      str = str.charAt(0).toUpperCase() + str.substr(1);

      for ( ; i < len; i++ ) {
        prefix = prefixs[i];
        prop = prefix + str;

        if (prop in style) {
          return prop;
        }
      }

      return false;
    }
  }

  if (!window.BK) {
    window.BK = {};
  }

  BK.hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch;
  BK.isFF = window.mozInnerScreenX !== undefined;
  BK.START = BK.hasTouch ? 'touchstart': 'mousedown';
  BK.MOVE = BK.hasTouch ? 'touchmove': 'mousemove';
  BK.CANCEL = BK.hasTouch ? 'touchcancel': 'mouseout';
  BK.END = BK.hasTouch ? 'touchend': 'mouseup';
  BK.TRANSFORM = getProp('transform');
  BK.TRANSITION = getProp('transition');
  BK.WHEEL =
      'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support 'wheel'
      document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least 'mousewheel'
      'DOMMouseScroll';
  BK.ANIMATION = getProp('animation');
  BK.ANIMATIONEEND = BK.isFF ? 'animationend' : 'webkitAnimationEnd';
  BK.CSSPREFIX = BK.isFF ? '-moz-' : '-webkit-';
  BK.SVGHEADER = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  BK.APIPATH = BK.ah + BK.av;
  BK.v = '0.9.10';
  return {};
}]);
