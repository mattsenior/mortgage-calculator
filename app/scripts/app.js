'use strict';

angular.module('mortgageApp', [
  'ngSanitize',
  'ngRoute',
  'xeditable'
])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }])
  .run(['editableOptions', 'editableThemes', function(editableOptions, editableThemes) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

    //editableThemes.bs3.controlsTpl = '<div class="input-group editable-controls"></div>';
    //editableThemes.bs3.buttonsTpl = '<div class="btn-group editable-buttons"></div>',

    editableThemes.bs3.inputClass = 'input-sm';
    editableThemes.bs3.buttonsClass = 'btn-sm';
  }]);
