module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'node_modules/angular/angular.min.js',
                    'node_modules/angular-route/angular-route.min.js',
                    'node_modules/angular-resource/angular-resource.min.js',
                    'node_modules/angular-sanitize/angular-sanitize.min.js',
                    'node_modules/angular-chart.js/node_modules/chart.js/Chart.min.js',
                    'node_modules/angular-chart.js/dist/angular-chart.min.js',
                    'node_modules/ng-csv/build/ng-csv.min.js',
                    'node_modules/angular-ui-bootstrap/ui-bootstrap.min.js',
                    'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.min.js',
                    'node_modules/angular-xeditable/dist/js/xeditable.min.js',
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
                    'js/directive/directives.js',
                    'js/controller/topbar.js',
                    'js/controller/statView.js',
                    'js/controller/registryList.js',
                    'js/controller/registryEdit.js',
                    'js/controller/entryList.js',
                    'js/controller/entryEdit.js',
                    'js/controller/propertyList.js',
                    'js/controller/userEdit.js',
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
                        'dist.js':'dist.js',
                        'style.css':'css/style.css'
                    }],
                    replacement: 'md5'
                },
                files: {
                    src:['index.html']
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-cache-breaker');
    grunt.registerTask('dev', ['uglify','concat','processhtml:dev']);
    grunt.registerTask('default', ['uglify','concat','processhtml:dist','cachebreaker']);
};