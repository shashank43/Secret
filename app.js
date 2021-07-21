require('dotenv').config();

//express
const express = require('express')
const app = express()
const port = 3000

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

// const bcrypt = require('bcryptjs');
// const saltRounds = 10;

//md5 hashing
//const md5 = require('md5');

//mongoose-encryption
// const encrypt = require('mongoose-encryption');
// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

//user model
const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
  res.render('home');
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

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save(function(err) {
    //         if(!err) {
    //             res.render('secrets');
    //         }
    //         else {
    //             console.err(err);
    //         }
    //     });
    // });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {

    res.redirect('secrets');

    // const user = new User({
    //     username: req.body.username,
    //     password: req.body.password
    // });
    // req.login(user, function(err) {
    //     if(!err) {
    //         passport.authenticate('local')(req, res, function(){
    //             res.redirect('/secrets');
    //         })
    //     }
    //     else {
    //         console.error(err);
    //     }
    // });

    // const username = req.body.username;
    // const password = req.body.password;
    
    // bcrypt
    // User.findOne({email: username}, function(err, foundUser) {
    //     if(!err) {
    //         if(foundUser) {
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if(result === true) {
    //                     res.render('secrets');
    //                 }
    //             });
    //         }
    //     }
    //     else {
    //         console.error(err);
    //     }
    // });
});

//This app starts a server and listens on 'port' for connections
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})