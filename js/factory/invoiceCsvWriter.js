angular.module('RegistryClient')
.factory('invoiceCsvWriter', ['$log', '$filter', 'globalParams', 'dbHandler', 'FileSaver', 'loadOverlay', 'CSV', function($log, $filter, globalParams, dbHandler, FileSaver, loadOverlay, CSV) {

    var invoiceCsvWriter = {
        run: function(outQry) {
        
            var outquery = {};
            outquery.entryinvoice = outQry;
            
            dbHandler
                .parse(false)
                .setQuery(outquery)
                .runQuery()
                .then(function(response) {
                    //console.log(JSON.stringify(response));
                    // entryInvoice/search tar emot "include": ["entry", "primaryAddress"]
                    var csv_options = {};
                    csv_options.header = ['Ref.nr.', 'Betalat', 'Fakturamall ID', 'ID', 'Typ', 'Namn', 'Gatuadress', 'Postnummer', 'Postanstalt', 'Land'];
                    csv_options.quoteStrings = "true";
                    csv_options.txtDelim = '"';

                    var ret = [];                                                            
                    angular.forEach(response.entryinvoice.data.items, function (value, key) {
                        var row = {};
                        row.a = value.id;
                        row.b = ((value.paid) ? 'Ja' : 'Nej');
                        row.c = value.invoice;
                        row.d = value.entry.id;
                        row.e = globalParams.static.types[value.entry.type];
                        if (value.entry.type == 'MEMBER_PERSON') {
                            row.f = value.entry.firstName + ' ' + value.entry.lastName;
                        } else {
                            row.f = value.entry.name;
                        }
                        row.g = ((value.entry.primaryAddress) ? value.entry.primaryAddress.street : null);
                        row.h = ((value.entry.primaryAddress) ? value.entry.primaryAddress.postalCode : null);
                        row.i = ((value.entry.primaryAddress) ? value.entry.primaryAddress.town : null);
                        row.j = ((value.entry.primaryAddress) ? value.entry.primaryAddress.country : null);
                        ret.push(row);
                    });  
                    
                    CSV.stringify(ret, csv_options).then(function(result){
                        //console.log(result);
                        
                        now = new Date();
                        // globalParams.static.types[scope.config.query.arguments.filter.type] + 
                        fn = 'fakturor_' + now.getDate() + '.' + (now.getMonth()+1) + '.' + now.getFullYear() + '.csv';
                        var blob = new Blob([result], {type : 'text/csv'});
                        FileSaver.saveAs(blob, fn);
                    }); 
                })
                .catch(function(response) {
                    $log.error(response);
                });
        }
    }

    return invoiceCsvWriter;
                
}]);