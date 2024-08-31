// LOAD LIBS
require("dotenv").config();
const http = require("http");
const express = require("express");
const { setupSocket } = require("./src/pkg/socket/socket");

// CRON
require("./src/services/CronService");

// ROUTES
const HtmlRoute = require("./src/routes/HtmlRoute");
const AuthRoute = require("./src/routes/AuthRoute");
const UserLevelRoute = require("./src/routes/UserLevelRoute");
const UserRoute = require("./src/routes/UserRoute");
const WaNumberRoute = require("./src/routes/WaNumberRoute");
const WaCampaignRoute = require("./src/routes/WaCampaignRoute");
const WaInstanceRoute = require("./src/routes/WaInstanceRoute");

// LOAD CONFIGS
const port = process.env.NODE_PORT || 4000;

// EXPRESS - SETUP
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EXPRESS - ROUTE DEFINE
app.get("/", (req, res) => {
  res.status(200).json({ message: "FOURTHMACE IS HERE" });
});
app.use(HtmlRoute);
app.use(AuthRoute);
app.use(UserLevelRoute);
app.use(UserRoute);
app.use(WaNumberRoute);
app.use(WaCampaignRoute);
app.use(WaInstanceRoute);

// SOCKET.IO - SETUP
const server = http.createServer(app);
setupSocket(server);

// EXPRESS - LISTEN PORT
server.listen(port, () => {
  console.log(`App listening at port:${port}`);
});

module.exports = app;
