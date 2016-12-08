angular.module('RegistryClient')
.factory('loadOverlay', ['$log','$document', function($log, $document) {
    var elem;
        
    var loadOverlay = {
        init: function() {
            $document.find('body').append('<div class="load-overlay inactive"><i class="fa fa-spin fa-spinner fa-4x"></i></div>');
        },
        enable: function() {
            angular.element(
                angular.element(
                    $document.find('body')
                )[0].querySelector('.load-overlay')
            ).removeClass('inactive');
        },
        disable: function() {
            angular.element(
                angular.element(
                    $document.find('body')
                )[0].querySelector('.load-overlay')
            ).addClass('inactive');
        }
    }

    return loadOverlay;
}]);