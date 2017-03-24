var regApp = angular.module('RegistryClient')
.factory('dialogHandler', ['$http', '$q', '$log', '$route', '$window', '$location', '$uibModal', 'dbHandler', function($http, $q, $log, $route, $window, $location, $uibModal, dbHandler) {
    var dialogHandler = {
        form: function(dialogProps, data) {
            if(dialogProps)
            {
                var modalInstance = $uibModal.open(_.assign({
                    templateUrl: 'js/factory/template/dialogForm.html',
                    controller: function($scope, $uibModalInstance, $log, $q) {
                        $scope._ = _;
                        $scope.output = dialogProps.args;
                        $scope.data = _.assign({}, data);
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        }

                        $scope.process = function() {
                            $uibModalInstance.close($scope.data);
                        }
                    },
                    size: 'lg'
                    }, dialogProps));
                
                modalInstance.result
                    .then(function(result) {
                        // error management and all that
                        _.invoke(dialogProps, 'args.buttons.save', result)
                    })
                    .catch(function() {
                        return false;
                    });
                    // dialog cancelled, do nothing
            }else{
                $log.error('no dialog template')
            }
        },
        deleteConfirm: function(args)
        {
            if(args.item.id !== undefined)
            {
                var modalInstance = $uibModal.open({
                    templateUrl: 'template/dialogDelete.html',
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
                        item: args.item,
                        query: args.query,
                        action: args.action
                    }
                });
                
                modalInstance.result.then(function (id) {
                    dbHandler
                        .setQuery(args.query)
                        .runQuery()
                        .then(function(response) {
                            // custom
                            if(_.isFunction(args.completed)) {
                                _.invoke(args, 'completed');
                            }
                            // program flow
                            else if(_.isObject(args.completed))
                            {
                                $log.log('object detected');
                                switch(args.completed.action) {
                                    case 'back':
                                        $window.history.back();
                                    break;
                                    case 'redirect':
                                        $location.path(args.completed.redirect);
                                    break;
                                }
                            }
                            // default
                            else
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