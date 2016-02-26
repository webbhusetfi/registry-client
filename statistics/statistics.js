
regApp.controller('statisticsGender', function ($http, globalParams) {
    this.labels = [];
    this.data = [];    
    this.show = true;    
    var labels = [];
    var data = [];
    var show = true;
    
    var lang = [];
    lang["FEMALE"] = "Kvinna";
    lang["MALE"] = "Man";
    lang[null] = "Odefinierad";

    var query = {
        "gs" : {
            "service": "entry/statistics",
            "arguments": {
                "select": "gender",
                "filter": {
                    "class": "PERSON",
                    "registry": globalParams.get('user').registry
                }
            }
        }
    };
    
    $http
        .post("http://api.registry.huset.fi/", 
            query)
        .then(function(response) {
            angular.forEach(response.data.gs.data, function (value, key) {
                labels.push(lang[value.gender]);    
                data.push(value.found);
            });
            this.labels = labels;
            this.data = data;
        }).catch(function(response) {
            show = false;
        });

    this.labels = labels;
    this.data = data;
    this.show = show;
});


regApp.directive('statisticsGender', function ($http) {
    return {
        restrict: 'E',
        templateUrl: 'statistics/templates/statisticsGender.html'
    };
});


regApp.controller('statisticsAge', function () {
    
    
    this.labels = ["1900", "1910", "1920", "1930", "1940", "1950", "1960"];
    this.data = [
        [28, 48, 68, 98, 120, 27, 10]
    ];
});

regApp.directive('statisticsAge', function () {
    return {
        restrict: 'E',
        templateUrl: 'statistics/templates/statisticsAge.html'
    };
});