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
            controller: function($scope) {
                $scope.pages = {};
                $scope.active = Number(Math.max($scope.offset/$scope.limit));
                
                var count = Math.max(Number($scope.count)/Number($scope.limit));
                var i = 0;
                while(i < count) {
                    $scope.pages[i] = (Number(i)+1);
                    if(i == count-1)
                        $scope.last = Number(i);
                    i++;
                }
                
                if(count < 2) {
                    $scope.hide = true;
                }
                
                $scope.pagination = function(id) {
                    $scope.offset = $scope.limit * id;
                    $scope.active = id;
                }
            }
        }
    })