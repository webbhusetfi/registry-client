angular.module('RegistryClient')
.controller('statController', function ($scope, $http, globalParams, dbHandler, $filter) {
    $scope.globalParams = globalParams;
    
    $scope.doCsvMemberCount = function () {
        var oquery = {
            "suborgs": {
                "service": "entry/search",
                "arguments": {
                    "filter": {
                        "type": "ASSOCIATION",
                        "registry": Number(globalParams.get('user').registry)
                    }, "order": {
                        "name":"asc"
                    }
                }
            }
        };

        return dbHandler
        .setUrl('')
        .setQuery(oquery)
        .parse(false)
        .runQuery()
        .then(function(response) {
            qry = {};
            suborgs = response.suborgs.data.items;
            angular.forEach(suborgs, function (value, key) {
                qry_id = 'count' + value.id;
                qry[qry_id] = {
                    "service": "entry/statistics",
                    "arguments": {
                        "select": "count",
                        "filter": {
                            "type": "MEMBER_PERSON",
                            "registry": Number(globalParams.get('user').registry),
                            "parentEntry":value.id
                        }
                    }
                };
            });
            
            return dbHandler
            .setUrl('')
            .setQuery(qry)
            .parse(false)
            .runQuery()
            .then(function(response) {
                var ret = [];
                angular.forEach(suborgs, function (value, key) {
                    if (response['count' + value.id].status == 'success') {
                        value.count = response['count' + value.id].data[0].found; 
                    }
                    ret.push([
                        value.id, 
                        value.name,
                        value.count
                    ]);
                });
                return ret;
            })
            .catch(function(response) {
                console.log('err' + JSON.stringify(response));
            });  
        })
        .catch(function(response) {
            console.log('err' + JSON.stringify(response));
        });        
    }
    
    $scope.init = function () {
        $scope.registry_msg = !!globalParams.get('user').registry;
        $scope.stat_panel = false;
        $scope.role_admin = (!globalParams.get('user').entry && globalParams.get('user').role != 'USER');

        //$scope.role = globalParams.get('user').role;
        //$scope.entry = globalParams.get('user').entry;

        $scope.error_exists = false;
        $scope.headorg = null;
        $scope.headorg_members_count = null;
        $scope.suborgs = [];

        $scope.selected_org = 0;
        $scope.view_org = null;
        $scope.view_org_members_count = 0;

        $scope.view_org_gender = {};
        $scope.view_org_gender.labels = null;
        $scope.view_org_gender.data = null;
        $scope.view_org_age = {};
        $scope.view_org_age_included_count = null;
        $scope.view_org_age.labels = null;
        $scope.view_org_age.data = null;
        $scope.view_org_age_included_count = 0;

        var query = {
            "suborgs": {
                "service": "entry/search",
                "arguments": {
                    "filter": {
                        "type": "ASSOCIATION",
                        "registry": Number(globalParams.get('user').registry)
                    }, "order": {
                        "name":"asc"
                    }
                }
            },
            "headorg": {
                "service": "entry/search",
                "arguments": {
                    "filter": {
                        "type": "UNION",
                        "registry": Number(globalParams.get('user').registry)
                    }, "order": {
                        "name":"asc"
                    }
                }
            },
            "member_count" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "count",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry)
                    }
                }
            }
        };

        dbHandler
            .setUrl('')
            .setQuery(query)
            .parse(false)
            .runQuery()
            .then(function(response) {
                angular.forEach(response.suborgs.data.items, function (value, key) {
                    $scope.suborgs.push(value);
                });

                $scope.headorg = response.headorg.data.items[0];    
                $scope.headorg_members_count = response.member_count.data[0].found;

                if (!globalParams.get('user').entry && globalParams.get('user').role != 'USER') {
                    $scope.view_org = $scope.headorg;
                    $scope.view_org_members_count = $scope.headorg_members_count;
                    $scope.viewOrg($scope.selected_org);
                } else {
                    $scope.viewOrg(globalParams.get('user').entry);
                }
                $scope.stat_panel = !!globalParams.get('user').registry;
            })
            .catch(function(response) {
                //console.log('err' + JSON.stringify(response));
                $scope.stat_panel = false;
                $scope.error_exists = true;
            });        

    }

    $scope.init();
    
    $scope.viewOrg = function(selected_org) {
        var gender_lang = [];
        gender_lang["FEMALE"] = "Kvinnor";
        gender_lang["MALE"] = "Män";
        gender_lang[null] = "Odefinierade";
        
        var query = {
            "count" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "count",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry)
                    }
                }
            },
            "gender" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "gender",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry)
                    }
                }
            },
            "age" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "age",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry)
                    }
                }
            }
        };
        
        if (selected_org == 0) {   // Headorg
            if ($scope.headorg) {
                $scope.view_org = $scope.headorg;
            } else {
                $scope.view_org = globalParams.get('registry');    
            }
            $scope.view_org_members_count = $scope.headorg_members_count;
            selected_org = null;
        } else {
            angular.forEach($scope.suborgs, function (value, key) {
                if (value.id == selected_org) {
                    $scope.view_org = value;
                }
            });
            query.count.arguments.filter.parentEntry = selected_org;
            query.gender.arguments.filter.parentEntry = selected_org;
            query.age.arguments.filter.parentEntry = selected_org;
        }

        $scope.view_org_gender_show = true;
        $scope.view_org_age_show = true;
        
        dbHandler
            .setUrl('')
            .setQuery(query)
            .parse(false)
            .runQuery()
            .then(function(response) {
                $scope.view_org_gender.labels = null;
                $scope.view_org_gender.data = null;
                $scope.view_org_age.labels = null;
                $scope.view_org_age.data = null;
                $scope.view_org_age_included_count = 0;

                $scope.view_org_members_count = response.count.data[0].found;

                var labels = [];
                var labels2 = [];
                var data = [];
                angular.forEach(response.gender.data, function (value, key) {
                    labels2.push(gender_lang[value.gender]);    
                    labels.push(gender_lang[value.gender] + ': ' + $filter('number')((value.found/$scope.view_org_members_count)*100, 0) + '% (' + value.found + ' st.)');    
                    data.push(value.found);
                });
                $scope.view_org_gender.labels = labels;
                $scope.view_org_gender.labels2 = labels2;
                $scope.view_org_gender.data = data;
                
                var labels = [];
                var data = [];
                var d = [];
                var cnt = 0;
                angular.forEach(response.age.data, function (value, key) {
                    //if (value.age != null && value.age > 50 && value.age < 110) {
                    if (value.age != null) {
                        labels.push(value.age);    
                        d.push(value.found);
                        cnt = cnt + Number(value.found);
                    }
                });
                if (cnt != 0) {
                    data.push(d);   
                } else {
                    $scope.view_org_age_show = false;
                }

                $scope.view_org_age.labels = labels;
                $scope.view_org_age.data = data;
                $scope.view_org_age_included_count = cnt;
            })
            .catch(function(response) {
                $scope.view_org_gender_show = false;
                $scope.view_org_age_show = false;
                $scope.error_exists = true;
            });

    };
});
