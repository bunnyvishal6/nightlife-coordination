angular.module('nightlife', ['ui.router'])
    //config for ui routing
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider) {
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
    }])
    //Home controller
    .controller('HomeCtrl', ['$scope', '$http', '$window', function ($scope, $http, $window) {
        $scope.bars = [];
        //Try to get for savedSearch
        $http.get('/savedSearch')
            .success(function(data){
                if(data.bars){
                    $scope.bars = data.bars;
                    return $scope.location = data.savedSearch;
                } 
            })

        $scope.searchLocation = function () {
            $("#noBarsAvailable").css('display', 'none');
            $http.post('/search/' + $scope.location)
                .success(function (data) {
                    if (data.error) {
                        console.log(data);
                        $("#noBarsAvailable").css('display', 'block');
                    } else {
                        console.log(data);
                        $("#noBarsAvailable").css('display', 'none');
                        $scope.bars = data;
                    }
                })
                .error(function (err) {
                    console.log(err);
                    $("#noBarsAvailable").css('display', 'block');
                })
        };
        //To post that user is goingTo
        $scope.go = function (bar) {
            $http.post('/goingTo', bar)
                .success(function (data) {
                    if (data.jwt) {
                        console.log(data.jwt);
                    } else {
                        $window.location.href = '/auth/twitter';
                    }
                })
                .error(function (err) {
                    console.log(err, "error");
                    //If not logged in save the previous search
                    $http.post('/saveSearch', {saveSearch: $scope.location})
                        .success(function(msg){
                            $window.location.href = '/auth/twitter';
                        })
                        .error(function(err){
                            $window.location.href = '/auth/twitter';
                        })
                });
        }
    }]);