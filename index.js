const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');
const fs = require('fs');
const path = require('path');
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/movie-db', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('combined', {stream: accessLogStream}));
app.use(express.static('public'));

app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

app.get('/', (req,res) => {
    res.status(200).send('Welcome to my app!');
});

app.get('/movies', (req,res) => {

});

app.get('/movies/favorites', (req,res) => {

});

app.get('/movies/:title', (req,res) => {

});

app.get('/genres/:name', (req,res) => {

});

app.get('/directors/:name', (req,res) => {

});

app.get('/user/login', (req,res) => {
    
});

app.put('/user/update', (req,res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {$set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
    }}, {new: true}, (err, updatedUser => {
        if(err) {
            console.log(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    }));
});

app.post('/user/register', (req,res) => {
    Users.findOne({Username: req.body.Username}).then((user) => {
        if(user) {
            return res.status(400).send('User: ' + req.body.Username + ' already exists.');
        } else {
            Users.create({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }).then((user) => {res.status(201).json(user);}).catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            })
        }
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    })
});

app.post('/movies/favorites/add/:title', (req,res) => {

});

app.delete('/movies/favorites/remove/:title', (req,res) => {

});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
