'use strict';

/**
* @ngdoc service
* @name Tool.dialog
* @description
* # dialog
* Provider in the Tool.
*/
angular.module('Tool')
.provider('dialog', function () {
  var template = '<div class="dialog">' +
                  '<div class="container fd modal">' +
                    '<div class="title"></div>' +
                    '<div class="content fd"></div>' +
                    '<div class="tools" ng-class="{\'align-center\':!dialogData.cancel}">' +
                      '<div class="button fd ok l" ng-bind="dialogData.submit" ng-click="submitDialog()"></div>' +
                      '<div class="button fd close l" ng-bind="dialogData.cancel" ng-hide="!dialogData.cancel" ng-click="cancelDialog()"></div>' +
                    '</div>' +
                  '</div>' +
                '</div>';

  this.$get = [
  '$rootScope',
  '$compile',
  '$q',
  'util',
  'hotkeyAgent',
   function ($rootScope, $compile, $q, util, hotkeyAgent){
    var scope = $rootScope.$new()
      , locationChangeListener
      , closeTimer
      , component
      , wrapper
      , container
      , title
      , content
      , tools
      , form
      , defer
      ;

    $compile(template)(scope, function(clone) {
      wrapper = clone;
      container = angular.element(wrapper[0].querySelector('.container'));
      title = angular.element(wrapper[0].querySelector('.title'));
      content = angular.element(wrapper[0].querySelector('.content'));
      tools = angular.element(wrapper[0].querySelector('.tools'));
    });

    /** 
     * handle enter key press
     * @param  {Event} evt
     */
    function handlekeypress(evt) {
      var target = evt.target
        , charCode = util.getCharCode(evt)
        ;

      if (target.getAttribute('submit') &&
          charCode === 13) {
        scope.submitDialog();
      }
    }

    /** 
     * handle esc key press
     * @param  {Event} evt
     */
    function handleEsc(evt) {
      var charCode = util.getCharCode(evt);

      if (charCode === 27) {
        scope.cancelDialog();
        return true;
      } else {
        return false;
      }
    }

    /**
     * create form content
     * @param  {String} ele  form element string
     * @param  {Object} data form data
     */
    function buildForm(ele, data) {
      var childScope = scope.$new();

      if (data) {
        angular.extend(childScope, data);
      }

      ele = '<form class="fd" name="dialog">' + ele + '</form>';

      $compile(ele)(childScope, function(clone, scope) {
        content.append(clone);
        form = scope;
      });
    }

    /**
     * open dialog
     * @param  {Object} data
     */
    function dialog(data) {
      var childScope = scope.$new();
      defer = $q.defer();
      childScope.defer = defer;

      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = 0;
      }

      if (data.component) {
        container.addClass('ng-hide');
        $compile(data.component)(childScope, function(clone) {
          component = clone;
          wrapper.append(clone);

          if (data.componentData) {
            childScope.data = data.componentData;
          }
        });
      } else {
        scope.dialogData = data;
        title.html(data.title || '');

        if (data.content) {
          $compile(data.content)(childScope, function(clone, scope) {
            content.append(clone);

            if (data.contentData) {
              scope.data = data.contentData;
            }
          });
        }

        if (data.form) {
          buildForm(data.form, data.formData);
        } else {
          form = null;
        }
        tools.removeClass('ng-hide');
        content[0].addEventListener('keypress', handlekeypress);
      }
      document.body.appendChild(wrapper[0]);
      setTimeout(function() {
        wrapper.addClass('ng-show');
      }, 0);
      // bind event
      addRemoveCancelListener();
      return defer.promise;
    }

    /**
     * toast
     * @param  {String} message toast message
     * @param  {String} type    toast type
     */
    function toast(message, type) {
      var dom = document.createElement('div')
        , d = angular.element(dom)
        ;

      d.addClass(type ? 'toast ' + type : 'toast');
      d.text(message);
      dom.addEventListener(BK.ANIMATIONEEND, function() {
        d.remove();
      });
      document.body.appendChild(dom);
    }

    /**
     * submit dialog
     */
    function submitDialog() {
      // 验证
      if (form && !form.dialog.$valid) {
        return;
      }

      if (defer) {
        defer.resolve(form);
      }
      closeDialog();
    }

    /**
     * cancel dialog
     */
    function cancelDialog() {
      if (defer) {
        defer.reject('cancel');
        defer = null;
        closeDialog();
      }
    }

    function addRemoveCancelListener() {
      hotkeyAgent.add(handleEsc, null, 1);

      locationChangeListener = $rootScope.$on('$locationChangeStart', function(e, t, o) {
        if (t !== o) {
          cancelDialog();
        }
      });
    }

    function removeCancelListener() {
      hotkeyAgent.remove(handleEsc, null, 1);

      if (locationChangeListener) {
        locationChangeListener();
        locationChangeListener = null;
      }
    }

    function closeDialog() {
      if (component) {
        component.remove();
        component = null;
      } else {
        content[0].removeEventListener('keypress', handlekeypress);
        content.empty();
      }
      removeCancelListener();

      wrapper.removeClass('ng-show');
      container.removeClass('ng-hide');
      closeTimer = setTimeout(function() {
        document.body.removeChild(wrapper[0]);
        scope.dialogData = null;
      }, 200);
    }

    scope.submitDialog = submitDialog;
    scope.cancelDialog = cancelDialog;

    return {
      open: dialog,
      submit: submitDialog,
      close: cancelDialog,
      toast: toast
    };
  }];
});