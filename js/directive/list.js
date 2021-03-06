angular.module('RegistryClient')
    .directive('xgList', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/list.html',
            scope: {
                config: '=',
                resource: '=',
                query: '='
            },
            controller: function($scope, $rootScope) {
                $scope._ = $rootScope._;
                $scope.link = function(link, item) {
                    var pattern = /\[([^\]]+)\]/;
                    var results = [];
                    
                    while(match = pattern.exec(link)) {
                        link = link.replace(match[0], item[match[1]]);
                    }
                    return link;
                }
                
                // helper for sorting out function if
                $scope.functionIf = function(key, value, item) {
                    if(value.if)
                        return _.invoke($scope.config, 'functions.custom[' + key + '].if', item);
                    else
                        return true;
                }
                
                $scope.resolveValue = function(item, key) {
                    var values = key.split('.');
                    if(values.length > 1) {
                        var traversed;
                        if(traversed = item[values[0]]) {
                            values.shift();
                            angular.forEach(values, function(value, key) {
                                traversed = traversed[value];
                            });
                            return traversed;
                        }
                    }else{
                        return item[key];
                    }
                }
                
                if($scope.config.functions) {
                    if($scope.config.functions.deleteDialog) {
                        $scope.deleteDialog = function(args) {
                            var query = $scope.config.functions.deleteDialog.query;
                            angular.forEach(query, function(val1, key1) {
                                if(_.isArray(val1.arguments)) {
                                    var newArgs = {}
                                    angular.forEach(val1.arguments, function(val2, key2) {
                                        newArgs[val2] = args.item[val2];
                                    })
                                    args.query[key1].arguments = newArgs;
                                }
                            });
                            dialogHandler.deleteConfirm(_.assign(args, $scope.config.functions.deleteDialog));
                        }
                    }
                }
            },
            link: function(scope, elem, attr) {
                elem.addClass('xg-form');
                if(scope.config === undefined)
                    $exceptionHandler('No config on xg-list');
            }
        }
    })