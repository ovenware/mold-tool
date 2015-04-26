'use strict';

angular.module('Tool')
.factory('animateFactory', [
'keyFrames',
function (keyFrames) {
  var rulesHash = {
        // switch screen rules
        'screen': {
          'slideLeft':{
            'name': 'slide to left',
            'target': {
              '0': [BK.CSSPREFIX + 'transform: translate3d($,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);']
            },
            'self': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(-$0.3,0,0);']
            }
          },

          'slideRight':{
            'name': 'slide to right',
            'target': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(-$0.3,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);']
            },
            'self': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d($,0,0);']
            }
          },

          'slideTop':{
            'name': 'slide to top',
            'target': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,$2,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);']
            },
            'self': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,-$2,0);']
            }
          },

          'slideBottom':{
            'name': 'slide to bottom',
            'target': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,-$2,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);']
            },
            'self': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,$2,0);']
            }
          },

          'flip':{
            'name': 'flip',
            'target': {
              '0': [BK.CSSPREFIX + 'transform: rotateY(180deg);', BK.CSSPREFIX + 'transform-origin: $0.5'],
              '100': [BK.CSSPREFIX + 'transform: rotateY(0deg);', BK.CSSPREFIX + 'transform-origin: $0.5']
            },
            'self': {
              '0': [BK.CSSPREFIX + 'transform: rotateY(0deg);', BK.CSSPREFIX + 'transform-origin: $0.5'],
              '100': [BK.CSSPREFIX + 'transform: rotateY(180deg);', BK.CSSPREFIX + 'transform-origin: $0.5']
            }
          },

          'fade':{
            'name': 'fade',
            'target': {
              '0': ['opacity: 0;', BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': ['opacity: 1;']
            },
            'self': {
              '0': ['opacity: 1;', BK.CSSPREFIX + 'transform: translate3d(0,0,0);'],
              '100': ['opacity: 0;']
            }
          }
        },
        // mask rules
        'mask': {
          'light': {
            'name': 'light',
            'load': {
              '0': ['fill: rgba(255,255,255,0);'],
              '100': ['fill: rgba(255,255,255,0.8);']
            },
            'close': {
              '0': ['fill: rgba(255,255,255,0.8);'],
              '100': ['fill: rgba(255,255,255,0);']
            }
          },

          'dark': {
            'name': 'dark',
            'load': {
              '0': ['fill: rgba(0,0,0,0);'],
              '100': ['fill: rgba(0,0,0,0.4);']
            },
            'close': {
              '0': ['fill: rgba(0,0,0,0.4);'],
              '100': ['fill: rgba(0,0,0,0);']
            }
          }
        },
        // load layer rules
        'layer': {

          'left': {
            'name': 'pop from left',
            'load': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(-$,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(-$0.2,0,0);']
            },
            'close': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(-$0.2,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(-$,0,0);']
            }
          },

          'right': {
            'name': 'pop from right',
            'load': {
              '0': [BK.CSSPREFIX + 'transform: translate3d($,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d($0.2,0,0);']
            },
            'close': {
              '0': [BK.CSSPREFIX + 'transform: translate3d($0.2,0,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d($,0,0);']
            }
          },

          'top': {
            'name': 'pop from top',
            'load': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,-$,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,-$0.3,0);']
            },
            'close': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,-$0.3,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,-$,0);']
            }
          },

          'bottom': {
            'name': 'pop from bottom',
            'load': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,$,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,$0.2,0);']
            },
            'close': {
              '0': [BK.CSSPREFIX + 'transform: translate3d(0,$0.2,0);'],
              '100': [BK.CSSPREFIX + 'transform: translate3d(0,$,0);']
            }
          }
        }
      }
    ;

  function getRuleString(frame) {
    var i = 0
      , j

      , frameSet
      , frameName
      , frameTarget
      , frameAttr

      , rulesString = ''
      , rules

      , step
      , style
      , attr

      , list = {}
      ;

    // 遍历所有frame
    frame = frame.split('-');

    frameSet = frame[0];
    frameName = frame[1];
    frameTarget = frame[2];
    frameAttr = frame[3];

    if (rulesHash[frameSet] && rulesHash[frameSet][frameName]) {
      rules = rulesHash[frameSet][frameName][frameTarget];
    }

    // 遍历每个位置的rule
    for (step in rules) {
      if (!list[step]) {
        list[step] = [];
      }
      style = rules[step];

      // 获取该节点位置的样式
      for (j = 0; (attr = style[j]); j++) {
        // 替换掉相关的参数
        list[step].push(replaceAttr(attr, frameAttr));
      }
    }

    for (step in list) {
      rulesString += step + '%{';

      for (i = 0; (attr = list[step][i]); i++) {
        rulesString += attr;
      }
      rulesString += '}';
    }

    return rulesString;
  }

  function replaceAttr(attr, frameAttr) {
    return attr.replace(/\$([\d|\.]*)/g, function(a, b){
      var percentage = b || 1;
      return percentage * frameAttr + 'px';
    });
  }

  /**
   * 获取keyframes
   * @param  {String} keyframes name
   * @return {String}
   */
  function getAnimate(name, duration) {
    var rules
      , animate
      ;

    if (!keyFrames.get(name)) {
      rules = getRuleString(name);

      if (rules) {
        keyFrames.create(name, rules);
      } else {
        return;
      }
    }
    animate = name + ' ' + duration + 's ease normal forwards';
    return animate;
  }

  return {
    get: getAnimate,
    getList: function(action) {
      var list = {}
        , hash
        , animate
        ;

      switch (action) {
        case 'navTo':
        case 'back':
         hash = rulesHash.screen;
         break;
        case 'mask':
         hash = rulesHash.mask;
         break;
        case 'loadLayer':
         hash = rulesHash.layer;
         break;
      }

      if (hash) {
        for (animate in hash) {
          list[hash[animate].name] = animate;
        }
      }
      return list;
    }
  };
}]);
