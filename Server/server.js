var sha = require("crypto-js/sha256");
var uuid = require("uuid/v1");
var db = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var compression = require("compression");
var path = require("path");
var bodyparser = require("body-parser");
var express = require('express');
var session = require('express-session');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//TODO: Clean this up to support modular design cause it's current year
//TODO: Integrate some session middlewear like passport.js --> http://passportjs.org/docs/username-password



// Database Side Variables/Definitions 
const DB_URL = "mongodb://" + process.env.IP + "/tunneldb";
mongoose.connect(DB_URL, { useMongoClient: true });
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

// User Table:  | email | password | salt | created_at | uuid |
var UserSchema = new Schema({
  email: String,
  password: String,
  salt: String,
  created_at: Date,
  uuid: String
});
var User = mongoose.model('User', UserSchema);

// Driver Table: DriverID | Name | UserID
var DriverSchema = new Schema({
  DriverID: String,
  Name: String,
  UserID: String
});
var Driver = mongoose.model('Driver', DriverSchema);




// Server Side Variables/Definitions
const port = process.env.PORT || 3000;
const CLIENT_ROOT = __dirname + "/Client/";
const DEBUG = true;
const TEST_USERID = "testuuid";
const TEST_USER = "testu";
const TEST_PASS = "wordpass";
const SESSION = {
  secret: "damnsosecuremdude",
  resave: false,
  saveUninitialized: true
  //cookie: { secure: true }
};

var ActiveSockets = []; // Shouldn't this be a hash map? n searching is a meme 
var ActiveClients = {};
var ActiveDrivers = {};
var SocketIDToOther = {};


// Object class defintions 
var ConversionObject = function(Id, Type) {
  var ToOtherObject = {
    Id: Id,
    Type: Type
  };
  return ToOtherObject;
};

var UserData = function(Username, UserId) {
  var UserData = {
    Username: Username,
    UserID: UserId
  };
  return UserData;
};

var Message = function(UserData, Tag, Data) {
  var MessageSample = {
    UserData: UserData,
    Tag: "Category/Action",
    Data: {}
  };
  return MessageSample;
}

var Device = function(Id, Name) {
  var DefaultDevice = {
    ID: Id,
    Name: Name
  };
  return DefaultDevice;
};




// Authentication section | Session management

// Check if a recieved request is from an authenticated user
function isUserValid(req, res, next) {
  if (req.session.uuid)
    return next();
  return res.status(403).json({
    'error': 'no access'
  });
}

// User Table:  | email | password | salt | uuid |
function signin(req, res) {
  if (!req.body.username || !req.body.password) return res.json({
    success: false
  });

  User.findOne({ email: req.body.username }, function(err, user) {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: (err && err.message ? err.message : 'Sorry, there was an issue signing you in, please try again.')
      });
    }

    if (sha(req.body.password + user.salt) == user.password) {
      req.session.uuid = user.uuid; // This is technically not secure, need middlewear
      return res.json({
        success: true,
      });
    }
    else {
      return res.status(401).json({
        success: false,
        message: (err && err.message ? err.message : 'Sorry, wrong credentials.')
      });
    }
  });
}


function signout(req, res) {
  req.session.uuid = null;
  return res.json({
    'success': true
  });
}

function register(req, res) {
  console.log(req.body.email + " wants to register!");
  User.findOne({ email: req.body.email }, function(err, user) {
    if (err || user)
      return res.status(401).json({
        success: false,
        message: (err && err.message ? err.message : 'Sorry, a user by that email exists.')
      });
    else {
      var salt = uuid().substr(0, 4);
      var newUser = new User({
        email: req.body.email,
        created_at: new Date(),
        uuid: uuid(),
        salt: salt,
        password: sha(req.body.password + salt)
      });
      newUser.save().then(function(udata) {
        return res.json({
          'success': true
        });
      });
    }
  });

}



// Page Generation Section
// Generate the dashboard page information by passing it a JSON cookie
function generateDash(req, res) {
  var ClientInfo = {
    Devices: [],
    UserInfo: {},
    Session: ""
  };

  var UserID = (DEBUG) ? TEST_USERID : req.query.user; // From Keystone.js
  getRegisteredDriverIDs(UserID, function(Devices) {
    // TESTING OVERIDE
    if (DEBUG && UserID == TEST_USERID) {
      var OnlyDevice = DefaultDevice;
      OnlyDevice.ID = "4206969";
      OnlyDevice.Name = "Dream Meme";
      ClientInfo.Devices.push(OnlyDevice);
      var OtherDevice = {};
      OtherDevice.ID = "69696420";
      OtherDevice.Name = "The Kid";
      ClientInfo.Devices.push(OtherDevice);
      ClientInfo.UserInfo = getUserInfo(UserID);
      ClientInfo.Session = "DEBUG";
    }
    else {
      //TODO: needs a bit of logic to convert each device into the final object format 
      ClientInfo.Devices = Devices;
      ClientInfo.UserInfo = getUserInfo(UserID); // Pretty sure it just needs userid
      ClientInfo.Session = "Keystone"; // Verification handled by keystone, this param is useless
    }

    res.cookie("socket_ip", "tunnel-lofus.c9users.io");
    res.cookie("client_info", JSON.stringify(ClientInfo));
    res.sendFile(path.resolve(CLIENT_ROOT + "Dash.html"));
  });
}

function generateLanding(req, res) {
  if (req.session.uuid)
    return generateDash(req, res);
  else
    return res.sendFile(path.resolve(CLIENT_ROOT + "index.html"));
}


// --- Server Bindings ---
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session(SESSION));
//app.use(compression());
app.use("/js", express.static(path.resolve(CLIENT_ROOT + "js")));
app.use("/css", express.static(path.resolve(CLIENT_ROOT + "css")));
app.use("/build", express.static(path.resolve(CLIENT_ROOT + "build")));
app.get("/", generateLanding);
app.all('/dash*', isUserValid);
app.get('/dash', generateDash);
app.post('/register', register);
app.post('/signin', signin);
app.all('/signout', signout);






// --- Actual Tunnel Logic ---


// TODO: THIS STEP. Driver will send an object -> Device.Name
// Looks at the db and gets a list of all the registered drivers
// Driver Table: DriverID | Name | UserID
function getRegisteredDriverIDs(UserID, callback) {
  if (DEBUG) {
    callback(null);
  }
  else {
    keystone.list("drivers").find()
      .where("userid", UserID)
      .exec(function(err, Drivers) {
        if (err)
          console.log(err);

        callback(Drivers);
      });
  }
}

// Pretty Useless right now
function getUserInfo(UserID) {
  var UserInfo = {
    UserID: UserID
  };
  return UserInfo;
}

// Follow the below todo, these may need to be integrated with the db
function makeActiveDriver(DriverID, SocketID) {
  ActiveDrivers[DriverID] = SocketID;
}

// Isn't this waay more code than needed? Why does the client have to be live? What's wrong with ajax?
function makeActiveClient(ClientID, SocketID) {
  ActiveClients[ClientID] = SocketID;
}

function makeActiveSocket(SocketID) {
  ActiveSockets[SocketID] = 1;
}

function makeSocketInactive(SocketID) { // I dont think this makes sense
  ActiveSockets.splice(SocketID, 1);
}

function checkActivity(SocketID) {
  if (SocketID in SocketIDToOther) {
    // This socket is just reconnecting
    var Info = SocketIDToOther[SocketID];
    if (Info.Type == "Driver") {
      if (Info.Id in ActiveDrivers)
        makeActiveDriver(Info.Id, SocketID);
      else if (Info.Id in ActiveClients)
        makeActiveClient(Info.id, SocketID);
    }
  }
  else {
    // It's a new socket so let's keep track
    makeActiveSocket(SocketID);
  }
}

//TODO: integrate this with the db to create sessions
// Again I dont know if that's needed
io.on('connection', function(socket) {
  // So this whole registration process thing should be gutted to integrate with a db

  // Something just connected, check if it has reconnected
  checkActivity(socket.id);

  // Register the new driver as active
  socket.on("DriverConnect", function(msg) {
    console.log("[" + msg.DriverID + "]: is an active driver" +
      " @" + socket.id);

    // Register thing as an active driver
    makeActiveDriver(msg.DriverID, socket.id);

    // Register the socket to the driver
    var ConversionObject = ToOtherObject;
    ConversionObject.Id = msg.DriverID;
    ConversionObject.Type = "Driver";
    SocketIDToOther[socket.id] = ConversionObject;
  });

  // Why is this even needed lmao? We just care about active drivers....
  // [Delay]Only useful for exit codes
  // Register the new client as active
  socket.on("ClientConnect", function(msg) {
    console.log("[" + msg.ClientID + "]: is an active client.");

    // Register thing as an active client
    makeActiveClient(msg.ClientID, socket.id);

    // Register the socket to the client
    var ConversionObject = ToOtherObject;
    ConversionObject.Id = msg.ClientID;
    ConversionObject.Type = "Client";
    SocketIDToOther[socket.id] = ConversionObject;
  });


  // Clients sending generic commands
  socket.on("Command", function(msg) {
    console.log("Command recieved: " + msg.Tag +
      " @" + (msg.DriverID || msg.ClientID) +
      " isActive: " + (ActiveDrivers[msg.DriverID] in ActiveSockets)) //idk when the driver would command lol

    // Pre-process the requested command

    // Check if client's driver is still connected
    if (ActiveDrivers[msg.DriverID] in ActiveSockets) {
      // Command the client's driver
      var DriverSocket = io.sockets.sockets[ActiveDrivers[msg.DriverID]];
      DriverSocket.emit("Command", msg);
    }

  });
});

// TODO: integrate this with the db to make sessions expire. Actually that doesnt seem needed?
io.on('disconnect', function(socket) {
  // Register things as being inactive
  makeSocketInactive(socket.id);

});

http.listen(port, function() {
  console.log('listening on *:' + port);
});
