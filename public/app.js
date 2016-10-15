angular.module('nightlife', ['ui.router'])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/public/templates/home.html',
                controller: 'HomeCtrl'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'public/templates/login.html',
                controller: 'LoginCtrl'
            })
            .state('logout', {
                url: '/logout',
                template: '<h3>Loggin out</h3>',
                controller: 'LogoutCtrl'
            });
    }])

    .controller('HomeCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.searchLocation = function () {
            $("#noBarsAvailable").css('display', 'none');
            $scope.bars = [];
            $http.post('/search/' + $scope.location)
                .success(function (data) {
                    if (data.error) {
                        $("#noBarsAvailable").css('display', 'block');
                    } else {
                        console.log(data);
                        $("#noBarsAvailable").css('display', 'none');
                        $scope.bars = data;
                    }
                })
                .error(function (err) {
                    $("#noBarsAvailable").css('display', 'block');
                })
        }
    }]);