'use strict';

angular.module('Tool')
.factory('keyFrames', [
function () {
  var dynamicSheet
    , keyFramesHash = {}
    ;

  function getDynamicSheet() {
    var style;

    if(!dynamicSheet) {
      style = document.createElement('style');
      style.rel = 'stylesheet';
      style.type = 'text/css';
      document.getElementsByTagName('head')[0].appendChild(style);
      dynamicSheet = style.sheet;
    }
    return dynamicSheet;
  }

  function createKeyFrames(name, rules) {
    var sheet = getDynamicSheet()
      , idx
      ;

    try {
      idx = sheet.insertRule('@keyframes ' + name + '{' + rules + '}', sheet.cssRules.length);
    } catch(e) {
      if(e.name === 'SYNTAX_ERR' || e.name === 'SyntaxError') {
        idx = sheet.insertRule('@-webkit-keyframes ' + name + '{' + rules + '}', sheet.cssRules.length);
      } else {
        throw e;
      }
    }

    keyFramesHash[name] = true;
    return name;
  }

  return {
    create: createKeyFrames,
    get: function (name) {
      return keyFramesHash[name] || false;
    }
  };
}]);
