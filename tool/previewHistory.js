'use strict';
angular.module('Tool')
.factory('previewHistory', function () {
  var history = []
    , lastLayer
    , current = -1
    ;

  function push(screen) {
    var start = current + 1
      , howmany = history.length - start
      ;

    history.splice(start, howmany, screen);
    current = history.length - 1;
    return history[current];
  }

  return {
    reset: function() {
      history.length = 0;
      current = -1;
    },
    push: push,
    prev: function() {
      return history[current - 1];
    },
    current: function() {
      return history[current];
    },
    next: function() {
      return history[current + 1];
    },
    backward: function() {
      --current;
      return history[current];
    },
    forward: function() {
      if (current < history.length -1) {
        current ++;
      }
      return history[current];
    },
    layer: function(l) {
      if (l !== undefined) {
        lastLayer = l;
      } else {
        return lastLayer;
      }
    }
  };
});
