'use strict';

/**
 * @ngdoc service
 * @name Tool.operationRecord
 * @description
 * # operationRecord
 * Factory in the Tool.
 * operationRecord = {
 *   'id': ...
 *   'name': '',
 *   'action': {
 *     id1: {
 *       'method': 'update',
 *       'before': data,
 *       'after': data,
 *       'attr': ['heir']
 *     },
 *     id2: {
 *       'method': 'remove'
 *     },
 *     id3: {
 *       'method': 'remove'
 *     }
 *   },
 *   'status': ...     0 - recorded
 *                     1 - recording
 *                     2 - auto record
 *                         自动记录只记录一个unit，当有新的unit时关闭该记录并
 *                         创建另一条自动记录
 * }
 */
angular.module('Tool')
.factory('operationRecord', [
function () {
  var recordArray = []
    , status = {}
    , pointer
    , recordHash
    , recordId
    ;

  function nextId() {
    return ++recordId;
  }

  function reset() {
    recordId = 0;
    recordArray.length = 0;
    recordHash = {};
    pointer = -1;
    status.redo = false;
    status.undo = false;
  }

  /**
   * undo
   * @param  {String} id
   * @return {Object} record
   */
  function undo(id) {
    var i = pointer
      , end = 0
      , arr = []
      , record
      ;

    // stop current record
    stop();

    if (!id) {
      record = recordArray[pointer];

      if (record) {
        arr.push(record);
        pointer --;
      }
      checkStatus();
      return arr;
    }

    arr = [];

    for(; i >= end; i--) {
      // 获取record
      record = recordArray[i];
      arr.push(record);

      // 该条record为目标record, 变更指针位置
      if (record.id === id) {
        pointer = i;
        checkStatus();
        return arr;
      }
    }
    checkStatus();
    return [];
  }


  /**
   * redo
   * @param  {String} id
   * @return {Object} record
   */
  function redo(id) {
    var i = pointer + 1
      , end = recordArray.length
      , arr = []
      , record
      ;

    // stop current record
    stop();

    if (!id) {
      record = recordArray[pointer + 1];

      if (record) {
        arr.push(record);
        pointer ++;
      }
      checkStatus();
      return arr;
    }

    arr = [];

    for(; i < end; i++) {
      // 获取record
      record = recordArray[i];
      arr.push(record);

      // 该条record为目标record, 变更指针位置
      if (record.id === id) {
        pointer = i;
        checkStatus();
        return arr;
      }
    }
    checkStatus();
    return [];
  }

  /**
   * add a action to current record
   * @param  {String} unitId
   * @param  {Object} before
   * @param  {Object} after
   */
  function addAction(unitId, before, after) {
    var currentRecord = recordArray[pointer]
      , action
      , len
      ;

    // 清除pointer之后的所有record
    clearRedo();

    if (!currentRecord || currentRecord.status === 0) {
      // 当前记录不存在或者当前记录已经记录完成
      // 启动一个自动记录
      currentRecord = start(null, true);
    }

    len = Object.keys(currentRecord.action).length;
    action = currentRecord.action[unitId];

    if (currentRecord.status === 1) {
      // 如果是常规记录
      if (action) {
        action.after = angular.copy(after);
      } else {
        _addAction(currentRecord, unitId, before, after);
      }
    } else if (currentRecord.status === 2) {
      // 如果是自动记录
      if (len === 0) {
        // 记录中没有action
        _addAction(currentRecord, unitId, before, after);
      } else if (len === 1 && action) {
        // 记录中只有一条且与该unit相关的action
        action.after = angular.copy(after);
      } else {
        // 其他情况, 关闭当前记录, 再重新执行一次addAction
        stop();
        return addAction(unitId, before, after);
      }
    }
    return currentRecord;
  }

  /**
   * add new action to target record
   * @param {Object} record
   * @param {String} id
   * @param {Object} before
   * @param {Object} after
   */
  function _addAction(record, id, before, after) {
    var action = {
          'id': id,
          'before': angular.copy(before),
          'after': angular.copy(after)
        };

    record.action[id] = action;
  }

  /**
   * clear redo array and record hash
   * @return {void}
   */
  function clearRedo() {
    var redoArray = recordArray.splice(pointer + 1);

    redoArray.forEach(function(record) {
      var id = record.id;
      recordHash[id] = null;
      delete recordHash[id];
    });
    checkStatus();
  }

  /**
   * start a record
   * @param  {String}  name
   * @param  {Boolean} isAutoStart
   * @return {id} record id
   */
  function start(name, isAutoStart) {
    var id = nextId()
      , record = {
          'id': id,
          'name': name || ('Record ' + id),
          'action': {},
          'status': isAutoStart ? 2 : 1
        }
      , currentRecord = recordArray[pointer]
      ;

    // current record not stop
    if (currentRecord && currentRecord.status) {
      stop();
    }
    addRecord(record);
    return record;
  }

  /**
   * stop current record
   * @return {object} record
   */
  function stop() {
    var currentRecord = recordArray[pointer];

    if (!currentRecord) {
      return new Error('record not exists.');
    }

    if (currentRecord.status === 0) {
      return new Error('record already stop.');
    }

    if (checkRecord(currentRecord)) {
      currentRecord.status = 0;
      currentRecord.time = Date.now();
      return currentRecord;
    } else {
      // 没有记录下实质内容, 删除该条记录
      removeRecord(currentRecord);
      return false;
    }
  }

  /**
   * cancel current record
   * @return {object} record
   */
  function cancel() {
    var currentRecord = recordArray[pointer];

    if (currentRecord && currentRecord.status !== 0) {
      removeRecord(currentRecord);
    }
  }

  /**
   * save record
   * @param {Object} record
   */
  function addRecord(record) {
    // save record
    recordHash[record.id] = record;
    recordArray.push(record);
    // set pointer
    pointer = recordArray.length - 1;
    checkStatus();
  }

  /**
   * remove record
   * @param {Object} record
   */
  function removeRecord(record) {
    var i = 0
      , len = recordArray.length
      , target
      ;

    for (; i < len; i++) {
      target = recordArray[i];

      if (target === record) {
        recordArray.splice(i, 1);
      }
    }
    delete recordHash[record.id];
    pointer --;
    checkStatus();
  }

  /**
   * check record
   * @param  {Object} record
   * @return {Boolean} hasChange
   */
  function checkRecord(record) {
    var id
      , action
      , propertys
      ;

    for (id in record.action) {
      action = record.action[id];

      // 根据数据的存在与否确定该次操作的最终method
      if (!action.before && action.after) {
        action.method = 'create';
      } else if (!action.after && action.before) {
        action.method = 'delete';
      } else {
        propertys = findChangedProperty(action.before, action.after);

        if (propertys.length) {
          action.method = 'update';
          action.attr = propertys;
        } else {
          // 没有发生变化的参数，删除该条action
          delete record.action[id];
        }
      }
    }

    // 检查记录中是否有action
    if (!Object.keys(record.action).length) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * find changed property
   * @param  {Object} before
   * @param  {Object} after
   * @return {Array} property list
   */
  function findChangedProperty(before, after) {
    var propertyList = []
      , propertys = {}
      , property
      ;

    // 找出所有property
    for (property in before) {
      propertys[property] = true;
    }

    for (property in after) {
      propertys[property] = true;
    }

    // 遍历对比
    for (property in propertys) {
      if (!angular.equals(before[property], after[property])) {
        propertyList.push(property);
      }
    }
    return propertyList;
  }

  /**
   * check record status
   * @return {void}
   */
  function checkStatus() {
    var len = recordArray.length - 1;

    status.undo = pointer > -1;
    status.redo = pointer < len;
  }

  reset();

  return {
    status: function() {
      return status;
    },
    reset: reset,
    add: addAction,
    start: start,
    stop: stop,
    cancel: cancel,
    undo: undo,
    redo: redo
  };
}]);
