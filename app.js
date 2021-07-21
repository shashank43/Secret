require('dotenv').config();

//express
const express = require('express')
const app = express()
const port = 3000

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate')

//parses incoming requests with urlencoded payloads
//and is based on body-parser
app.use(express.urlencoded({ extended: true }));    // to support URL-encoded bodies
app.use(express.json());    // to support JSON-encoded bodies

//ejs
const ejs = require('ejs');

//template engine enables the use of
//static template files in the application.
app.set('view engine', 'ejs');

//Serving static files in Express
app.use(express.static('public'));

app.use(session({
    secret: "ThisIsOurLittleSecret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//mongoose
const mongoose = require('mongoose');
const { StringDecoder } = require('string_decoder');
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

//user schema
const userSchema = new mongoose.Schema({
    email: String, 
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//user model
const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
}));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    res.render('login');
});
  
app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/secrets', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('secrets');
    }
    else {
        res.redirect('/login');
    }
})

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/register', function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(!err) {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            })
        }
        else {
            console.error(err);
            res.redirect('/register')
        }
    })
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('secrets');
});

//This app starts a server and listens on 'port' for connections
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})