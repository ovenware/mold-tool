'use strict';

/**
* @ngdoc service
* @name Tool.hotkeyAgent
* @description
* # hotkeyAgent
* Factory in the Tool.
*/
angular.module('Tool')
.factory('hotkeyAgent', [
'util',
function (util) {
  var agents = []
    , agentMap = {}
    , inputAgents = []
    , keyupFunctions = []
    ;

  function handleKeydown(evt) {
    var target = evt.target.localName;

    if (target !== 'input' &&
        target !== 'textarea') {
      execFun(evt);
    } else {
      execFun(evt, true);
    }
  }

  function execFun(evt, isInput) {
    var arr = isInput ? inputAgents : agents
      , result
      , i = 0
      , agent
      ;

    for (i = 0; (agent = arr[i]); i++) {
      if (agent.keydownHandleFunction) {
        result = agent.keydownHandleFunction(evt);

        // 事件被处理
        if (result) {

          if (agent.keyuphandleFunction) {
            keyupFunctions.push(agent.keyuphandleFunction);
          }

          // 是否允许执行之后的处理函数
          if (result !== 'next') {
            evt.preventDefault();
            // unbindKeydown();
            break;
          }
        }
      } 
    }
  }

  function handleKeyup(evt) {
    var fun;

    while((fun = keyupFunctions.shift())) {
      fun(evt);
    }
    // bindKeydown();
  }

  /**
   * add agent
   * @param {Function} downFun
   * @param {Function} upFun
   * @param {Number}   priority
   */
  function add(downFun, upFun, priority, isInput) {
    var arr = isInput ? inputAgents : agents
      , agent = {}
      ;

    if (downFun) {
      agent.id = util.getUUID();
      agent.priority = priority || 0;
      agent.keydownHandleFunction = downFun;
      agent.keyuphandleFunction = upFun;
      agent.isInput = isInput;

      agentMap[agent.id] = agent;
      arr.push(agent);
    }

    arr.sort(function(a, b) {
      return a.priority - b.priority;
    });
    return agent.id;
  }

  /**
   * remove agent
   * @param {Function} downFun
   */
  function remove(agentId) {
    var agent = agentMap[agentId]
      , arr
      , i
      ;

    if (agent) {
      arr = agent.isInput ? inputAgents : agents;
      i = arr.indexOf(agent);
      arr.splice(i, 1);
      delete agentMap[agentId];
    }
  }

  /**
   * clear all agent
   */
  function clear() {
    agents.length = 0;
    inputAgents.length = 0;
  }

  function bindKeydown() {
    window.addEventListener('keydown', handleKeydown);
  }

  function unbindKeydown() {
    window.removeEventListener('keydown', handleKeydown);
  }

  bindKeydown();
  window.addEventListener('keyup', handleKeyup);

  return {
    length: function (isInput) {
      return isInput ? inputAgents.length : agents.length;
    },
    add: add,
    remove: remove,
    clear: clear
  };
}]);
