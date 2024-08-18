// LOAD LIBS
require('dotenv').config();
const express = require("express");

// ROUTES
const AuthRoute      = require("./src/routes/AuthRoute");
const UserLevelRoute = require("./src/routes/UserLevelRoute");
const UserRoute      = require("./src/routes/UserRoute");
const WaNumberRoute  = require("./src/routes/WaNumberRoute");

// LOAD CONFIGS
const port = process.env.NODE_PORT || 4000;

// EXPRESS - SETUP
const app = express();
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// EXPRESS - ROUTE DEFINE
app.get('/', (req,res) => {res.status(200).json({message:"FOURTHMACE IS HERE"})});
app.use(AuthRoute);
app.use(UserLevelRoute);
app.use(UserRoute);
app.use(WaNumberRoute);

// EXPRESS - LISTEN PORT
app.listen(port,() => {
    console.log(`app listen at port:${port}`);
})

module.exports = app;