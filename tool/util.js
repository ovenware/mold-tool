'use strict';

/**
* @ngdoc service
* @name Tool.util
* @description
* # util
* Factory in the Tool.
*/
angular.module('Tool')
.factory('util', [
function () {
  var properties = [
        'direction',  // RTL support
        'boxSizing',
        'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
        'height',
        'overflowX',
        'overflowY',  // copy the scrollbar for IE

        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',

        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',

        // https://developer.mozilla.org/en-US/docs/Web/CSS/font
        'fontStyle',
        'fontVariant',
        'fontWeight',
        'fontStretch',
        'fontSize',
        'fontSizeAdjust',
        'lineHeight',
        'fontFamily',

        'textAlign',
        'textTransform',
        'textIndent',
        'textDecoration',  // might not make a difference, but better be safe

        'letterSpacing',
        'wordSpacing'
      ]
      /**
       * from
       * https://github.com/component/textarea-caret-position
       */
    , getCaretCoordinates = function (element, position) {
        // mirrored div
        var div = document.createElement('div');
        div.id = 'input-textarea-caret-position-mirror-div';
        document.body.appendChild(div);

        var style = div.style;
        var computed = window.getComputedStyle? getComputedStyle(element) : element.currentStyle;  // currentStyle for IE < 9

        // default textarea styles
        style.whiteSpace = 'pre-wrap';
        if (element.nodeName !== 'INPUT') {
          style.wordWrap = 'break-word';  // only for textarea-s
        }

        // position off-screen
        style.position = 'absolute';  // required to return coordinates properly
        style.visibility = 'hidden';  // not 'display: none' because we want rendering

        // transfer the element's properties to the div
        properties.forEach(function (prop) {
          style[prop] = computed[prop];
        });

        if (window.BK && window.BK.isFF) {
          style.width = parseInt(computed.width) - 2 + 'px';  // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
          // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
          if (element.scrollHeight > parseInt(computed.height)) {
            style.overflowY = 'scroll';
          }
        } else {
          style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
        }

        div.textContent = element.value.substring(0, position);
        // the second special handling for input type='text' vs textarea: spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
        if (element.nodeName === 'INPUT') {
          div.textContent = div.textContent.replace(/\s/g, '\u00a0');
        }

        var span = document.createElement('span');
        // Wrapping must be replicated *exactly*, including when a long word gets
        // onto the next line, with whitespace at the end of the line before (#7).
        // The  *only* reliable way to do that is to copy the *entire* rest of the
        // textarea's content into the <span> created at the caret position.
        // for inputs, just '.' would be enough, but why bother?
        span.textContent = element.value.substring(position) || '.';  // || because a completely empty faux span doesn't render at all
        div.appendChild(span);

        var coordinates = {
          top: span.offsetTop + parseInt(computed.borderTopWidth),
          left: span.offsetLeft + parseInt(computed.borderLeftWidth)
        };

        document.body.removeChild(div);
        return coordinates;
      }
      /**
       * download give object as give type and name
       * @param  {Object} object download target
       * @param  {String} type   file type
       * @param  {String} name   file name
       */
    , download = function (object, type, name) {
        var a = document.createElement('a')
          // , e = document.createEvent('HTMLEvents')
          , blob = new Blob([object], {'type': 'text\/xml'})
          , url = (window.URL || window.webkitURL)
          ;

        a.download = (name || 'untitled') +'.' + type;
        a.href = url.createObjectURL(blob);

        // for firefox
        document.body.appendChild(a);
        a.click();

        // e.initEvent('click', false, false);
        // a.dispatchEvent(e);

        setTimeout(function() {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 10);
        return blob;
      }
      /**
       * class inherits
       * @param  {Object} ctor
       * @param  {Object} superCtor
       */
    , inherits = function(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
      /**
       * get UUID
       * @return {String}
       */
    , getUUID = function () {
        var uuid = ''
          , i = 12
          , random
          ;

        while (--i) {
          random = i === 20 ? (uuid += '-', 4) : Math.random() * 16 | 0;
          if (i === 12 || i === 24) {
            uuid += '-';
          }
          uuid += (i === 16 ? (uuid += '-', random & 3 | 8) : random).toString(16);
        }
        return uuid;
      }
    , getCharCode = function (evt) {
        var charCode;

        if (evt) {
          charCode = (typeof evt.which === 'number') ? evt.which : evt.keyCode;
        }
        return charCode;
      }
    , getDelta = function (evt) {
        var delta = {}
          , type = evt.type
          ;

        switch (type) {
          case 'mousewheel':
            delta.deltaX = evt.wheelDeltaX ? - 1/5 * evt.wheelDeltaX : 0;
            delta.deltaY = - 1/5 * evt.wheelDeltaY;
            delta.deltaZ = 0;
            break;
          case 'wheel':
            delta = {
              'deltaX': evt.deltaX,
              'deltaY': evt.deltaY,
              'deltaZ': evt.deltaZ
            };
            break;
          case 'DOMMouseScroll':
            delta.deltaY = - 120 * evt.detail;
            break;
          default:
            delta.deltaY = - 120 * evt.detail;
            break;
        }
        return delta;
      }
    , isEmptyObject = function(obj) {
        var n;

        for (n in obj) {
          return false;
        }
        return true;
      }
    , getPointTarget = function(evt) {
        var target;

        if (evt.touches) {
          if (evt.touches.length === 1) {
            target = evt.touches[0];
          }
        } else {
          target = evt;
        }
        return target;
      }
    , isChildOf = function(node, parent) {
        var doc = document.documentElement
          , b = false
          ;

        while (node !== doc) {

          if (node.parentElement === parent) {
            b = true;
            node = doc;
          } else {
            node = node.parentElement;
          }
        }
        return b;
      }
    /**
     * [getFloatLayerPosition description]
     * @param  {[type]} wrapper  [description]
     * @param  {[type]} layer    [description]
     * @param  {[type]} position [description]
     * @return {[type]}          [description]
     */
    , getFloatLayerPosition = function(x, y, layer, wrapper) {
        var doc = document.documentElement
          , offsetLeft = (window.pageXOffset || doc.scrollTop) - (doc.clientTop || 0)
          , offsetTop = (window.pageYOffset || doc.scrollLeft) - (doc.clientLeft || 0)
          , wrapper = wrapper || doc
          , wrapperWidth = wrapper.clientWidth + offsetLeft
          , wrapperHeight = wrapper.clientHeight + offsetTop

          , width = layer.clientWidth
          , height = layer.clientHeight

          , left = Math.max(x - offsetLeft, 0)
          , top = Math.max(y - offsetTop, 0)

          , totalWidth = width + x
          , totalHeight = height + y
          ;

        if (totalWidth > wrapperWidth) {
          left = left - (totalWidth - wrapperWidth);
        }

        if (totalHeight > wrapperHeight) {
          top = top - (totalHeight - wrapperHeight);
        }
        return {'left': Math.round(left), 'top': Math.round(top)};
      }
    ;

  return {
    isChildOf: isChildOf,
    getCaretCoordinates: getCaretCoordinates,
    getDelta: getDelta,
    getUUID: getUUID,
    getCharCode: getCharCode,
    inherits: inherits,
    download: download,
    isEmptyObject: isEmptyObject,
    getPointTarget: getPointTarget,
    getFloatLayerPosition: getFloatLayerPosition
  };
}]);
