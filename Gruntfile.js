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