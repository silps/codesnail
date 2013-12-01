#!/bin/env node

/* Add modules */
var express = require('express'),
	expressValidator = require('express-validator'),
	app = express(),
	jade = require('jade'),
	flash = require('connect-flash'),
	passport = require('passport'),
	auth = require("./config/authentication"),
	db = require("./config/database"),
	config = require("./config/config"),
	email = require("./config/email"),
	routes = require('./routes'),
	user = require('./routes/user');

/* Set app properties */
app.set('title', "CodeBuddy");
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: "super-secret-u-will-never-guess" }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

app.get("/login", user.login);
app.all("/register", user.register);
app.get("/register/:id", user.verify);

app.post("/login", passport.authenticate("local", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.google.auth, passport.authenticate("google", { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate("google", { successRedirect: "/profile" failureRedirect: "/login", failureFlash: true }));

app.get(config.twitter.auth, passport.authenticate("twitter"));
app.get(config.twitter.callback, passport.authenticate("twitter", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

/* Facebook Oauth2 bug appends #_=_ to the callback URL */
app.get(config.facebook.auth, passport.authenticate("facebook", { scope: ['email'] }));
app.get(config.facebook.callback, passport.authenticate("facebook", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get("/logout", user.logout);

/* Homepage */
app.get("/", auth.ensureAuthenticated, routes.index);

/* Profile page */
app.get("/profile", auth.ensureAuthenticated, user.profile);
app.post("/profile/update", auth.ensureAuthenticated, user.profileUpdate);
app.get("/profile/remove/:name", auth.ensureAuthenticated, user.providerRemove);

/* Delete all the users and providers */
if (false) {
	db.User.remove(function (err, removed) {
	  if (err) console.log("ERROR", "deleting all users:", err);
	  else console.log("INFO", "successfully removed all users");
	});
	db.Provider.remove(function (err, removed) {
	  if (err) console.log("ERROR", "deleting all providers:", err);
	  else console.log("INFO", "successfully removed all providers");
	});
}

/* Show all the users and providers */
db.User.find(function (err, users) {
  if (err) console.log("ERROR", "fetching all users:", err);
  else users.forEach(function(user) {
  	console.log("INFO", "user info:", user);
  });
});
db.Provider.find(function (err, providers) {
  if (err) console.log("ERROR", "fetching all providers:", err);
  else providers.forEach(function(provider) {
  	console.log("INFO", "provider info:", provider);
  });
});

/* Start the app */
app.listen(config.port, config.host);
console.log("INFO", "listening on port:", config.port);