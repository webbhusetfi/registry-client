var regApp = angular.module('RegistryClient')
.factory('dbHandler', ['$http', '$log', 'globalParams', function($http, $log, globalParams) {
    var config = function() {
        return {
            apiurl: "http://api.registry.huset.fi/",
            registry: Number(globalParams.get('user').registry)
        }
    }
    
    var reports = []
    var query = {};
        
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
        getOrganizations: function() {
            reports.push('organizations');
            query.organizations = {
                "service":"entry/search",
                "arguments":{
                    "filter": {
                        "registry": config().registry,
                        "class":"ORGANIZATION",
                        "type":[3,1]
                    },
                    "order": {
                        "name":"asc"
                    }
                }
            }
            
            return this;
        },
        getFullEntry: function(id) {
            reports.push('fullEntry');
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
        },
        runQuery: function() {
            var promise = $http
                .post(config().apiurl, query)
                .then(function(response)
                {
                    return dbHandler.parseResult(response.data);
                })
                .catch(function(response)
                {
                    return response;
                })
            return promise;
        },
        parseResult: function(result) {
            var parsedResult = {};
            angular.forEach(reports, function(value, key) {
                var service = query[value].service.split('/')[0];
                var queryType = query[value].service.split('/')[1];
                
                if(queryType == 'search' || queryType == 'read')
                {
                    switch(queryType)
                    {
                        case 'read':
                            switch(value)
                            {
                                case 'fullEntry':
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
                                    }else{
                                        parsedResult.entry = false;
                                    }
                                break;
                            }
                        break;

                        default:
                        case 'search':
                            switch(value)
                            {
                                case 'entryTypes':
                                case 'statusTypes':
                                case 'connectionType':
                                    if(result[value].status == 'success' && result[value].data.foundCount > 0)
                                    {
                                        parsedResult[value] = {}
                                        angular.forEach(result[value].data.items, function(row, key2) {
                                            parsedResult[value][row.id] = row;
                                        });
                                    }
                                break;
                                
                                default:
                                    if(result[value].status == 'success' && result[value].data.foundCount > 0)
                                    {
                                        parsedResult[value] = result[value].data.items;
                                    }
                                break;
                            }
                        break;
                    }
                }
            });
            return parsedResult;
        }
    }

    return dbHandler;
}]);