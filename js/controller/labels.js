angular.module('RegistryClient')
.controller('labels', function($scope, $window, $route, $routeParams, $http, $location, $log, $filter, $timeout, globalParams, dbHandler) {
    $scope.globalParams = globalParams;
    $scope.routeParams = $routeParams;
    $scope.params = globalParams.get('entryList');

    $scope.executing = true;

    $scope.init = function() {
       // alert('running wild');
        dbHandler
            .parse(true)
            .getEntries({
                "name":"entrylist",
                "include":['address'],
                "filter": angular.merge({
                    "withProperty":$scope.params.withProperty,
                    "withoutProperty":$scope.params.withoutProperty,
                    "class":$scope.params.class,
                    "type":$scope.params.type,
                    "parentEntry":((globalParams.get('user').role == 'USER') ? globalParams.get('user').entry : $scope.params.parentEntry),
                }, $scope.params.filter),
                "order": {
                    "lastName":"asc",
                    "name":"asc"
                }
            })
            .runQuery()
            .then(function(response) {
                //$scope.entries = response.entrylist;
                row_default = -1;
                col_default = 0;
                row_num = row_default;
                col_cum = col_default;
                var data = [];
                angular.forEach(response.entrylist, function (value, key) {
                    row = {};
                    page_is_full = false;
                    label_data = '';
                    if ($scope.params.type == 'MEMBER_PERSON') {
                        label_data = value.firstName + ' ' + value.lastName + '\n';
                        if (value.address) {
                            if (value.address.street) {
                                label_data += value.address.street + '\n';
                            }
                            if (value.address.postalCode) {
                                label_data += value.address.postalCode + ' ';
                            }
                            if (value.address.town) {
                                label_data += value.address.town + '\n';
                            }
                            if (value.address.country) {
                                label_data += value.address.country;
                            }
                        }
                    } else {
                        label_data = value.name + '\n';
                        if (value.address) {
                            if (value.address.street) {
                                label_data += value.address.street + '\n';
                            }
                            if (value.address.postalCode) {
                                label_data += value.address.postalCode + ' ';
                            }
                            if (value.address.town) {
                                label_data += value.address.town + '\n';
                            }
                            if (value.address.country) {
                                label_data += value.address.country;
                            }
                        }
                    }
                    if (key != 0 && (key % 24 === 0)) {
                        //document.addPage();
                        row_num = row_default;
                        col_num = col_default;
                        page_is_full = true;
                    }
                    if (key % 3 === 0) {
                        three = true;
                        row_num++;
                        col_num = 0;
                    } else {
                        three = false;
                        col_num++;
                    }
                    row.label = label_data;
                    row.page_is_full = page_is_full;
                    row.row_num = row_num;
                    row.col_num = col_num;
                    data.push(row);

                });
                $scope.entries = data;
            
              
                $timeout(function () {
                    window.print();
                    $scope.executing = false;
                });
            

            });            
    };

    $scope.init();
    
    $scope.doPrint = function () {
        window.print();    
    };


});
