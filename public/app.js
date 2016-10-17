angular.module('nightlife', ['ngRoute'])
    
    //Home controller
    .controller('HomeCtrl', ['$scope', '$http', '$window', function ($scope, $http, $window) {
        //$scope.bars init
        $scope.bars = [];
        //Check if savedSearch exists if so display loading icon
        $http.get('/checkForSavedSearch')
            .success(function(msg){
                if(msg == "yes"){
                   return $("#refreshIcon").css('display', 'block');
                }
            });
        //Try to get for savedSearch
        $http.get('/savedSearch')
            .success(function(data){
                if(data.bars){
                    $("#refreshIcon").css('display', 'none');
                    $scope.bars = data.bars;
                    return $scope.location = data.savedSearch;
                } 
            })
        //get bars
        $scope.getBars = function () {
            $scope.bars = [];
            $("#noBarsAvailable").css('display', 'none');
            $('#refreshIcon').css('display', 'block');
            $http.post('/search/' + $scope.location)
                .success(function (data) {
                    if (data.error) {
                        $('#refreshIcon').css('display', 'none');
                        $("#noBarsAvailable").css('display', 'block');
                    } else {
                        $('#refreshIcon').css('display', 'none');
                        $("#noBarsAvailable").css('display', 'none');
                        $scope.bars = data;
                    }
                })
                .error(function (err) {
                    console.log(err);
                    $('#refreshIcon').css('display', 'none');
                    $("#noBarsAvailable").css('display', 'block');
                })
        };
        //To post that user is goingTo
        $scope.go = function (bar) {
            $http.post('/goingTo', bar)
                .success(function (data) {
                    if (data.jwt) {
                        console.log(data);
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
    }])
    
    .directive('bars', function(){
        return {
            restrict: 'E',
            templateUrl: '/public/templates/bars.html'
        };
    });