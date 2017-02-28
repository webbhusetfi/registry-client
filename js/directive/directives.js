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
    .directive('xgFilter', function($log) {
        return {
            restrict: 'E',
            scope: {
                query:'=',
                target:'='
            },
            replace:true,
            template:'<input type="text" class="form-control" value="{{value}}" uib-tooltip="Filtrera" />',
            controller: function($scope) {
                $scope.value = _.get($scope.query.arguments.filter, $scope.target);
            },
            link: function(scope, elem, attr) {
                elem.on('keyup', function(event) {
                    if(_.isString(elem[0].value) && String(elem[0].value).length > 0)
                        _.set(scope.query.arguments.filter, scope.target, elem[0].value);
                    else
                        _.unset(scope.query.arguments.filter, scope.target);
                    scope.$apply();
                });
            }
        }
    })
    .directive('xgSorter', function($log) {
        return {
            restrict: 'E',
            scope: {
                query:'=',
                target:'=',
            },
            replace:true,
            templateUrl:'js/directive/template/sorter.html',
            link: function(scope, elem, attr) {
                scope.swapSort = function() {
                    switch(_.get(scope.query.arguments.order, scope.target)) {
                        case 'asc':
                            _.set(scope.query.arguments.order, scope.target, 'desc');
                        break;
                        
                        case 'desc':
                            _.unset(scope.query.arguments.order, scope.target);
                        break;
                        
                        default:
                            _.set(scope.query.arguments.order, scope.target, 'asc');
                        break;
                    }
                };
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
                            $location.path('/entry/list');
                        });
                });
            }
        }
    });