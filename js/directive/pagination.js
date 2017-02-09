angular.module('RegistryClient')
    .directive('xgPagination', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/pagination.html',
            replace: true,
            scope: {
                limit: '=',
                offset: '=',
                count: '='
            },
            controller: function($scope, $rootScope) {
                $scope.next = 1;
                
                $scope.$watchGroup(['count','offset','limit'], function(value) {
                    $scope.active = Number(Math.ceil($scope.offset/$scope.limit));
                    $scope.pages = {};
                    $scope._ = $rootScope._;
                    
                    var total = Math.ceil(Number($scope.count)/Number($scope.limit));
                    
                    if(total < 2) {
                        $scope.hide = true;
                    }
                    if(Number($scope.active) < 5 && total >= 9) {
                        var i = 0;
                        var count = 9;
                    }else if(Number($scope.active) > 4 && total > (Number($scope.active)+4)){
                        var i = Number($scope.active)-4;
                        var count = Number($scope.active)+5;
                    }else if(Number($scope.active) > total-5 && total >= 9) {
                        var i = total-9;
                        var count = total;
                    }else if(total < 9) {
                        var i = 0;
                        var count = total;
                    }
                    while(i < count) {
                        $scope.pages[i] = (Number(i)+1);
                        if(i == count-1)
                            $scope.last = Number(i);
                        i++;
                    }
                });
                
                $scope.pagination = function(id) {
                    $scope.offset = $scope.limit * id;
                    $scope.active = id;
                    $scope.next = Number(id)+1;
                }
            }
        }
    })