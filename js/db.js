var regApp = angular.module('RegistryClient')
.factory('dbHandler', ['$http', '$q', '$log', '$location', 'globalParams', function($http, $q, $log, $location, globalParams) {
    var query = {};
    var options = {};
    var joins = {};
    
    var reports = [];
    
    var url = "";
    
    var parse = true;

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
        parse: function(value) {
            parse = !!value;
            
            return this;
        },
        // append to query buffer
        setQuery: function(newQuery) {
            if(newQuery !== undefined)
                query = angular.merge(query, newQuery);
            
            angular.forEach(Object.keys(newQuery), function(value, key) {
                reports.push(value);
            });
            
            return this;
        },
        setJoin: function(join) {
            if(options.joins === undefined)
                options.joins = {};
            if(options.joins[join.resource] === undefined)
                options.joins[join.resource] = {};
            
            var name = (Number(Object.keys(options.joins[join.resource]).length) + 1);
            options.joins[join.resource][join.name] = join;
            
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
        setLogout: function() {
            var defer = $q.defer();
            
            dbInternals.getConfig().then(function(config) {
                $http
                    .post(config.apiurl + config.url)
                    .then(function(response) {
                        globalParams.unset('user');
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
        getConnectionTypes: function(id) {
            reports.push('connectionType');
            query.connectionType = {
                "service":"connectionType/search",
                "arguments": {
                    "filter": {
                        "registry": id ? id : globalParams.get('user').registry
                    }
                }
            }
            
            return this;
        },
        getProperties: function(args) {
            if(args === undefined)
                args = {};
            if(args.name === undefined)
                args.name = 'properties';
            
            reports.push(args.name);
            
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
                        "id":args.id,
                        "registry": globalParams.get('user').registry
                    }
                }
                if(args.include)
                    query[args.name].arguments.include = args.include;
            }
            
            return this;
        },
        runQuery: function() {
            var result = $q.defer();
            if(Object.keys(query).length > 0)
            {
                dbInternals.getConfig().then(function(config) {
                    $http
                        .post(config.apiurl + url, query)
                        .then(function(response)
                        {
                            angular.forEach(reports, function(report, rkey) {
                                var queryType = query[report].service.split('/')[1];
                                // push item to items.0
                                if(response.data[report].data && queryType === 'read')
                                {
                                    response.data[report].data.items = {"0":response.data[report].data.item}
                                    // delete original
                                    delete response.data[report].data.item;
                                }
                            });
                            if(options.joins)
                            {
                                var joinQuery = {};
                                angular.forEach(reports, function(report, rkey) {
                                    if(response.data[report] && options.joins[report] !== undefined)
                                    {
                                        angular.forEach(options.joins[report], function(joinVal, joinKey) {
                                            // init join result array
                                            if(options.joins[report][joinVal.name].results === undefined)
                                                options.joins[report][joinVal.name].results = {};
                                            // push item to items.0
                                            if(angular.isObject(response.data[report].data.item) && !angular.isObject(response.data[report].data.items))
                                                response.data[report].data.items = {"0":response.data[report].data.item}
                                            angular.forEach(response.data[report].data.items, function(values, key) {
                                                var instance = "join" + (Number(Object.keys(joinQuery).length) + 1);
                                                options.joins[report][joinVal.name].results[values[joinVal.field]] = instance;
                                                joinQuery[instance] = {
                                                    "service":joinVal.service,
                                                    "arguments": {
                                                        "filter": {}
                                                    }
                                                }
                                                joinQuery[instance].arguments.filter[joinVal.equals] = values[joinVal.field];
                                                if(joinVal.order)
                                                    joinQuery[instance].order = joinVal.order;
                                            });
                                        });
                                    }
                                });
                                $http
                                    .post(config.apiurl + url, joinQuery)
                                    .then(function(joinResponse) {
                                        result.resolve(dbHandler.parseResult(angular.merge(response.data, joinResponse.data)));
                                    })
                                    .catch(function(joinResponse) {
                                        $log.error(joinResponse);
                                    });
                            }else{
                                if (parse) {
                                    result.resolve(dbHandler.parseResult(response.data));
                                } else {
                                    result.resolve(response.data);
                                }
                            }
                        })
                        .catch(function(response)
                        {
                            if(response.status === 403)
                                $location.path('/user/logout');
                        })
                });
            }else{
                // query empty, blank resolve
                $log.log('query empty');
                result.resolve();
            }
            return result.promise;
        },
        reset: function() {
            reports = [];
            query = {};
            options = {};
            joins = {};
            
            url = "";
            
            parse = true;
            
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
                    case 'delete':
                        parsedResult[value] = result[value];
                    break;
                    
                    case 'create':
                    case 'update':
                        parsedResult[value] = result[value];
                    break;
                    
                    default:
                    case 'search':
                    case 'read':
                        if (result[value].status === 'success' && (result[value].data.foundCount > 0 || queryType === 'read'))
                        {
                            parsedResult[value] = {};
                            angular.forEach(result[value].data.items, function(row, key2)
                            {
                                if(options.joins !== undefined)
                                {
                                    if(options.joins[value] !== undefined)
                                    {
                                        angular.forEach(options.joins[value], function(joinVal, joinKey) {
                                            row[joinVal.name] = result[joinVal.results[row[joinVal.field]]].data.items;
                                        });
                                    }
                                }
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
            });
            
            dbHandler.reset();
            return parsedResult;
        }
    }

    return dbHandler;
}]);