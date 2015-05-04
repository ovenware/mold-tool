'use strict';

angular.module('Tool')
.factory('svgViewBox', [
function () {
  function SVGViewBox(node, option, cb) {
    this._node = node;
    this._cb = cb;

    if (!option) {
      option = {};
    }
    this.step = option.step || 0.1;
    this.max = option.max || 3.1;
    this.min = option.min || 0.1;

    this.viewBoxVal = {
      'x': 0,
      'y': 0,
      'scaling': 1
    };
  }
  (function(){
    /**
     * 移动至
     * @param  {Number} x
     * @param  {Number} y
     * @return {void}
     */
    this.moveTo = function(x, y) {
      this.setViewBox(this.viewBoxVal.scaling, x, y);
    };
    /**
     * 移动
     * @param  {Number} x
     * @param  {Number} y
     * @return {void}
     */
    this.move = function(x, y) {
      var viewBoxVal = this.viewBoxVal
        , vx = viewBoxVal.x + x / viewBoxVal.scaling
        , vy = viewBoxVal.y + y / viewBoxVal.scaling
        ;

      this.moveTo(vx, vy);
    };
    this.zoominByStep = function(x, y) {
      var scaling = parseFloat((this.viewBoxVal.scaling + this.step).toFixed(4));
      this.zoom(scaling, x, y);
    };
    this.zoomoutByStep = function(x, y) {
      var scaling = parseFloat((this.viewBoxVal.scaling - this.step).toFixed(4));
      this.zoom(scaling, x, y);
    };
    /**
     * 在给定位置（屏幕）处缩放
     * @param  {Number} scaling 缩放比率
     * @param  {Number} x
     * @param  {Number} y
     * @return {void}
     */
    this.zoom = function(scaling, x, y) {
      var viewBoxVal = this.viewBoxVal
        , sx
        , sy
        ;

      if (scaling >= this.min && scaling < this.max) {
        sx = x / viewBoxVal.scaling + viewBoxVal.x;
        sy = y / viewBoxVal.scaling + viewBoxVal.y;
        x = -x / scaling + sx;
        y = -y / scaling + sy;

        this.setViewBox(scaling, x, y);
      }
    };
    /**
     * 缩放并将svg的0,0点移动到给定位置
     * @param  {Number} scaling 缩放比率
     * @param  {Number} x
     * @param  {Number} y
     * @return {void}
     */
    this.scale = function(scaling, x, y) {
      x = -x / scaling;
      y = y ? -y / scaling : x;

      this.setViewBox(scaling, x, y);
    };
    /**
     * 设置svg的viewbox属性
     * @param {Number} scaling [description]
     * @param {Number} x       [description]
     * @param {Number} y       [description]
     * @return {void}
     */
    this.setViewBox = function(scaling, x, y) {
      var canvas = this._node.getBoundingClientRect()
        , viewBoxVal = this.viewBoxVal
        ;

      x = parseInt(x);
      y = parseInt(y);

      this._node.setAttribute('viewBox', [x, y, canvas.width / scaling, canvas.height / scaling].join(' '));
      viewBoxVal.x = x;
      viewBoxVal.y = y;
      viewBoxVal.scaling = scaling;
      viewBoxVal.zoom = parseInt(scaling * 100) + '%';

      this._cb && this._cb(this.viewBoxVal);
    };
    this.setScalingStep = function(num) {
      if (num && !isNaN(num)) {
        this.step = num;
      }
    };
  }).apply(SVGViewBox.prototype);

  return {
    create: function (node, option, cb) {
      return new SVGViewBox(node, option, cb);
    }
  };
}]);