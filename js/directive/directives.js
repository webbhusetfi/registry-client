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
    });