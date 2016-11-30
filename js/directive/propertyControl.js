angular.module('RegistryClient')
    .directive('xgPropertyControl', function($exceptionHandler, $window, $log, dbHandler, dialogHandler) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/propertyControl.html',
            replace: true,
            scope: {
                properties: '=',
                query: '='
            },
            controller: function($scope) {
                $scope._ = _;
                $scope.withProperty = [];
                $scope.withoutProperty = [];
                $scope.selected = '0';
                
                $scope.mapValue = function(id) {
                    return _.find(
                            _.map(_.flatten(_.map($scope.properties, 'children')), function(value, key) {
                                return {"k":value.id,"v":value.name}
                            }),
                        {"k":id}).v;
                }
                
                $scope.setProperties = function(value) {
                    if(_.includes($scope.withProperty, value)) {
                        _.remove($scope.withProperty, function(id) {
                            return id == value;
                        });
                        if(!_.size($scope.withoutProperty))
                            $scope.withoutProperty = [];
                        $scope.withoutProperty.push(value);
                    }else if(_.includes($scope.withoutProperty, value)) {
                        _.remove($scope.withoutProperty, function(id) {
                            return id == value;
                        });
                    }else{
                        if($scope.withProperty == undefined)
                            $scope.withProperty = [];
                        $scope.withProperty.push(value);
                    }
                    if(!_.size($scope.withProperty))
                        delete $scope.query.arguments.filter.withProperty;
                    else
                        $scope.query.arguments.filter.withProperty = $scope.withProperty;
                    if(!_.size($scope.withoutProperty))
                        delete $scope.query.arguments.filter.withoutProperty;
                    else
                        $scope.query.arguments.filter.withoutProperty = $scope.withoutProperty;
                    
                }
            }
        }
    });