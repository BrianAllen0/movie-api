const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');
const fs = require('fs');
const path = require('path');
const { update } = require('lodash');
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

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
    Movies.find().then((movies)=> {
        res.status(200).json(movies);
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/movies/favorites', (req,res) => {
    Users.findOne({Username: req.body.Username}).then((user)=>{
        if(!user) {
            return res.status(400).send('User: ' + req.body.Username + ' doesn\'t exist.');
        } else {
            res.status(200).json(user.FavoriteMovies);
        }
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/movies/:title', (req,res) => {
    Movies.findOne({Title: req.params.title}).then((movie)=> {
        if(!movie) {
            return res.status(400).send('Movie: ' + req.params.title + ' doesn\'t exist.');
        } else {
            res.status(200).json(movie);
        }
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/genres/:name', (req,res) => {
    Genres.findOne({Name: req.params.name}).then((genre)=> {
        if(!genre) {
            return res.status(400).send('Genre: ' + req.params.name + ' doesn\'t exist.');
        } else {
            res.status(200).json(genre);
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/directors/:name', (req,res) => {
    Directors.findOne({Name: req.params.name}).then((director)=> {
        if(!director) {
            return res.status(400).send('Director: ' + req.params.name + ' doesn\'t exist.');
        } else {
            res.status(200).json(director);
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/user/login', (req,res) => {
    Users.findOne({Username: req.body.Username}).then((user) => {
        if(!user) {
            return res.status(400).send('User: ' + req.body.Username + ' doesn\'t exist.');
        } else {
            if(req.body.Password === user.Password) {
                // TODO: add login logic here
            } else {
                return res.status(400).send('Password is incorrect.');
            }
        }
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
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
            res.status(201).json(updatedUser);
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
    });
});

app.post('/movies/favorites/add/:title', (req,res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {$push: {
        FavoriteMovies: req.params.title}}, {new: true}, (err, updatedUser) => {
        if(err) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        } else {
            res.status(201).json(updatedUser.FavoriteMovies);
        }
    });
});

app.delete('/movies/favorites/remove', (req,res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {$pull: {
        FavoriteMovies: req.body.Title}}, {new: true}, (err, updatedUser) => {
        if(err) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        } else {
            res.json(updatedUser.FavoriteMovies);
        }
    });
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
