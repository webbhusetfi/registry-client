var regApp = angular.module('RegistryClient')
.factory('dialogHandler', ['$http', '$q', '$log', '$route', '$location', '$uibModal', 'dbHandler', function($http, $q, $log, $route, $location, $uibModal, dbHandler) {
    var dialogHandler = {
        deleteConfirm: function(item, action)
        {
            if(item.id !== undefined)
            {
                var modalInstance = $uibModal.open({
                    templateUrl: 'template/entryListDelete.html',
                    controller: function($scope, $uibModalInstance, $log, item) {
                        $scope.item = item;
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        }

                        $scope.go = function(id) {
                            $uibModalInstance.close(id);
                        }
                    },
                    size: 'sm',
                    resolve: {
                        item: item
                    }
                });
                
                modalInstance.result.then(function (id) {
                    dbHandler
                        .setQuery(action)
                        .runQuery()
                        .then(function(response) {
                            $route.reload();
                        })
                        .catch(function(response) {
                            $log.error(response);
                        });
                });
            }
        }
    }

    return dialogHandler;
}]);