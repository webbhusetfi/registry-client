module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                    'node_modules/angular/angular.js',
                    'node_modules/angular-route/angular-route.js',
                    'node_modules/angular-resource/angular-resource.js',
                    'node_modules/angular-sanitize/angular-sanitize.js',
                    'node_modules/angular-chart.js/node_modules/chart.js/Chart.js',
                    'node_modules/angular-chart.js/angular-chart.js',
                    'node_modules/ng-csv/build/ng-csv.js',
                    'node_modules/angular-ui-bootstrap/ui-bootstrap.js',
                    'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js',
                    'node_modules/angular-xeditable/dist/js/xeditable.js',
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
                    'js/db.js',
                    'js/dialog.js',
                    'js/directives.js',
                    'stat_mod/stat.js'                    
                ],
                dest:'dist.min.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify','concat']);
};