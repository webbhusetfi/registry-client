var regApp = angular.module('RegistryClient')
.factory('dialogHandler', ['$http', '$q', '$log', '$location', '$uibModal', function($http, $q, $log, $location, $uibModal) {
    var dialogHandler = {
        deleteConfirm: function(item, action)
        {
            if(item.id !== undefined)
            {
                var modalInstance = $uibModal.open({
                    templateUrl: 'template/entryListDelete.html',
                    controller: 'entryListDelete',
                    size: 'sm',
                    resolve: {
                        item: item
                    }
                });
                
                modalInstance.result.then(function (id) {
                    var deleteQuery = {
                        "entry": {
                            "service":"entry/delete",
                            "arguments": {
                                "id": id
                            }
                        }
                    }
                    $http
                        .post(globalParams.static.apiurl, deleteQuery)
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