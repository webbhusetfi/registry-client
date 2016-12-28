var regApp = angular
    .module('RegistryClient', ['ngRoute', 'ngResource', 'ui.bootstrap', 'xeditable', 'chart.js', 'ngSanitize', 'ngCsv', 'ngPDFKit', 'ngFileSaver'])
    .constant('_', window._)
    .run(function($window, $log, $rootScope, loadOverlay, editableOptions, globalParams) {
        if(typeof($window._) == 'function')
            $rootScope._ = $window._;
        else
            $rootScope._ = false;
        editableOptions.theme = 'bs3';
        loadOverlay.init();
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
            .when('/registry/edit/:id?', {
                templateUrl: '/template/registryEdit.html',
                controller: 'registryEdit'
            })
            .when('/registry/:id', {
                templateUrl: '/template/registryView.html',
                controller: 'registryView'
            })
            .when('/invoice/list', {
                templateUrl: '/template/invoiceList.html',
                controller: 'invoiceList'
            })
            .when('/invoice/ledger/:id?', {
                templateUrl: '/template/invoiceLedger.html',
                controller: 'invoiceLedger'
            })
            .when('/mailing/list', {
                templateUrl: '/template/mailingList.html',
                controller: 'mailingList'
            })
            .when('/mailing/:id?', {
                templateUrl: '/template/mailingView.html',
                controller: 'mailingView'
            })
            .when('/invoice/edit/:id?', {
                templateUrl: '/template/invoiceEdit.html',
                controller: 'invoiceEdit'
            })
            .when('/invoice/edit/:id?/:copy?', {
                templateUrl: '/template/invoiceEdit.html',
                controller: 'invoiceEdit'
            })
            .when('/stat', {
                templateUrl: '/template/statView.html',
                controller: 'statController'
            })
            .when('/entry/list/:id?', {
                templateUrl: '/template/entryList.html',
                controller: 'entryList'
            })
            .when('/entry/edit/:id', {
                templateUrl: '/template/entryEdit.html',
                controller: 'entryEdit'
            })
            .when('/property/list/:id?', {
                templateUrl: '/template/propertyList.html',
                controller: 'propertyList'
            })
            .when('/user/list/:id?', {
                templateUrl: '/template/userList.html',
                controller: 'userList'
            })
            .when('/user/edit/:id?', {
                templateUrl: '/template/userEdit.html',
                controller: 'userEdit'
            })
            .when('/user/login', {
                templateUrl: '/template/userLogin.html',
                controller: 'userLogin',
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