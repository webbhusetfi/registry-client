var regApp = angular.module('RegistryClient')
.factory('dbHandler', ['$http', '$log', '$location', 'globalParams', function($http, $log, $location, globalParams) {
    var config = function() {
        return {
            apiurl: "http://api.registry.huset.fi/",
            registry: Number(globalParams.get('user').registry)
        }
    }
    
    var reports = []
    var query = {};
    var options = {};
        
    var dbHandler = {
        getEntryTypes: function() {
            reports.push('entryTypes');
            query.entryTypes = {
                "service":"type/search",
                "arguments": {
                    "filter": {
                        "registry": config().registry
                    }
                }
            }
            
            return this;
        },
        getStatusTypes: function() {
            reports.push('statusTypes');
            query.statusTypes = {
                "service":"status/search",
                "arguments": {
                    "filter": {
                        "registry": config().registry
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
                        "registry": config().registry
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
                        "registry": config().registry
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
                        "registry": config().registry
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
                    "id": id
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
            
            return this;
        },
        reset: function() {
            query = {};
            
            return this;
        },
        runQuery: function() {
            var promise = $http
                .post(config().apiurl, query)
                .then(function(response)
                {
                    $log.log(response);
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
                                .post(config().apiurl, subQuery)
                                .then(function(SQResponse) {
                                    angular.forEach(SQResponse.data, function(value, key) {
                                        response.data[options.propertyTree + key] = value.data.items;
                                    });
                                    return dbHandler.parseResult(response.data);
                                })
                        }
                    }
                    return dbHandler.parseResult(response.data);
                })
                .catch(function(response)
                {
                    if(response.status === 403)
                        $location.path('/logout');
                })
            return promise;
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

                    default:
                    case 'search':
                        switch(service)
                        {
                            case 'type':
                            case 'status':
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
            return parsedResult;
        }
    }

    return dbHandler;
}]);