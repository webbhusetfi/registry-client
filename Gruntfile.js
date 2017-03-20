module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'node_modules/lodash/lodash.min.js',
                    'node_modules/angular/angular.min.js',
                    'node_modules/angular-route/angular-route.min.js',
                    'node_modules/angular-resource/angular-resource.min.js',
                    'node_modules/angular-sanitize/angular-sanitize.min.js',
                    'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
                    'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
                    'node_modules/angular-chart.js/node_modules/chart.js/dist/Chart.min.js',
                    'node_modules/angular-chart.js/dist/angular-chart.min.js',
                    'node_modules/ng-csv/build/ng-csv.min.js',
                    'node_modules/angular-xeditable/dist/js/xeditable.min.js',
                    'node_modules/ng-pdfkit/build/ng-pdfkit.js', 
                    'node_modules/angular-file-saver/dist/angular-file-saver.bundle.min.js',
                    'dist.min.js'
                ],
                dest: 'dist.js'
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            dist: {
                src: [
                    'main.js',
                    'js/factory/db.js',
                    'js/factory/dialog.js',
                    'js/factory/globalParams.js',
                    'js/factory/loadOverlay.js',
                    'js/factory/invoiceWriters.js',
                    'js/factory/translation.js',
                    'js/directive/directives.js',
                    'js/directive/exportDirectives.js',
                    'js/directive/list.js',
                    'js/directive/pagination.js',
                    'js/directive/listCount.js',
                    'js/directive/limiter.js',
                    'js/directive/propertyControl.js',
                    'js/controller/pageController.js',
                    'js/controller/navigation.js',
                    'js/controller/statView.js',
                    'js/controller/registryList.js',
                    'js/controller/registryEdit.js',
                    'js/controller/invoiceList.js',
                    'js/controller/invoiceLedger.js',
                    'js/controller/invoiceEdit.js',
                    'js/controller/mailingList.js',
                    'js/controller/mailingView.js',
                    'js/controller/entryList.js',
                    'js/controller/entryEdit.js',
                    'js/controller/propertyList.js',
                    'js/controller/userEdit.js',
                    'js/controller/userList.js',
                    'js/controller/userLogin.js',
                    'js/controller/userLogout.js'
                ],
                dest:'dist.min.js'
            }
        },
        processhtml: {
            dist: {
                options: {
                    "process":true,
                    "strip":true
                },
                files: {
                    'index.html':['index.tpl.html']
                }
            },
            dev: {
                options: {
                    "process":true,
                    "strip":true
                },
                files: {
                    'index.html':['index.tpl.html']
                }
            }
        },
        cachebreaker: {
            dist: {
                options: {
                    match:[{
                        'dist.min.js':'dist.min.js',
                        'style.css':'style.css',
                        'template/registryList.html':'template/registryList.html',
                        'template/registryEdit.html':'template/registryEdit.html',
                        'template/invoiceList.html':'template/invoiceList.html',
                        'template/invoiceLedger.html':'template/invoiceLedger.html',
                        'template/mailingList.html':'template/mailingList.html',
                        'template/mailingView.html':'template/mailingView.html',
                        'template/invoiceEdit.html':'template/invoiceEdit.html',
                        'template/invoiceView.html':'template/invoiceView.html',
                        'template/invoiceEdit.html':'template/invoiceEdit.html',
                        'template/statView.html':'template/statView.html',
                        'template/entryList.html':'template/entryList.html',
                        'template/entryEdit.html':'template/entryEdit.html',
                        'template/propertyList.html':'template/propertyList.html',
                        'template/userList.html':'template/userList.html',
                        'template/userEdit.html':'template/userEdit.html',
                        'template/userLogin.html':'template/userLogin.html'
                    }],
                    replacement: 'md5'
                },
                files: {
                    src:[
                        'index.html',
                        'dist.min.js'
                    ]
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-cache-breaker');
    grunt.registerTask('dev', ['uglify','concat','processhtml:dev']);
    grunt.registerTask('default', ['uglify','processhtml:dist','cachebreaker','concat']);
};