angular.module('RegistryClient')
    .directive('xgBack', function($window, $log) {
        return {
            template: '<a class="btn btn-default" ng-click="back();"><i class="fa fa-reply"></i> Tillbaka</a>',
            link: function(scope) {
                scope.back = function() {
                    $window.history.back();
                }
            }
        }
    })
    .directive('xgCancel', function($window, $log) {
        return {
            template: '<a class="btn btn-default" ng-click="back();"><i class="fa fa-reply"></i> Avbryt</a>',
            link: function(scope) {
                scope.back = function() {
                    $window.history.back();
                }
            }
        }
    })
    .directive('xgHref', function($location, $log) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                elem.addClass('link');
                elem.bind('click', function() {
                    $location.path(attr.xgHref);
                    scope.$apply();
                });
            }
        }
    })
    .directive('xgOpenRegistry', function($log, $location, dbHandler, globalParams) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                model: '=',
                params: '='
            },
            template: '<a class="btn btn-xs btn-default"><i class="fa fa-sign-in"></i></a>',
            link: function(scope, elem, attr) {
                elem.on('click', function() {
                    dbHandler
                        .getConnectionTypes(scope.model.id)
                        .getRegistry({"id": scope.model.id})
                        .runQuery()
                        .then(function(response) {
                            var user = globalParams.get('user');
                            user.registry = Number(scope.model.id);
                            globalParams.set('user', user);
                            globalParams.set('connectionTypes', response.connectionType);
                            globalParams.set('registry', response.registry[0]);
                            $location.path('entry/list');
                        });
                });
            }
        }
    })
    .directive('xgCompile', function($log, $compile) {
        return {
            restrict: 'AEC',
            scope: {
                directive: '=',
                model: '@',
                params: '@',
            },
            controller: function($scope) {
            },
            link: function(scope, elem, attr) {
                var str = '<' + scope.directive +
                    (scope.model ? ' model="' + scope.model + '"' : null) +
                    (scope.params ? ' params="' + scope.params + '"' : null) +
                    + '></' + scope.directive + '>';
                elem.replaceWith($compile(str)(scope.$parent));
            }
        }
    });