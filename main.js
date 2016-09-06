var regApp = angular
    .module('RegistryClient', ['ngRoute', 'ngResource', 'ui.bootstrap', 'xeditable', 'chart.js', 'ngSanitize', 'ngCsv'])
    .run(function($window, $log, editableOptions) {
        editableOptions.theme = 'bs3';
    })
    .config(function($httpProvider, $routeProvider, $locationProvider) {
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8';
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $routeProvider
            .when('/registry/list', {
                templateUrl: '/template/registryList.html',
                controller: 'registryList'
            })
            .when('/stat', {
                templateUrl: '/template/statView.html',
                controller: 'statController'
            })
            .when('/registry/:id/delete', {
                template: ' ',
                controller: 'registryDelete'
            })
            .when('/registry/:id/edit', {
                templateUrl: '/template/registryEdit.html',
                controller: 'registryEdit'
            })
            .when('/registry/:id', {
                templateUrl: '/template/registryView.html',
                controller: 'registryView'
            })
            .when('/entry/list/:id?', {
                templateUrl: '/template/entryList.html',
                controller: 'entryList'
            })
            .when('/entry/:id/edit', {
                templateUrl: '/template/entryEdit.html',
                controller: 'entryEdit'
            })
            .when('/property/list/:id?', {
                templateUrl: '/template/propertyList.html',
                controller: 'propertyList'
            })
            .when('/user/:id?/edit', {
                templateUrl: '/template/userEdit.html',
                controller: 'userEdit'
            })
            .when('/user/login', {
                templateUrl: '/template/userLogin.html',
                controller: 'userLogin'
            })
            .when('/user/logout', {
                template: ' ',
                controller: 'userLogout',
            })
            .otherwise({
                redirectTo: '/user/login'
            });
            
        $locationProvider.html5Mode(true);
    });