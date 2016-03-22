regApp.controller('statController', function ($scope, $http, globalParams) {
    
    var config = function() {
        return {
            apiurl: "https://api.registry.huset.fi/",
            registry: Number(globalParams.get('user').registry)
        }
    }

    $scope.headorg = null;
    $scope.headorg_members_count = null;
    $scope.suborgs = [];
    
    $scope.selected_org = 0;
    $scope.view_org = null;
    $scope.view_org_members_count = null;
    
    $scope.view_org_gender = {};
    $scope.view_org_gender.labels = null;
    $scope.view_org_gender.data = null;
    $scope.view_org_age = {};
    $scope.view_org_age_included_count = null;
    $scope.view_org_age.labels = null;
    $scope.view_org_age.data = null;
    $scope.view_org_age_included_count = 0;

    var query = {
        "regs": {
            "service": "entry/search",
            "arguments": {
                "select": "count",
                "filter": {
                    "class": "ORGANIZATION",
                    "registry": config().registry,
                    "type":[3,1]
                }
            }
        },
        "count" : {
            "service": "entry/statistics",
            "arguments": {
                "select": "count",
                "filter": {
                    "class": "PERSON",
                    "registry": config().registry
                }
            }
        }
    };
    
    $http
    .post(config().apiurl, query)
    .then(function(response) {
        angular.forEach(response.data.regs.data.items, function (value, key) {
            if (value.type == 1) {
                $scope.headorg = value;
            } else if (value.type == 3) {
                $scope.suborgs.push(value);
            }
        });
        
        
        $scope.headorg_members_count = response.data.count.data[0].found;
        
        $scope.view_org = $scope.headorg;
        $scope.view_org_members_count = $scope.headorg_members_count;
        
        $scope.viewOrg($scope.selected_org);
    }).catch(function(response) {
        //show = false;
    });
    

    
    $scope.viewOrg = function(selected_org) {

        var gender_lang = [];
        gender_lang["FEMALE"] = "Kvinnor";
        gender_lang["MALE"] = "Män";
        gender_lang[null] = "Odefinierade";
        
        if (selected_org == 0) {   // Headorg
            $scope.view_org = $scope.headorg;
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
                        "class": "PERSON",
                        "registry": config().registry,
                        "parentEntry": selected_org
                    }
                }
            },
            "gender" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "gender",
                    "filter": {
                        "class": "PERSON",
                        "registry": config().registry,
                        "parentEntry": selected_org
                    }
                }
            },
            "age" : {
                "service": "entry/statistics",
                "arguments": {
                    "select": "age",
                    "filter": {
                        "class": "PERSON",
                        "registry": config().registry,
                        "parentEntry": selected_org
                    }
                }
            }
        };

        $scope.view_org_gender_show = true;
        $scope.view_org_age_show = true;
        
        $http
        .post(config().apiurl, query)
        .then(function(response) {
            
            $scope.view_org_gender.labels = null;
            $scope.view_org_gender.data = null;
            
            $scope.view_org_age.labels = null;
            $scope.view_org_age.data = null;
            $scope.view_org_age_included_count = 0;
            
            $scope.view_org_members_count = response.data.count.data[0].found;

            var labels = [];
            var data = [];
            angular.forEach(response.data.gender.data, function (value, key) {
                labels.push(gender_lang[value.gender]);    
                data.push(value.found);
            });
            $scope.view_org_gender.labels = labels;
            $scope.view_org_gender.data = data;

            var labels = [];
            var data = [];
            var d = [];
            var cnt = 0;
            angular.forEach(response.data.age.data, function (value, key) {
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
        }).catch(function(response) {
            $scope.view_org_gender_show = false;
            $scope.view_org_age_show = false;
        });
    };
});
