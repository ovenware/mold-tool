'use strict';

angular.module('Tool')
.factory('svgUtil', [
function () {
  var svgNS = 'http://www.w3.org/2000/svg'
    , pathArgHash = {
        'a': ['rx', 'ry', 'xAxisRotation', 'largeArc', 'sweep', 'x', 'y'],
        'c': ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
        'h': ['x'],
        'l': ['x', 'y'],
        'm': ['x', 'y'],
        'q': ['x1', 'y1', 'x', 'y'],
        's': ['x2', 'y2', 'x', 'y'],
        't': ['x', 'y'],
        'v': ['y'],
        'z': []
      }
    , pathReg = /([astvzqmhlc])([^astvzqmhlc]*)/ig
    , scaleSVGData
    , translateSVGData
    ;

  function translateTspan(data, x, y) {
    return {
      dx: (data.dx || 0) + x,
      dy: (data.dy || 0) + y
    };
  }

  // 创建元素节点
  function createSVGNode(tagName, parentNode) {
    var node = document.createElementNS(svgNS, tagName);

    if (parentNode) {
      parentNode.appendChild(node);
    }
    return node;
  }

  function getVertex(b) {
    var minX = b.x
      , midX = b.x + (b.width / 2)
      , maxX = b.x + b.width
      , minY = b.y
      , midY = b.y + (b.height / 2)
      , maxY = b.y + b.height
      , v = []
      ;

    v = [
      {x: minX, y: minY, index: 0},
      {x: midX, y: minY, index: 1},
      {x: maxX, y: minY, index: 2},
      {x: maxX, y: midY, index: 3},
      {x: maxX, y: maxY, index: 4},
      {x: midX, y: maxY, index: 5},
      {x: minX, y: maxY, index: 6},
      {x: minX, y: midY, index: 7}
    ];

    return v;
  }

  function parseValues(args){
    args = args.match(/-?[.0-9]+(?:e[-+]?\d+)?/ig);
    return args ? args.map(Number) : [];
  }

  function parsePathItem(type, data) {
    var hash = pathArgHash[type]
      , i = 0
      , len = hash.length

      , output = {}
      ;

    for (; i < len; i++) {
      output[hash[i]] = data[i];
    }
    return output;
  }

  /**
   * 解析path路径字符串
   * @param  {String} path 路径字符串
   * @return {Object}
   */
  function parsePath(path) {
    var output = []
      ;

    path.replace(pathReg, function(_a, _command, _args) {
      var type = _command.toLowerCase()
        , argLength
        , item = {};

      _args = parseValues(_args);

      // moveto缩写路径
      if (type === 'm' && _args.length > 2) {
        output.push({'type': _command, 'x': _args.shift(), 'y': _args.shift()});
        type = 'l';
        _command = _command === 'm' ? 'l' : 'L';
      }

      argLength = pathArgHash[type].length;
      while (true) {

        if (_args.length === argLength) {
          item = parsePathItem(type, _args);
          item.type = _command;
          output.push(item);
          return ;
        } else if (_args.length > argLength) {
          item = parsePathItem(type, _args.splice(0, argLength));
          item.type = _command;
          output.push(item);
        } else {
          throw new Error('Illegal path data.');
        }
      }
    });
    return output;
  }

  function BaseTranslate(data, x, y) {
    data = data || {'x':0, 'y':0};
    data.x += x;
    data.y += y;
    return data;
  }

  translateSVGData = {
    line: function(data, x, y) {
      data = data || {'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0};
      data.x1 += x;
      data.x2 += x;
      data.y1 += y;
      data.y2 += y;

      return data;
    },
    rect: BaseTranslate,
    text: BaseTranslate,
    ellipse: function(data, x, y) {
      data = data || {'cx':0, 'cy':0};
      data.cx += x;
      data.cy += y;

      return data;
    },
    path: function(data, x, y) {
      var i = 0
        , items = parsePath(data)
        , item
        , type
        , output = []
        ;

      for (; (item = items[i]); i++) {
        type = item.type;

        if (type === 'Z' ||
            type === 'z' ||
            type === type.toLowerCase()) {
        } else {

          if (typeof item.x !== 'undefined') {
            item.x += x;
          }

          if (typeof item.y !== 'undefined') {
            item.y += y;
          }

          if (typeof item.x1 !== 'undefined') {
            item.x1 += x;
            item.y1 += y;
          }

          if (typeof item.x2 !== 'undefined') {
            item.x2 += x;
            item.y2 += y;
          }
        }
        output.push(item);
      }
      return output;
    }
  };

  scaleSVGData = {
    path: function (node, dist, hid, pointRatio, isAutoCorrection) {
      var i = 0
        , b
        , len = node.pathSegList.numberOfItems
        , item
        , type;

      // 如果本次操作将导致width或height小于1
      // 则移动距离增加1
      if (isAutoCorrection) {
        b = node.getBBox();

        if (Math.abs(b.width + dist.x) < 1) {
          dist.x += 1;
        }

        if (Math.abs(b.height + dist.y) < 1) {
          dist.y += 1;
        }
      }

      // 遍历修改每一个路径点
      for (; i < len; i++) {
        item = node.pathSegList.getItem(i);
        type = item.pathSegTypeAsLetter;

        if (type === 'Z') {
          continue;
        }

        item.x += dist.x * pointRatio[i].x;
        item.y += dist.y * pointRatio[i].y;

        if (typeof item.r1 !== 'undefined') {
          item.r1 += dist.x * pointRatio[i].r1;
          item.r2 += dist.y * pointRatio[i].r2;
        }

        if (typeof item.x1 !== 'undefined') {
          item.x1 += dist.x * pointRatio[i].x1;
          item.y1 += dist.y * pointRatio[i].y1;
        }

        if (typeof item.x2 !== 'undefined') {
          item.x2 += dist.x * pointRatio[i].x2;
          item.y2 += dist.y * pointRatio[i].y2;
        }
      }
    },
    line: function() {
    }
    // ,
    // ellipse: function(data, sx, sy, ox, oy) {
    // },
    // rect: function(data, sx, sy, ox, oy) {
    // }
  };

  /**
   * Given a screen point (of type SVGPoint), returns the point relative to the coordinate system associated with someSvgObject. Assumes someSvgObject is some type of SVG object such as a circle object.
   * @param  {Object} screenPoint
   * @param  {Object} someSvgObject
   */
  function coordinateTransform(screenPoint, someSvgObject) {
    var CTM = someSvgObject.getScreenCTM();
    return screenPoint.matrixTransform(CTM.inverse());
  }

  /**
   * 获取给定点在目标元素坐标系统中的位置
   * @param  {Number} x
   * @param  {Number} y
   * @param  {SVGElement} svg        所在SVG
   * @param  {SVGElement} targetNode 目标元素
   * @return {Object}
   */
  function getPosition(x, y, svg, targetNode) {
    var point = svg.createSVGPoint()
      , pointAfterTransform;

    point.x = x;
    point.y = y;

    pointAfterTransform = coordinateTransform(point, targetNode || svg);

    return {
      'x': Math.round(pointAfterTransform.x),
      'y': Math.round(pointAfterTransform.y)
    };
  }

  function adjustDist(dist, handlerId) {
    // 依据方向修正距离参数
    // 1、锁定纵横
    //    控制点是1、5时，横轴锁定
    //    控制点是3、7时，纵轴锁定
    // 2、反向调整
    //    控制点是0、1、2时，横轴反向
    //    控制点是0、6、7时，纵轴反向
    switch (handlerId) {
      case 0:
        dist.x = -dist.x;
        dist.y = -dist.y;
        break;
      case 1:
        dist.x = 0;
        dist.y = -dist.y;
        break;
      case 2:
        dist.y = -dist.y;
        break;
      case 3:
        dist.y = 0;
        break;
      case 4:
        break;
      case 5:
        dist.x = 0;
        break;
      case 6:
        dist.x = -dist.x;
        break;
      case 7:
        dist.x = -dist.x;
        dist.y = 0;
        break;
    }
    return dist;
  }

  function setCTM(node, matrix) {
    node.setAttribute('transform', getMatrixString(matrix));
  }

  function getMatrixString(matrix) {
    return 'matrix('+matrix.a+','+matrix.b+','+matrix.c+','+matrix.d+','+matrix.e+','+matrix.f+')';
  }

  function setClipPath(node, width, height) {
    var id = width + '-' + height + '-clipPath'
      , cp = document.getElementById(width + '-' + height + '-clipPath')
      ;

    if (!cp) {
      createClipPath(node, width, height);
    }
    node.style.clipPath = 'url(#' + id + ')';
  }

  function createClipPath(node, width, height) {
    var svg = node.viewportElement
      , defs = svg.querySelector('.shared-defs')
      , cp = createSVGNode('clipPath')
      , rect = createSVGNode('rect')
      ;

    if (!defs) {
      defs = createSVGNode('defs');
      angular.element(defs).addClass('shared-defs');
      svg.appendChild(defs);
    }

    cp.id = width + '-' + height + '-clipPath';
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);

    cp.appendChild(rect);
    defs.appendChild(cp);
  }

  /**
   * 获取目标元素transform后的BBox
   * @param  {Object} n 目标元素
   * @return {Object}   BBox
   */
  function getBBoxWithTransform(node) {
    var b = node.getBBox()
      , matrix = node.getTransformToElement(node.parentNode)
      ;

    b.x += matrix.e;
    b.y += matrix.f;
    b.width *= matrix.a;
    b.height *= matrix.d;
    return b;
  }

  function getBorderRect(node, wrapper, rect) {
    var transform = node.getTransformToElement(wrapper)
      , bBox
      ;

    try {
      bBox = node.getBBox(node);
    } catch (err) {
      bBox = {};
    }

    if (!rect) {
      rect = createSVGNode('rect');
      wrapper.appendChild(rect);
    }
    rect.setAttribute('x', (bBox.x * transform.a + transform.e));
    rect.setAttribute('y', (bBox.y * transform.d + transform.f));
    rect.setAttribute('width', Math.abs(bBox.width * transform.a) || 1);
    rect.setAttribute('height', Math.abs(bBox.height * transform.d) || 1);
    return rect;
  }

  function getFullSizeScaling(node, svg, border) {
    var canvas = svg.getBoundingClientRect()
      , svgh = canvas.height - (border.v || 0)
      , svgw = canvas.width - (border.h || 0)
      , bbox = getBBoxWithTransform(node)
      , aspectRatio = bbox.width / bbox.height
      , scaling
      ;

    if (aspectRatio > (svgw / svgh)) {
      scaling = svgw / bbox.width;
    } else {
      scaling = svgh / bbox.height;
    }
    return parseFloat(scaling.toFixed(4));
  }
  /**
   * 碰撞测试 collision detection
   * @param  {Object} s1
   * @param  {Object} s2
   * @return {Boolean}
   */
  function collisionDetection(s1, s2) {
    return !(s2.x[0] > s1.x[2] ||
             s2.x[2] < s1.x[0] ||
             s2.y[0] > s1.y[2] ||
             s2.y[2] < s1.y[0]);
  }
  /**
   * get gap between two obj and
   * reference line's start end mid position
   * @param  {Object} s1
   * @param  {Object} s2
   * @param  {Object} gapHash
   * @param  {Boolean} isAccurate
   * @return {void}
   */
  function getGapBetween(s1, s2, gapHash, isAccurate) {
    var horizon = []
      , vertical = []
      , horizonHash
      , verticalHash
      , i
      , h
      , v
      , top
      , right
      , bottom
      , left
      , hmid
      , vmid
      , gap
      ;

    // 是否排除延长线不相交的元素
    if (!isAccurate && (
        (s2.x[0] > s1.x[2] && s2.y[0] > s1.y[2]) || // s1 在 s2 左上
        (s2.x[2] < s1.x[0] && s2.y[0] > s1.y[2]) || // s1 在 s2 右上
        (s2.x[2] < s1.x[0] && s2.y[2] < s1.y[0]) || // s1 在 s2 右下
        (s2.x[0] > s1.x[2] && s2.y[2] < s1.y[0]))) { // s1 在 s2 左下
      return;
    }

    if (s2.x[0] > s1.x[2]) {
      // s2 在 s1 右边
      h = s2.x[0] - s1.x[2];
      horizon.push(s1.x[2], s2.x[0]);
    } else if (s2.x[2] < s1.x[0]) {
      // s2 在 s1 左边
      h = s1.x[0] - s2.x[2];
      horizon.push(s2.x[2], s1.x[0]);
    }

    if (s2.y[0] > s1.y[2]) {
      // s2 在 s1 下边
      v = s2.y[0] - s1.y[2];
      vertical.push(s1.y[2], s2.y[0]);
    } else if (s2.y[2] < s1.y[0]) {
      // s2 在 s1 上边
      v = s1.y[0] - s2.y[2];
      vertical.push(s2.y[2], s1.y[0]);
    }

    if (h) {

      for (i = 0; (gap = gapHash.h[i]); i++) {

        if (gap.gap === h) {
          horizonHash = gap;
        }
      }
      // 确定参考线起始点
      if (s2.y[0] < s1.y[0]) {
        top = s1.y[0];
      } else {
        top = s2.y[0];
      }
      // 确定参考线结束点
      if (s2.y[2] > s1.y[2]) {
        bottom = s1.y[2];
      } else {
        bottom = s2.y[2];
      }
      // 计算出参考线所处的位置
      hmid = top + (bottom - top) /2;
      horizon.push(hmid);
      horizon = horizon.join('|');

      if (!horizonHash) {
        horizonHash = {
          'gap': h,
          'points': []
        };
        gapHash.h.push(horizonHash);
      }

      if (horizonHash.points.indexOf(horizon) === -1) {
        horizonHash.points.push(horizon);
      }
    }

    if (v) {

      for (i = 0; (gap = gapHash.v[i]); i++) {

        if (gap.gap === v) {
          verticalHash = gap;
        }
      }
      // 确定参考线起始点
      if (s2.x[0] < s1.x[0]) {
        left = s1.x[0];
      } else {
        left = s2.x[0];
      }
      // 确定参考线结束点
      if (s2.x[2] > s1.x[2]) {
        right = s1.x[2];
      } else {
        right = s2.x[2];
      }
      // 计算出参考线所处的位置
      vmid = left + (right - left) /2;
      vertical.push(vmid);
      vertical = vertical.join('|');

      if (!verticalHash) {
        verticalHash = {
          'gap': v,
          'points': []
        };
        gapHash.v.push(verticalHash);
      }

      if (verticalHash.points.indexOf(vertical) === -1) {
        verticalHash.points.push(vertical);
      }
    }
    return gapHash;
  }

  /**
   * get gap anchor point
   * {
   *   'h': {
   *     'gapNumber1': {
   *       'anchorPoint1': true,
   *       'anchorPoint2': true,
   *       ......
   *     }
   *   },
   *   'v': {
   *     ......
   *   }
   * }
   * @param  {Object} siblings
   * @return {void}
   */
  function getGapPoint(siblings) {
    var i = 0
      , j = 0
      , gapAnchorPoint = {
          'h': [],
          'v': []
        }
      , target
      , sibling
      ;

    for (; (target = siblings[i]); i++) {

      for (j = i + 1; (sibling = siblings[j]); j++) {

        if (!collisionDetection(target, sibling)) {
          getGapBetween(target, sibling, gapAnchorPoint);
        }
      }
    }
    gapAnchorPoint.h.sort(function(a, b) {
      return a.gap > b.gap;
    });
    gapAnchorPoint.v.sort(function(a, b) {
      return a.gap > b.gap;
    });

    return gapAnchorPoint;
  }

  /**
   * snap to gap
   * @param  {Object}  pointAfterMove
   * @param  {Object}  gapPoints
   * @param  {Object}  correctValue
   * @param  {Boolean} isHorizon
   * @return {void}
   */
  function _snapToGap(pointAfterMove, gapArray, correctValue, anchorPoint, isHorizon) {
    var attr = isHorizon ? 'x' : 'y'
      , anchorGapArray = isHorizon ? anchorPoint.h : anchorPoint.v
      , i = 0
      , j = 0
      , gapData
      , gap
      , gapPoints
      , anchorData
      , anchorGap
      , currentPoint
      , offset
      ;

    for (; (gapData = gapArray[i]); i++) {
      // 自身和兄弟元素的间距
      gap = gapData.gap;

      for (; (anchorData = anchorGapArray[j]); j++) {
        // 兄弟元素间的参考间距
        anchorGap = anchorData.gap;
        // 偏差距离
        offset = gap - anchorGap;

        // 如果偏差距离小于现有修正值
        if (Math.abs(offset) < Math.abs(correctValue[attr][0])) {
          gapPoints = gapData.points;
          currentPoint = angular.copy(anchorData.points);
          offset = getGapOffset(Number(anchorGap), pointAfterMove[attr], gapPoints, currentPoint);
          correctValue[attr] = [offset, anchorGap, currentPoint];
        }
      }
    }
  }
  /**
   * get gap offset
   * @param  {String} gap
   * @param  {Array}  self
   * @param  {Array}  gapPoints
   * @param  {Array}  anchorPoint
   * @return {void}
   */
  function getGapOffset(gap, self, gapPoints, anchorPoint) {
    var i = 0
      , point
      , arr
      , offset
      ;

    // 遍历
    for (; (point = gapPoints[i]); i++) {
      arr = point.split('|');

      if (self[0] === Number(arr[1])) {
        // + position
        arr[1] = Number(arr[0]) + gap;
        offset = self[0] - arr[1];
      } else {
        // - position
        arr[0] = Number(arr[1]) - gap;
        offset = self[2] - arr[0];
      }
      anchorPoint.push(arr.join('|'));
    }
    return offset;
  }

  /**
   * snap to sibling element
   * @param  {Object} dist
   */
  function snapToSibling(pointAfterMove, correctValue, anchorPoint) {
    var i
      , j
      , distX
      , distY
      , point
      ;

    // 找出最近的点
    // 横轴对应上下,纵轴对应左右,中轴对应中
    for (i = 0; (point = anchorPoint.sibling[i]); i++) {

      // 遍历该参考对象的三个边界点
      // [TODO] 优化算法
      for (j = 0; j < 3; j++) {

        if (j === 1) {
          distX = pointAfterMove.x[1] - point.x[1];
          distY = pointAfterMove.y[1] - point.y[1];

          if (Math.abs(distX) < Math.abs(correctValue.x[0])) {
            correctValue.x = [distX, point.x[1]];
          }

          if (Math.abs(distY) < Math.abs(correctValue.y[0])) {
            correctValue.y = [distY, point.y[1]];
          }
        } else {
          distX = pointAfterMove.x[j] - point.x[0];
          distY = pointAfterMove.y[j] - point.y[0];

          if (Math.abs(distX) < Math.abs(correctValue.x[0])) {
            correctValue.x = [distX, point.x[0]];
          }

          if (Math.abs(distY) < Math.abs(correctValue.y[0])) {
            correctValue.y = [distY, point.y[0]];
          }

          distX = pointAfterMove.x[j] - point.x[2];
          distY = pointAfterMove.y[j] - point.y[2];

          if (Math.abs(distX) < Math.abs(correctValue.x[0])) {
            correctValue.x = [distX, point.x[2]];
          }

          if (Math.abs(distY) < Math.abs(correctValue.y[0])) {
            correctValue.y = [distY, point.y[2]];
          }
        }
      }
    }
  }
  /**
   * snap to gap
   * @param  {Object} dist
   * @param  {Object} correctValue
   * @param  {Object} anchorPoint
   */
  function snapToGap(pointAfterMove, correctValue, anchorPoint) {
    var siblings = anchorPoint.sibling
      , gapHash = {
          'h': [],
          'v': []
        }
      , i = 0
      , sibling
      ;

    for (; (sibling = siblings[i]); i++) {

      if (!collisionDetection(pointAfterMove, sibling)) {
        getGapBetween(pointAfterMove, sibling, gapHash);
      }
    }
    gapHash.h.sort(function(a, b) {
      return a.gap > b.gap;
    });
    gapHash.v.sort(function(a, b) {
      return a.gap > b.gap;
    });

    if (typeof correctValue.x[1] === 'undefined') {
      _snapToGap(pointAfterMove, gapHash.h, correctValue, anchorPoint.gap, true);
    }

    if (typeof correctValue.y[1] === 'undefined') {
      _snapToGap(pointAfterMove, gapHash.v, correctValue, anchorPoint.gap);
    }
  }

  // function parseSVGNode (angularElement){
  //   var rawElement = angularElement[0]
  //     , text
  //     , replacement
  //     , children
  //     , attributes
  //     , i;

  //   //new lines have no localName
  //   if(!rawElement.localName){
  //     text = document.createTextNode(rawElement.wholeText);
  //     return angular.element(text);
  //   }

  //   // create a new SVG node with the name 
  //   replacement = document.createElementNS(svgNS,rawElement.localName);

  //   children = angularElement.children();

  //   angular.forEach(children, function (value) {
  //     // call each child node recursively to convert them to SVG
  //     var newChildNode = parseSVGNode(angular.element(value));

  //     replacement.appendChild(newChildNode[0]);
  //   });

  //   // get all the attributes and assign them to the new SVG element
  //   attributes = rawElement.attributes;

  //   for (i = 0; i < attributes.length ; i++) {
  //     replacement.setAttribute(attributes[i].name, attributes[i].value);
  //   }

  //   // set the text from the template
  //   if(rawElement.localName === 'text'){
  //     replacement.textContent = rawElement.innerText;
  //   }

  //   // replace the DOM element with the SVG element
  //   angularElement.replaceWith(replacement);

  //   // return the new element wrapped in an angular element
  //   return angular.element(replacement);
  // }

  // function directionCorrection(dist, hid) {
  //   // 依据方向修正距离参数
  //   // 1、锁定纵横
  //   //    参考点是1、5时，横轴锁定
  //   //    参考点是3、7时，纵轴锁定
  //   // 2、反向调整
  //   //    参考点是0、1、2时，横轴反向
  //   //    参考点是0、6、7时，纵轴反向
  //   switch (hid) {
  //     case 0:
  //       dist.x = -dist.x;
  //       dist.y = -dist.y;
  //       break;
  //     case 1:
  //       dist.x = 0;
  //       dist.y = -dist.y;
  //       break;
  //     case 2:
  //       dist.y = -dist.y;
  //       break;
  //     case 3:
  //       dist.y = 0;
  //       break;
  //     case 4:
  //       break;
  //     case 5:
  //       dist.x = 0;
  //       break;
  //     case 6:
  //       dist.x = -dist.x;
  //       break;
  //     case 7:
  //       dist.x = -dist.x;
  //       dist.y = 0;
  //       break;
  //   }
  // }

  // 获取元素每个点的位置在path中的比率
  // function getPointRatio(node, wrapNode, hid) {
  //   var BBox = wrapNode.getBBox()
  //     , vertex = getVertex(wrapNode)
  //     , referencePoint = vertex[hid > 3 ? hid - 4 : hid + 4]
  //     , output = []
  //     , i = 0
  //     , len = node.pathSegList.numberOfItems
  //     , point
  //     , ratio;

  //   for (; i < len; i++) {
  //     point = node.pathSegList.getItem(i);
  //     ratio = {};

  //     if (typeof point.x !== 'undefined') {
  //       ratio.x = (point.x - referencePoint.x) / BBox.width;
  //       ratio.y = (point.y - referencePoint.y) / BBox.height;
  //     }

  //     if (typeof point.r1 !== 'undefined') {
  //       ratio.r1 = point.r1 / BBox.width;
  //       ratio.r2 = point.r2 / BBox.height;
  //     }

  //     if (typeof point.x1 !== 'undefined') {
  //       ratio.x1 = (point.x1 - referencePoint.x) / BBox.width;
  //       ratio.y1 = (point.y1 - referencePoint.y) / BBox.height;
  //     }

  //     if (typeof point.x2 !== 'undefined') {
  //       ratio.x2 = (point.x2 - referencePoint.x) / BBox.width;
  //       ratio.y2 = (point.y2 - referencePoint.y) / BBox.height;
  //     }
  //     output.push(ratio);
  //   }
  //   return output;
  // }

  // function stringItem(data) {
  //   var hash = pathArgHash[data.type.toLowerCase()]
  //     , i = 0
  //     , len = hash.length

  //     , output = data.type
  //     ;

  //   for (; i < len; i++) {
  //     output += (data[hash[i]] + ' ');
  //   }

  //   return output;
  // }
  /**
   * 将parsePath解析后的对象还原成字符串
   * @param  {Object} path 路径对象
   * @return {String}
   */
  // function stringPath(path) {
  //   var i = 0
  //     , item
  //     , output = ''
  //     ;

  //   for (; item = path[i]; i++) {
  //       output += stringItem(item);
  //   }

  //   return output;
  // }

  // function movePathNode(node, dist) {
  //   var i = 0
  //     , len = node.pathSegList.numberOfItems
  //     , item
  //     , type;

  //   for (; i < len; i++) {
  //     item = node.pathSegList.getItem(i);
  //     type = item.pathSegTypeAsLetter;

  //     if (type === 'Z') {
  //       continue;
  //     }

  //     item.x += dist.x;
  //     item.y += dist.y;

  //     if (typeof item.x1 !== 'undefined') {
  //       item.x1 += dist.x;
  //       item.y1 += dist.y;
  //     }

  //     if (typeof item.x2 !== 'undefined') {
  //       item.x2 += dist.x;
  //       item.y2 += dist.y;
  //     }
  //   }
  // }

  // function getAngle(p1, p2) {
  //   var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
  //     , deflection;

  //   if (angle >= -90) {
  //     angle += 90;
  //   } else {
  //     angle += 450
  //   }

  //   // 调整角度，使其在靠近45度时自动吸附该位置
  //   deflection = angle % 45;

  //   if (deflection < 2) {
  //     angle -= deflection;
  //   } else if (deflection > 43){
  //     angle += (43 - deflection);
  //   }

  //   return angle;
  // }

  // function rotateSVGNode(node, originPoint, angle) {
  //   var i = 0
  //     , len = node.pathSegList.numberOfItems
  //     , item
  //     , type
  //     ;

  //   // element[0].setAttribute('transform', 'rotate(' + angle + ', ' + originPoint.x + ', ' + originPoint.y + ')');

  //   for (; i < len; i ++) {
  //     item = node.pathSegList.getItem(i);
  //     type = item.pathSegTypeAsLetter;

  //     if (type === 'Z') {
  //       continue;
  //     }

  //     rotatePoint(angle, item, originPoint);
  //   }
  // }

  // 旋转路径点
  // function rotatePoint(angle, item, originPoint) {
  //   var radian = angle * Math.PI / 180
  //     , x1
  //     , y1
  //     , x
  //     , y;

  //   if (typeof item.x !== 'undefined') {
  //     // 向量旋转
  //     x1 = item.x - originPoint.x;
  //     y1 = -(item.y - originPoint.y);

  //     x = x1 * Math.cos(-radian) - y1 * Math.sin(-radian);
  //     y = y1 * Math.cos(-radian) + x1 * Math.sin(-radian);

  //     item.x = originPoint.x + x;
  //     item.y = originPoint.y - y;
  //   }
  // }

  // function convert(id, cb) {
  //   var mold = getMold(id)[0]
  //     , str
  //     , url

  //     , canvas
  //     , context
  //     , image
  //     ;

  //   if (mold) {
  //     str = getExportString(mold);
  //     canvas = document.createElement('canvas');
  //     context = canvas.getContext('2d');

  //     image = new Image;
  //     url = URL.createObjectURL(new Blob([str], {type: 'image/svg+xml;charset=utf-8'}));
  //     image.src = url;
  //     image.onload = function() {
  //       var href;
  //       context.drawImage(image, 0, 0);
  //       href = canvas.toDataURL('image/png');
  //       cb(href);
  //     };
  //   }
  // }

  return {
    // scaleData: function(data, sx, sy, ox, oy) {
    //   var type = data.unitType
    //     , fun = scaleSVGData[type]
    //     ;

    //   if (fun) {
    //     return fun(angular.copy(data[type]), sx, sy, ox, oy);
    //   }
    // },
    // translateData: function(data, x, y) {
    //   var type = data.unitType
    //     , fun = translateSVGData[type]
    //     ;

    //   if (fun) {
    //     data = fun(angular.copy(data[type]), x, y);
    //     if (type === 'path') {
    //       return stringPath(data)
    //     }
    //   }

    //   return data;
    // },
    // getPointRatio: function (nodes, wrapNode, hid) {
    //   var output = [];

    //   angular.forEach(nodes, function(value, key){
    //     output.push(getPointRatio(value.clone, wrapNode, hid));
    //   });

    //   return output;
    // },
    // SVGToPNG: convert,
    // parse: parseSVGNode,
    create: createSVGNode,
    translateTspan: translateTspan,
    setClipPath: setClipPath,
    adjustDist: adjustDist,
    setCTM: setCTM,
    getVertex: getVertex,
    getBBoxWithTransform: getBBoxWithTransform,
    getMatrixString: getMatrixString,
    coordinateTransform: coordinateTransform,
    getPosition: getPosition,
    getBorderRect: getBorderRect,
    getFullSizeScaling: getFullSizeScaling,

    collisionDetection: collisionDetection,
    getGapBetween: getGapBetween,
    getGapPoint: getGapPoint,

    snapToSibling: snapToSibling,
    snapToGap: snapToGap
  };
}]);
