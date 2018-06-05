const socketip = "tunnel-lofus.c9users.io";
const DEBUG = true;
var io = require('socket.io-client');
var me = {};

console.log("Initing...");

var RefreshConnection =  function () {
    var socket = io.connect(socketip);
    socket.on("connect", function() {
        console.log("Connected to server");
    
        socket.on("Command", function(msg) {
            console.log("Command recieved: " + msg.Tag +
            " @" + (msg.DriverID || msg.ClientID));
        });

        socket.on("disconnect", function () {
            console.log("Disconnected from server.");
            socket.close();
            RefreshConnection();
        });
    
        // If name isn't registered on the db add it
        socket.emit("DriverConnect", me);
    });
}

var init = function (callback) {
    // Gather driver information
    if (DEBUG) 
        me = {
            Name : "Vapor",
            DriverID : "4206969"
        };

    console.log("Starting tunnel as: " + me.DriverID);
    callback();
}(RefreshConnection);



// TODO: Add login to server (up server security?)
// TODO: Add register new device for user flow 