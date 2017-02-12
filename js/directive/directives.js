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
                target:'='
            },
            replace:true,
            template:'<span><a ng-click="swapSort();" uib-tooltip="Sortera"><i class="fa fa-sort"></i><span ng-show="currentSortField()" style="color:red;">*</span></a></span>',
            controller: function($scope) {
                
            },
            link: function(scope, elem, attr) {
                scope.swapSort = function() {
                    order = scope.currentSortOrder();
                    delete scope.query.arguments.order;
                    scope.query.arguments.order = {};
                    scope.query.arguments.order = _.set(scope.query.arguments.order, scope.target, ((order == "asc") ? "desc" : "asc") );
                };
                
                scope.currentSortOrder = function() {
                    order = scope.query.arguments.order[scope.target];
                    if (!order) {
                        var parts = scope.target.split('.');
                        if(parts[1]){
                            if (scope.query.arguments.order.hasOwnProperty(parts[0]) && scope.query.arguments.order[parts[0]].hasOwnProperty(parts[1])) {
                                order = scope.query.arguments.order[parts[0]][parts[1]];
                            } else {
                                order = "asc";
                            }
                        } else {
                            order = "asc";
                        }
                    }                    
                    return order;
                }
                
                scope.currentSortField = function() {
                    field = scope.query.arguments.order.hasOwnProperty(scope.target);
                    if (!field) {
                        var parts = scope.target.split('.');
                        if(parts[1]){
                            if (scope.query.arguments.order.hasOwnProperty(parts[0]) && scope.query.arguments.order[parts[0]].hasOwnProperty(parts[1])) {
                                field = true;
                            } else {
                                field = false;
                            }
                        } else {
                            field = false;
                        }
                    }                    
                    return field;
                }
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