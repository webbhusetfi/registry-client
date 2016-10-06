angular.module('RegistryClient')
.controller('entryList', function($scope, $window, $route, $routeParams, $http, $location, $log, $uibModal, $filter, globalParams, dialogHandler, dbHandler) {
    $scope.globalParams = globalParams;
    $scope.routeParams = $routeParams;
    $scope.params = {};
    $scope.headers = {
        'MEMBER_PERSON': ['ID', 'Förnamn', 'Efternamn', 'Föd.dag', 'Föd.månad', 'Föd.år', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad'],
        'ASSOCIATION': ['ID', 'Namn', 'Beskrivning', 'Bank', 'Kontonr.', 'VAT-nr.', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land', 'E-post', 'Mobil', 'Telefon', 'Skapad']
    };

    if (globalParams.get('user').role == 'USER') {
        $scope.params.type = 'MEMBER_PERSON';
    }
    
    $scope.toggleParent = function() {
        if($scope.params.parentEntry === null) {
            delete $scope.params.parentEntry;
        }else{
            $scope.params.parentEntry = null;
        }
        $scope.init();
    }

    $scope.deleteConfirm = function(item) {
        dialogHandler.deleteConfirm(item, {
            "entry": {
                "service":"entry/delete",
                "arguments": {
                    "id": item.id,
                    "type": item.type
                }
            }
        })
    };

    $scope.checkProperty = function(id)
    {
        var onIndex = Number($scope.params.withProperty.indexOf(id));
        var offIndex = Number($scope.params.withoutProperty.indexOf(id));

        if(onIndex == -1 && offIndex == -1)
            $scope.params.withProperty.push(id);
        else if(offIndex == -1)
        {
            $scope.params.withProperty.splice(onIndex,1);
            $scope.params.withoutProperty.push(id);
        }
        else
        {
            $scope.params.withoutProperty.splice(offIndex,1);
        }
        $scope.init();
    }

    $scope.setAdditionals = function(id)
    {
        var onIndex = Number($scope.params.additionals.indexOf(id));

        if(onIndex == -1)
        {
            $scope.params.additionals = [];
            $scope.params.additionals = id;
            switch(id)
            {
                case 'address':
                    $scope.params.includes = ['address'];
                break;
                case 'contact':
                    $scope.params.includes = ['address'];
                break;
            }
        }
        else
        {
            $scope.params.includes = [];
            $scope.params.additionals = [];
        }

        $scope.init();
    }

    $scope.setSearch = function()
    {
        angular.forEach($scope.params.filter, function(val, key) {
            if(val == null || val == undefined || val == "")
                delete $scope.params.filter[key];
        });
        $scope.params.offset = 0;
        $scope.init();
    }

    $scope.setType = function(type)
    {
        $scope.params.type = type;
        $scope.params.filter = {};
        $scope.params.offset = 0;
        $scope.init();
    }

    $scope.setLimit = function(limit)
    {
        $scope.params.limit = limit;
        $scope.init();
    }

    $scope.setOffset = function(offset)
    {
        $scope.params.offset = offset;
        $scope.init();
        $window.scroll(0,0);
    }

    $scope.go = function(location, params, savestate)
    {
        if(savestate)
            globalParams.set('entryList', $scope.params);
        else
            globalParams.unset('entryList');
        if(angular.isObject(params)) {
            if(Object.keys(params).length)
                globalParams.sendParams(params);
        }else{
            globalParams.sendParams(undefined);
        }

        $location.path(location);
    }

    if(globalParams.get('entryList'))
    {
        $scope.params = globalParams.get('entryList');
        globalParams.unset('entryList');
    }else{
        $scope.params = {
            "type": ((globalParams.get('user').role == 'USER') ? "MEMBER_PERSON":"ASSOCIATION"),
            "limit":50,
            "offset":0,
            "withProperty":[],
            "withoutProperty":[],
            "additionals":[],
            "includes":[],
            "filter":{}
        }
    }

    if($routeParams.id !== undefined)
    {
        $scope.params.type = "MEMBER_PERSON";
        $scope.params.parentEntry = $routeParams.id;
        $scope.params.orgId = $routeParams.id;
    }

    $scope.doExport = function () {
        return dbHandler
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
                var ret = [];
                angular.forEach(response.entrylist, function (value, key) {
                    if ($scope.params.type == 'MEMBER_PERSON') {
                        var row = [
                            value.id,
                            value.firstName,
                            value.lastName,
                            value.birthDay,
                            value.birthMonth,
                            value.birthYear,
                            ((value.address) ? value.address.street : null),
                            ((value.address) ? value.address.postalCode : null),
                            ((value.address) ? value.address.town : null),
                            ((value.address) ? value.address.country : null),
                            ((value.address) ? value.address.email : null),
                            ((value.address) ? value.address.mobile : null),
                            ((value.address) ? value.address.phone : null),
                            $filter('date')(new Date(value.createdAt), "d.M.yyyy HH:mm")
                        ];
                    } else {
                        var row = [
                            value.id,
                            value.name,
                            value.description,
                            value.bank,
                            value.account,
                            value.vat,
                            ((value.address) ? value.address.street : null),
                            ((value.address) ? value.address.postalCode : null),
                            ((value.address) ? value.address.town : null),
                            ((value.address) ? value.address.country : null),
                            ((value.address) ? value.address.email : null),
                            ((value.address) ? value.address.mobile : null),
                            ((value.address) ? value.address.phone : null),
                             $filter('date')(new Date(value.createdAt), "d.M.yyyy HH:mm")
                        ];
                    }
                    ret.push(row);
                });
                return ret;
            });
    }

    $scope.init = function()
    {
        var entry_search = {
                "name":"entrylist",
                "include":$scope.params.includes,
                "limit":$scope.params.limit,
                "offset":$scope.params.offset,
                "order": {
                    "lastName":"asc",
                    "firstName":"asc",
                    "name":"asc"
                }};
        entry_search.filter = $scope.params.filter;
        entry_search.filter.withProperty = $scope.params.withProperty;
        entry_search.filter.withoutProperty = $scope.params.withoutProperty;
        entry_search.filter.class = $scope.params.class;
        entry_search.filter.type = $scope.params.type;
        if(globalParams.get('user').role == 'USER') {
            if($scope.params.type == 'ASSOCIATION') {
                entry_search.filter.id = globalParams.get('user').entry;    
            }else{
                entry_search.filter.parentEntry = globalParams.get('user').entry;    
            }
        }else{
            entry_search.filter.parentEntry = $scope.params.parentEntry;
        }

        dbHandler
            .getEntry({
                "name":"organization",
                "id": $scope.params.orgId
            })
            .getProperties()
            .setJoin({
                "resource":"properties",
                "service":"property/search",
                "field":"id",
                "equals":"propertyGroup",
                "name":"children"
            })
            .getEntries(entry_search)
            .runQuery()
            .then(function(response) {
                $scope.types = globalParams.static.types;
                $scope.entrylist = response.entrylist;
                $scope.organization = response.organization;
                $scope.properties = response.properties;
                $scope.foundCount = response.foundCount;

                if(angular.isObject($scope.properties) && $scope.params.propertyGroup === undefined)
                {
                    angular.isObject($scope.properties[0])
                        $scope.params.propertyGroup = String($scope.properties[0].id);
                }

                if($scope.foundCount.entrylist > 0)
                {
                    var active = $scope.params.offset/$scope.params.limit;
                    var total = Math.ceil(Number($scope.foundCount.entrylist)/$scope.params.limit);

                    if(total < 6)
                    {
                        var lower = 0;
                        var upper = total;
                    }else if(active > 4)
                    {
                        var lower = active - 4;
                        var upper = active + 5 < total ? active + 5 : total;
                    }else if(active > total - 5 && total > 10){
                        var lower = total - 10;
                        var upper = total;
                    }else if(active < 5 && total > 9)
                    {
                        lower = 0;
                        upper = 9;
                    }else{
                        var lower = 0;
                        var upper = total;
                    }

                    var pagination = [];
                    for(i = lower; i < upper; i++)
                    {
                        var page = {};
                        page.name = i;
                        if(i == active)
                            page.class = 'active';
                        pagination.push(page);
                    }
                }
                $scope.pagination = pagination;
            });
    };

    $scope.init();
});