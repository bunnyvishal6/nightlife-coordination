angular.module('nightlife', ['ngRoute'])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    }])
    .factory('authToken', ['$window', function ($window) {
        var storage = $window.localStorage;
        var cachedToken;
        var authToken = {
            setToken: function (token) {
                cachedToken = token;
                storage.setItem('userToken', token);
            },
            getToken: function () {
                if (!cachedToken) {
                    cachedToken = storage.getItem('userToken');
                }
                return cachedToken;
            },
            isAuthenticated: function () {
                return !!authToken.getToken();
            },
            removeToken: function () {
                cachedToken = null;
                storage.removeItem('userToken');
            }
        }
        return authToken;
    }])
    /**Auth interceptor to push auth token to header or every request made to api */
    .factory('authInterceptor', ['authToken', function (authToken) {
        return {
            request: function (req) {
                var token = authToken.getToken();
                if (token) {
                    req.headers.Authorization = token;
                }
                return req;
            },
            response: function (response) {
                return response
            }
        }
    }])
    //Home controller
    .controller('HomeCtrl', ['$scope', '$http', 'authToken', '$window', function ($scope, $http, authToken, $window) {
        //$scope.bars init
        $scope.bars = [];
        //Check if savedSearch exists if so display loading icon
        $http.get('/checkForSavedSearch')
            .success(function (data) {
                if (data.msg == "yes") {
                    $("#refreshIcon").css('display', 'block');
                }
                if (data.jwt) {
                    //Store authToken in localStorage
                    authToken.setToken(data.jwt);
                }
            });
        //get bar's going
        var getGoing = function (obj) {
            $http.post('/getGoing', { identifier: obj.identifier })
                .success(function (data) {
                    if (data.msg == "someoneGoing") {
                        obj.going = data.going;
                        return obj.going.length;
                    } else {
                        obj.going = [];
                        return obj.going.length;
                    }
                })
                .error(function (err) {
                    console.log(err);
                    obj.going = [];
                    return obj.going.length;
                })
        };
        //Try to get for savedSearch
        $http.get('/savedSearch')
            .success(function (data) {
                if (data.bars) {
                    $("#refreshIcon").css('display', 'none');
                    data.bars.forEach(function(bar){
                            getGoing(bar);
                            $scope.bars.push(bar);
                        });
                    return $scope.location = data.savedSearch;
                }
            });
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
                        data.forEach(function(bar){
                            getGoing(bar);
                            $scope.bars.push(bar);
                        });
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
            $http.post('/goingTo', { bar: bar })
                .success(function (msg) {
                    if (msg == "going") {
                        bar.going.push('a');
                    } else if (msg == "not-going") {
                        bar.going.splice(0, 1);
                    } else {
                        authToken.removeToken();
                        $window.location.href = '/auth/twitter';
                    }
                })
                .error(function (err) {
                    console.log(err, "error");
                    //If not logged in save the previous search
                    $http.post('/saveSearch', { saveSearch: $scope.location })
                        .success(function (msg) {
                            authToken.removeToken();
                            $window.location.href = '/auth/twitter';
                        })
                        .error(function (err) {
                            authToken.removeToken();
                            $window.location.href = '/auth/twitter';
                        })
                });
        }
    }])

    .directive('bars', function () {
        return {
            restrict: 'E',
            templateUrl: '/public/templates/bars.html'
        };
    });