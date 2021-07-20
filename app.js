require('dotenv').config();

//express
const express = require('express')
const app = express()
const port = 3000

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

//mongoose
const mongoose = require('mongoose');
const { StringDecoder } = require('string_decoder');
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

//user schema
const userSchema = new mongoose.Schema({
    email: String, 
    password: String
});

const bcrypt = require('bcryptjs');
const saltRounds = 10;

//md5 hashing
//const md5 = require('md5');

//mongoose-encryption
// const encrypt = require('mongoose-encryption');
// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

//user model
const User = new mongoose.model("User", userSchema);

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});
  
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err) {
            if(!err) {
                res.render('secrets');
            }
            else {
                console.err(err);
            }
        });
    });
});

app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    
    bcrypt
    User.findOne({email: username}, function(err, foundUser) {
        if(!err) {
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true) {
                        res.render('secrets');
                    }
                });
            }
        }
        else {
            console.error(err);
        }
    });
});

//This app starts a server and listens on 'port' for connections
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`)
})