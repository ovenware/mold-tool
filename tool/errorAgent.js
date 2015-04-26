'use strict';

/**
* @ngdoc service
* @name Tool.dialog
* @description
* # dialog
* Provider in the Tool.
*/
angular.module('Tool')
.provider('errorAgent', function () {

  this.$get = [
    '$rootScope',
    '$translate',
    'dialog',
    function ($rootScope, $translate, dialog){
      var remind = {
            dialog: function(data) {
              var err = 'ERR.' + data.name
                , remind = 'ERR_REMIND.' + (data.remind || data.name)
                ;

              $translate([err, remind, 'SUBMIT', 'REFRESH', 'RELOGIN']).then(function(trs) {
                var dialogData = {
                  'title': trs[err],
                  'content': '<p>' + trs[remind] + '</p>',
                  'submit': trs.SUBMIT
                };

                dialog.open(dialogData).then(function() {
                  if (data.redirect) {
                    location.href = data.redirect;
                  }
                });
              });
            },
            toast: function(data) {
              $translate(['ERR.' + data.name]).then(function(translations) {
                dialog.toast(translations['ERR.' + data.name], 'error');
              });
            }
          };

      function setErrorHandler(config) {
        var errors;

        if (angular.isArray(config)) {
          errors = config;
        } else {
          errors = [config];
        }

        angular.forEach(errors, _setErrorHandler);
      }

      function _setErrorHandler(errorData) {
        $rootScope.$on('ERR_' + errorData.name, function() {
          remind[errorData.type || 'dialog'](errorData);
        });
      }
      return {
        set: setErrorHandler
      };
    }
  ];
});