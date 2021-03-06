angular.module('RegistryClient')
.factory('translation', function($window, $location, $rootScope, $log, $routeParams, globalParams) {
    var translations = {
        "Connection added":{
            "sv":"Tillhörigheter insatta"
        },
        "Address added":{
            "sv":"Adresser insatta"
        },
        "Address modified":{
            "sv":"Adresser ändrade"
        },
        "Entry modified":{
            "sv":"Basuppgifter ändrade"
        },
        "Connection modified":{
            "sv":"Tillhörigheter ändrade"
        },
        "Connection removed":{
            "sv":"Tillhörighet raderad"
        },
        "This value should not be blank.":{
            "sv":"Detta värde måste vara ifyllt."
        },
        "Invalid entity":{
            "sv":"Ogiltigt värde"
        },
        "This value is not a valid email address.":{
            "sv":"Detta värde är inte en giltig e-postaddress."
        }
    };
    
    function tr(string) {
        if(string) {
            var language = globalParams.get('user.language');
            if(_.isObject(translations[string]))
                return translations[string][language];
            else{
                $log.log('no translation for "' + string + '"');
                return string;
            }
        }else{
            return false;
        }
    }
    
    return {
        tr:tr
    }
});