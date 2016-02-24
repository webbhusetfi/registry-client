regApp.controller('statisticsGender', function () {
  this.labels = ["Man", "Kvinna", "Odef."];
  this.data = [4000, 1200, 100];
});
regApp.directive('statisticsGender', function () {
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