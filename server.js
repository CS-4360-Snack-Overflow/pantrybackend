/**
 * This is the main file for the Recipe App. It sets up the application, initializes the main components, and starts the server.
 *
 * Dependencies:
 * - Express.js: A web application framework for Node.js
 * - Mongoose: A MongoDB object modeling tool
 * - Morgan: A HTTP request logger middleware for Node.js
 * - Dotenv: A zero-dependency module that loads environment variables from a .env file into process.env
 * - Express-Session: Manages user sessions and requires a session store to persist the session data between requests.
 * - Connect-Mongo: Popular session store for express-session.
 * 
 * Environment Variables:
 * - PORT: The port number on which the server will listen for incoming requests 
 * - MONGODB_URI: The URI of the MongoDB database used by the application
 *
 * File Structure:
 * - The `routes` directory contains all the route definitions for the application
 *
 * Usage:
 * - To start the application, run `npm start` or 'nodemon app' in the command line
 */

// Importing dependencies
require('dotenv').config();
const express = require('express');
const testRoutes = require('./routes/testroutes');
const recipeRoutes = require('./routes/recipeRoutes');
const userRoutes = require('./routes/userRoutes');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors=require("cors");
const corsOptions ={
   origin:'https://pantrydev.netlify.app', 
   credentials:true,       //access-control-allow-credentials:true
   optionSuccessStatus:200
}

// Express app instance
const app = express();

// Connect to db using environment variables
mongoose.connect(process.env.MONGO_URI, { 
	useNewUrlParser: true, 
	useUnifiedTopology: true
})
.then((result) => {app.listen(process.env.PORT)})
.catch( (err) => {console.log(err)});

// Setting up middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true}));
app.use(express.json())
app.use(cors(corsOptions))

// Setting up a session store instance
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  ttl: 10 * 60, //session will expire in 10 minutes
});

// Setting up session middleware and linking it to the session store
app.use(session({
  secret: 'my-secret',
  resave: false,
  proxy : true,
  cookie: {
    secure:  true, // sets the Secure attribute
    sameSite: 'none', // sets the SameSite attribute
    httpOnly: true
  },
  saveUninitialized: false,
  store: store,
}));

app.set('trust proxy', 1)

// Get homepage
app.get('/', (req,res) => {
	res.sendFile('./index.html', { root: __dirname });
});

// check if the userId property exist in the req.session object
app.get('/login', (req, res) => {
  if (!req.session.userId){ // if user is already logged in, redirect to '/'
    res.sendFile('./login.html', { root: __dirname } );
  } else {
    res.redirect('/');
  }
});

app.get('/signup', (req, res) => {
  res.sendFile('./signup.html', { root: __dirname } );
  });

//this is here because any route that uses sendFile doesn't work unless it is in a file that is in root directory
app.get('/getProPic', (req, res) => {
  res.sendFile('./sample1.png', { root: __dirname});
});

app.use('/test/', testRoutes);
app.use('/recipes', recipeRoutes);
app.use('/user', userRoutes);