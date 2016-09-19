angular.module('RegistryClient')
    .directive('xgList', function($window, $log) {
        return {
            restrict: 'E',
            templateUrl: 'js/directive/template/list.html',
            link: function(scope, elem, attr) {
                var resource = resource;
                $log.log(resource);
            }
        }
    })