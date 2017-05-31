angular.module('RegistryClient')
.factory('globalParams', function($window, $location, $log, $routeParams) {
    var state;

    var get = function(key)
    {
        var stringValue = $window.sessionStorage.getItem('registryParams');
        var jsonValue = $window.JSON.parse(stringValue) || {};
        
        return _.get(jsonValue, key);
    }

    var set = function(key, value)
    {
        if(jsonValue = $window.JSON.parse($window.sessionStorage.getItem('registryParams')))
            jsonValue = _.set(jsonValue, key, value);
        else
            jsonValue = _.set({}, key, value);
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
    
    var types = function() {
        var typeobj = {};
        if(this.get('user.role') == 'ADMIN' || this.get('user.role') == 'SUPER_ADMIN') {
            typeobj = _.assign(typeobj, {
                "UNION":"Förbund",
                "ASSOCIATION":"Förening"
            });
        }
        typeobj = _.assign(typeobj, {"MEMBER_PERSON":"Medlem"});
        return typeobj;
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
        types: types,
        get: get,
        set: set,
        sendParams: sendParams,
        getParams: getParams,
        unset: unset,
        dateToObject: dateToObject
    };
});