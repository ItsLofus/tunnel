/*global angular*/
/*global jQuery*/
var lapp = angular.module('LandingApp', []);
lapp.controller("LandingController", function($scope, $http) {
    $scope.serverURI = "https://tunnel-lofus.c9users.io";
    $scope.isRegistration = false;

    $scope.TitleMessage = function(override) {
        if (override)
            return override;
        return this.isRegistration ? "Register" : "Login";
    };

    $scope.onLogin = function(user, pass) {
        var postData = {
            username: user || jQuery("#Username").val(),
            password: pass || jQuery("#Password").val()
        };

        $http.post(this.serverURI + "/signin", postData)
            .success(function(data) {
                if (data.success)
                    window.location.href = "https://tunnel-lofus.c9users.io/dash";
                else if (data.message)
                    $scope.TitleMessage(data.message);
                console.log(data);

            })
            .error(function(data) {
                if (data.message)
                    $scope.TitleMessage(data.message);
            });
    };

    $scope.onRegister = function() {
        if (this.isRegistration && jQuery("#Password").val() == jQuery("#Confirm").val()) {
            var postData = {
                email: jQuery("#Username").val(),
                password: jQuery("#Password").val()
            };

            $http.post(this.serverURI + "/register", postData)
                .success(function(data) {
                    if (data.success)
                        $scope.onLogin(postData.email, postData.password);
                    else if (data.message)
                        $scope.TitleMessage(data.message);

                })
                .error(function(data) {
                    if (data.message)
                        $scope.TitleMessage(data.message);
                });

        }

        this.isRegistration = true;
    };
});
