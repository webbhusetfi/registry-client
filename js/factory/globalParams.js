angular.module('RegistryClient')
.factory('globalParams', function($window, $location, $log, $routeParams) {
    var state;

    var get = function(key)
    {
        var stringValue = $window.sessionStorage.getItem('registryParams');
        var jsonValue = $window.JSON.parse(stringValue) || {};
        
        if(key.split('.').length > 1) {
            if(value = key.split('.').reduce(function(obj, i) { return obj[i]}, jsonValue))
                return value;
            else
                return false;
        }else if(jsonValue[key] !== undefined) {
            return jsonValue[key]
        }else
            return false;
    }

    var set = function(key, value)
    {
        var stringValue = $window.sessionStorage.getItem('registryParams');
        var jsonValue = $window.JSON.parse(stringValue) || {};

        jsonValue[key] = value;
        $window.sessionStorage.setItem('registryParams', $window.JSON.stringify(jsonValue));
    }

    var unset = function(key)
    {
        if(key === 'all')
        {
            $window.sessionStorage.removeItem('registryParams');
        }else{
            var stringValue = $window.sessionStorage.getItem('registryParams');
            var jsonValue = $window.JSON.parse(stringValue) || {};

            delete jsonValue[key];
            $window.sessionStorage.setItem('registryParams', $window.JSON.stringify(jsonValue));
        }
    }

    var sendParams = function(object) {
        if(angular.isObject(object))
            state = object;
        else
            state = undefined;
    }

    var getParams = function() {
        return state;
    }

    var dateToObject = function(date)
    {
        if(date)
        {e
            return {
                "date": {
                    "year": date.getFullYear(),
                    "month": date.getMonth()+1,
                    "day": date.getDate()
                },
                "time": {
                    "hour": date.getHours(),
                    "minute": date.getMinutes()
                }
            }
        }else{
            return null;
        }
    }

    return {
        static: {
            "types":{
                "UNION":"Förbund",
                "ASSOCIATION":"Förening",
                "MEMBER_PERSON":"Medlem"
            },
            "datepickerPopupConfig":{
                "uib-datepicker-popup":"dd.MM.yyyy",
                "current-text":"Idag",
                "clear-text":"Töm",
                "close-text":"Stäng",
                "on-open-focus":false
            }
        },
        get: get,
        set: set,
        sendParams: sendParams,
        getParams: getParams,
        unset: unset,
        dateToObject: dateToObject
    };
});