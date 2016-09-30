angular.module('RegistryClient')
    .directive('xgList', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/list.html',
            scope: {
                config: '=',
                resource: '='
            },
            controller: function($scope) {
                $scope.link = function(link, item) {
                    var pattern = /\[([^\]]+)\]/;
                    var results = [];
                    
                    while(match = pattern.exec(link)) {
                        link = link.replace(match[0], item[match[1]]);
                    }
                    return link;
                }
                
                if($scope.config.params.functions.deleteDialog) {
                    $scope.deleteDialog = function(item) {
                        var query = $scope.config.params.functions.deleteDialog.postAction;
                        angular.forEach(query, function(val1, key1) {
                            if(val1.arguments) {
                                var newArgs = {}
                                angular.forEach(val1.arguments, function(val2, key2) {
                                    newArgs[val2] = item[val2];
                                })
                                query[key1].arguments = newArgs;
                            }
                        });
                        dialogHandler.deleteConfirm(item, query);
                    }
                }
                
                if($scope.config.query) {
                    /*
                    angular.forEach($scope.config.query, function(val, key) {
                        switch (key) {
                            case 'base':
                        }
                    });
                    */
                }
            },
            link: function(scope, elem, attr) {
                elem.addClass('xg-form');
                if(scope.config === undefined)
                    $exceptionHandler('No config on xg-list');
            }
        }
    })