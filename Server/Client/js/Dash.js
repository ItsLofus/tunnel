/* Global debug definitions:
global $
global socket
*/


/* Contains all the code to make the client's functionality */
var socket;

// if the login is successful cant the server side populate this info when it passes the document?
// No - We need a requrest anyways so this can be updated while the window is still open.
// Unrelated but, live updating of each device add, might be extra overhead that we don't need.
var ClientInfo = {
    ClientID: "69420", // Make this a random guid
    Devices: [],
    UserInfo: {
        UserID: "" // This is passed in the url so could be populated early but whatever
    },
    Session: ""
};

var DefaultMessage = {
    ClientID: ClientInfo.ClientID,
    UserID: "xxx",
    DeviveID: "xxx",
    Session: "xxx",
    Tag: "Command", // <-- not needed as you can just request that page 
    Data: {}
};

var DefaultDevice = {
    ID: "",
    Name: ""
};


var io;

const getCookie = function(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
};

const deleteCookie = function(name) {
    document.cookie = name + '=; max-age=0;';
};

const parseObjectFromCookie = function(cookie) {
    const decodedCookie = decodeURIComponent(cookie);
    return JSON.parse(decodedCookie);
};



function getDevices(callback) {
    // Some ajax request called on refresh
    // Pulls the cookie back down from the server
}

// Gets the id of the currently selected device in the dropdown
function getActiveDeviceID() {
    return $("#DeviceList").find(":selected").val();
}


//TODO: make this obsolete by integrating angular properly
function populateDevices(callback) {
    // Clear and Append device to the dropdown
    $("#DeviceList").empty();

    ClientInfo.Devices.forEach(function(Device, i) {
        $("#DeviceList").append("<li value=" + Device.ID + "><a>" + Device.Name + "</a></li>");

        // Pretty sure foreach is sync so this is kinda useless...
        if (i == ClientInfo.Devices - 1 && typeof callback != "undefined")
            callback();
    });
}

function Shutdown(callback) {
    var msg = DefaultMessage
    msg.UserID = ClientInfo.UserInfo.UserID;
    msg.DeviveID = getActiveDeviceID();
    msg.Session = "Keystone"; // Again, really not needed.
    msg.Tag = "Shutdown";
    socket.emit("Command", msg); // Again why isn't this an ajax request?
    // Currently a user could just force load the page and then connect to the socket.
    // ----Not anymore cause the ip is loaded through a cookie
    // If it was an ajax request, every post would need a valid session on the backend to be executed.
    // So for now this emit is going back through to the server for verification. Probably slow to do that.
    // ----These security concerns arent too real as you can basically only force yourself.
}


/*$(function() {
    // First things first, populate the angular info
    ClientInfo = parseObjectFromCookie(getCookie("client_info"));
    //populateDevices();

    // Connect to the server
    console.log(getCookie("socket_ip"));
    socket = io.connect("https://" + getCookie("socket_ip"));

    // Send the shutdown command
    $("#ShutdownBtn").click(Shutdown);
});*/
