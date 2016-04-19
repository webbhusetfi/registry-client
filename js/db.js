var regApp = angular.module('RegistryClient')
.factory('dbHandler', ['$http', '$q', '$log', '$location', 'globalParams', function($http, $q, $log, $location, globalParams) {
    var reports = []
    var query = {};
    var options = {};
    var url = "";

    // internal functions
    var dbInternals = {
        getConfig: function() {
            var defer = $q.defer();
            var defaults = {
                apiurl: "https://api.registry.huset.fi/",
                url: url,
                registry: Number(globalParams.get('user').registry)
            }
            $http
                .get('/config.local.json')
                .then(function(response) {
                    if(angular.isObject(response))
                        defer.resolve(angular.merge(defaults, response.data));
                    else
                        defer.resolve(defaults);
                });
            return defer.promise;
        }
    }
    
    var dbHandler = {
        // external functions
        setUrl: function(urlString) {
            if(angular.isString(urlString))
                url = urlString;
            else
                $log.error('Not a string in setUrl(urlString)');
            
            return this;
        },
        // overwrites query buffer
        setQuery: function(newQuery) {
            if(newQuery !== undefined)
                query = newQuery;
            
            angular.forEach(Object.keys(newQuery), function(value, key) {
                reports.push(value);
            });
            
            return this;
        },
        setLogin: function(queryData) {
            var defer = $q.defer();
            
            dbInternals.getConfig().then(function(config) {
                $http
                    .post(config.apiurl + config.url, queryData)
                    .then(function(response) {
                        globalParams.set('user', response.data);
                        dbHandler.reset();
                        defer.resolve(response.data);
                    }).catch(function(response) {
                        dbHandler.reset();
                        defer.resolve(response.data);
                    });
            });
            
            return defer.promise;
        },
        getRegistries: function(arguments) {
            if(arguments === undefined)
                arguments = {};
            
            reports.push('registries');
            query.registries = {
                "service":"registry/search",
                "arguments": angular.merge({
                    "offset":0,
                    "limit":20
                }, arguments)
            }
            
            return this;
        },
        getRegistry: function(arguments) {
            if(arguments.id !== undefined)
            {
                if(arguments === undefined)
                    arguments = {};

                reports.push('registry');
                query.registry = {
                    "service":"registry/read",
                    "arguments": angular.merge({
                        "id":null
                    }, arguments)
                }
            }else{
                $log.error('read must have id');
            }
            
            return this;
        },
        getEntryTypes: function() {
            reports.push('entryTypes');
            query.entryTypes = {
                "service":"type/search",
                "arguments": {
                    "filter": {
                        "registry": globalParams.get('user').registry
                    }
                }
            }
            
            return this;
        },
        getConnectionTypes: function() {
            reports.push('connectionType');
            query.connectionType = {
                "service":"connectionType/search",
                "arguments": {
                    "filter": {
                        "registry": globalParams.get('user').registry
                    }
                }
            }
            
            return this;
        },
        getProperties: function(args) {
            if(args === undefined)
                args = {};
            if(args.name === undefined)
                args.name = 'propertyGroups';
            
            reports.push(args.name);
            options = angular.merge(options, {"propertyTree":args.name});
            
            query[args.name] = {
                "service":"propertyGroup/search",
                "arguments": {
                    "filter": {
                        "registry": globalParams.get('user').registry
                    }
                },
                "order": {
                    "name":"asc"
                }
            }
            
            return this;
        },
        getEntries: function(args) {
            if(args.name === undefined)
                args.name = 'entries';
            reports.push(args.name);
            query[args.name] = {
                "service":"entry/search",
                "arguments":{
                    "filter": {
                        "registry": globalParams.get('user').registry
                    },
                    "order": {
                        "name":"asc"
                    }
                }
            }
            
            if(args.include !== undefined)
                query[args.name].arguments.include = args.include;
            if(args.filter !== undefined)
                query[args.name].arguments.filter = angular.merge(query[args.name].arguments.filter, args.filter)
            if(args.order !== undefined)
                query[args.name].arguments.order = angular.merge(query[args.name].arguments.order, args.order)
            if(args.limit !== undefined)
                query[args.name].arguments.limit = args.limit;
            if(args.offset !== undefined)
                query[args.name].arguments.offset = args.offset;
            if(args.append !== undefined)
                query[args.name] = angular.merge(query[args.name], args.append);
            
            return this;
        },
        // expects id
        getEntry: function(args) {
            if(args.id !== undefined)
            {
                if(args.name === undefined)
                    args.name = 'entry';
                reports.push(args.name);
                query[args.name] = {
                    "service":"entry/read",
                    "arguments": {
                        "id":args.id
                    }
                }
            }
            
            return this;
        },
        getFullEntry: function(id) {
            reports.push('fullEntry');
            options = angular.merge(options, {"fullEntry":1});
            query.fullEntry = {
                "service":"entry/read",
                "arguments": {
                    "id": id,
                    "include":["properties"]
                }
            }
            query.connection = {
                "service":"connection/search",
                "arguments": {
                    "filter": {
                        "childEntry":id
                    }
                }
            }
            query.address = {
                "service":"address/search",
                "arguments": {
                    "filter": {
                        "entry":id
                    }
                }
            }
            query.properties = {
            }
            
            return this;
        },
        runQuery: function() {
            var result = $q.defer();
            
            dbInternals.getConfig().then(function(config) {
                $http
                    .post(config.apiurl + url, query)
                    .then(function(response)
                    {
                        if(options.propertyTree !== undefined)
                        {
                            if(response.data[options.propertyTree].data.foundCount > 0)
                            {
                                var subQuery = {}
                                angular.forEach(response.data[options.propertyTree].data.items, function(value, key) {
                                    subQuery[value.id] = {
                                        "service":"property/search",
                                        "arguments": {
                                            "filter": {
                                                "propertyGroup":value.id
                                            },
                                            "order": {
                                                "name":"asc"
                                            }
                                        }
                                    }
                                });
                                $http
                                    .post(config.apiurl + url, subQuery)
                                    .then(function(SQResponse) {
                                        angular.forEach(SQResponse.data, function(value, key) {
                                            response.data[options.propertyTree + key] = value.data.items;
                                        });
                                        result.resolve(dbHandler.parseResult(response.data));
                                    })
                            }
                        }
                        result.resolve(dbHandler.parseResult(response.data));
                    })
                    .catch(function(response)
                    {
                        if(response.status === 403)
                            $location.path('/logout');
                    })
            });
            return result.promise;
        },
        reset: function() {
            reports = [];
            query = {};
            options = {};
            url = "";
            
            return this;
        },
        parseResult: function(result) {
            var parsedResult = {};
            angular.forEach(reports, function(value, key) {
                var service = query[value].service.split('/')[0];
                var queryType = query[value].service.split('/')[1];
                var option = query[value].option;
                
                switch(queryType)
                {
                    case 'read':
                        switch(service)
                        {
                            case 'registry':
                                if(result[value].status == 'success')
                                {
                                    parsedResult[value] = result[value].data.item;
                                }else{
                                        parsedResult.entry = false;
                                }
                            break;
                            
                            case 'entry':
                                if(options['fullEntry'] !== undefined)
                                {
                                    if(result.fullEntry.status == 'success')
                                    {
                                        parsedResult.fullEntry = result.fullEntry.data.item;
                                        if(result.connection.status == 'success' && result.connection.data.foundCount > 0)
                                        {
                                            parsedResult.fullEntry.connection = result.connection.data.items;
                                        }
                                        if(result.address.status == 'success' && result.address.data.foundCount > 0)
                                        {
                                            parsedResult.fullEntry.address = result.address.data.items;
                                        }
                                    }
                                }else if(result[value].status == 'success')
                                {
                                    parsedResult[value] = result[value].data.item;
                                }else{
                                        parsedResult.entry = false;
                                }
                            break;
                        }
                    break;
                    
                    case 'delete':
                        parsedResult[value] = result[value];
                    break;
                    
                    case 'create':
                    case 'update':
                        parsedResult[value] = result[value];
                    break;
                    
                    default:
                    case 'search':
                        switch(service)
                        {
                            case 'type':
                            case 'connectionType':
                            case 'propertyGroup':
                                if(result[value].status === 'success' && result[value].data.foundCount > 0)
                                {
                                    parsedResult[value] = {};
                                    angular.forEach(result[value].data.items, function(row, key2) {
                                        parsedResult[value][row.id] = row;
                                        if(service === 'propertyGroup' && options.propertyTree !== undefined)
                                        {
                                            parsedResult[value][row.id]['children'] = result[options.propertyTree + row.id];
                                        }
                                    });
                                }
                            break;

                            default:
                                if(result[value].status === 'success' && result[value].data.foundCount > 0)
                                {
                                    parsedResult[value] = {};
                                    angular.forEach(result[value].data.items, function(row, key2)
                                    {
                                        if(row.class === 'PERSON')
                                            row.name = row.lastName + ', ' + row.firstName;
                                        parsedResult[value][key2] = row;
                                    });
                                    if(parsedResult.foundCount === undefined)
                                        parsedResult.foundCount = {};
                                    parsedResult.foundCount[value] = result[value].data.foundCount;
                                }else{
                                    if(parsedResult.foundCount === undefined)
                                        parsedResult.foundCount = {};

                                    parsedResult.foundCount[value] = 0;
                                }
                            break;
                        }
                    break;
                }
            });
            
            dbHandler.reset();
            return parsedResult;
        }
    }

    return dbHandler;
}]);