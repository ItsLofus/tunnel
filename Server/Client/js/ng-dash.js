/*global angular*/
/*global jQuery*/
var dapp = angular.module('DashApp', []);
dapp.controller("DashController", function($scope, $http) {
    var _private = {};
    _private.getCookie = function(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    };
    _private.parseObjectFromCookie = function(cookie) {
        const decodedCookie = decodeURIComponent(cookie);
        return JSON.parse(decodedCookie);
    };
    _private.deviceOption = {
        name: "",
        id: ""
    };
    _private.socket = io.connect("https://" + _private.getCookie("socket_ip"));
    //_private.socket = "depreciated";

    $scope.areDevicesVisible = false;

    $scope.ToggleDevices = function(cb) {
        var toggled = false;
        if (!$scope.areDevicesVisible) {
            $scope.areDevicesVisible = true;
            toggled = true;
        }
        jQuery(".DeviceOptions").slideToggle("fast", function() {
            if (!toggled && $scope.areDevicesVisible)
                $scope.areDevicesVisible = false;

            if (cb)
                cb();
        });
    };

    $scope.init = function() {
        $scope.serverURI = "https://tunnel-lofus.c9users.io";
        $scope.isRegistration = false;
        $scope.ClientInfo = _private.parseObjectFromCookie(_private.getCookie("client_info"));
        $scope.DeviceOptions = $scope.ClientInfo.Devices;
        $scope.currentDeviceIndex = 0;
        $scope.selectedDevice = $scope.DeviceOptions[$scope.currentDeviceIndex];

        // LMAOOO janky js
        $scope.ToggleDevices();
    };

    $scope.SelectDevice = function(index) {
        $scope.currentDeviceIndex = index;
        $scope.selectedDevice = $scope.DeviceOptions[$scope.currentDeviceIndex];
        $scope.ToggleDevices();
    };

    $scope.ShutdownCommand = function() {
        var DefaultMessage = {
            ClientID: $scope.ClientInfo.ClientID,
            UserID: "xxx",
            DeviveID: "xxx",
            Session: "xxx",
            Tag: "Command", // <-- not needed as you can just request that page 
            Data: {}
        };
        var msg = DefaultMessage
        msg.UserID = $scope.ClientInfo.UserInfo.UserID;
        msg.DriverID = $scope.selectedDevice.ID;
        msg.Session = "Keystone"; // Again, really not needed.
        msg.Tag = "Shutdown";
        _private.socket.emit("Command", msg); // Again why isn't this an ajax request?
        // Currently a user could just force load the page and then connect to the socket.
        // ----Not anymore cause the ip is loaded through a cookie
        // If it was an ajax request, every post would need a valid session on the backend to be executed.
        // So for now this emit is going back through to the server for verification. Probably slow to do that.
        // ----These security concerns arent too real as you can basically only force yourself.

    };


});
