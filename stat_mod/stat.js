regApp.controller('statController', function ($scope, $http, globalParams, dbHandler) {
    
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
                    "select": "count",
                    "filter": {
                        "type": "ASSOCIATION",
                        "registry": Number(globalParams.get('user').registry)
                    }
                }
            },
            "headorg": {
                "service": "entry/search",
                "arguments": {
                    "select": "count",
                    "filter": {
                        "type": "UNION",
                        "registry": Number(globalParams.get('user').registry)
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
        }

        var query = {
            "count" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "count",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry),
                        "parentEntry": selected_org
                    }
                }
            },
            "gender" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "gender",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry),
                        "parentEntry": selected_org
                    }
                }
            },
            "age" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "age",
                    "filter": {
                        "type": "MEMBER_PERSON",
                        "registry": Number(globalParams.get('user').registry),
                        "parentEntry": selected_org
                    }
                }
            }
        };

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
                var data = [];
                angular.forEach(response.gender.data, function (value, key) {
                    labels.push(gender_lang[value.gender]);    
                    data.push(value.found);
                });
                $scope.view_org_gender.labels = labels;
                $scope.view_org_gender.data = data;

                var labels = [];
                var data = [];
                var d = [];
                var cnt = 0;
                angular.forEach(response.age.data, function (value, key) {
                    if (value.age != null && value.age > 50 && value.age < 110) {
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
