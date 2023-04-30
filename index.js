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
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
app.use(morgan('combined', {stream: accessLogStream}));
app.use(express.static('public'));

app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

app.get('/movies', passport.authenticate('jwt', {session: false}), (req,res) => {
    Movies.find().then((movies)=> {
        res.status(200).json(movies);
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.get('/movies/favorites', passport.authenticate('jwt', {session: false}), (req,res) => {
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

app.get('/movies/:title', passport.authenticate('jwt', {session: false}), (req,res) => {
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

app.get('/genres/:name', passport.authenticate('jwt', {session: false}), (req,res) => {
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

app.get('/directors/:name', passport.authenticate('jwt', {session: false}), (req,res) => {
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

app.put('/user/update', passport.authenticate('jwt', {session: false}), (req,res) => {
    Users.findOne({Username: req.body.Username}).then((user) => {
        if(!user) {
            return res.status(400).send('User: ' + req.body.Username + ' doesn\'t exist.');
        } else {
            if(req.body.Password)
                user.Password = req.body.Password;
            if(req.body.Email)
                user.Email = req.body.Email;
        }
        res.status(201).json(user);
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
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

app.post('/movies/favorites/add/:title', passport.authenticate('jwt', {session: false}), (req,res) => {
    let MovieID = undefined;

    Movies.findOne({Title: req.params.title}).then((movie)=> {
        if(!movie) {
            return res.status(400).send('Movie: ' + req.params.title + ' doesn\'t exist.');
        } else {
            MovieID = movie._id;
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });

    Users.findOne({Username: req.body.Username}).then((updatedUser)=> {
        if(!updatedUser) {
            return res.status(400).send('User: ' + req.body.Username + ' doesn\'t exist.');
        } else {
            if(updatedUser.FavoriteMovies.indexOf(MovieID) > -1) {
                return res.status(400).send(`Movie "${req.params.title}" is already on favorites list of user "${req.body.Username}".`);
            } else {
                updatedUser.FavoriteMovies.push(MovieID);
                updatedUser.save().then((updatedUser)=>{
                    res.status(201).json(updatedUser.FavoriteMovies);
                }).catch((error)=> {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                });
            }
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.delete('/movies/favorites/remove', passport.authenticate('jwt', {session: false}), (req,res) => {
    let MovieID = undefined;

    Movies.findOne({Title: req.body.Title}).then((movie)=> {
        if(!movie) {
            return res.status(400).send('Movie: ' + req.body.Title + ' doesn\'t exist.');
        } else {
            MovieID = movie._id;
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });

    Users.findOne({Username: req.body.Username}).then((updatedUser)=> {
        if(!updatedUser) {
            return res.status(400).send('User: ' + req.body.Username + ' doesn\'t exist.');
        } else {
            let movieIndex = updatedUser.FavoriteMovies.indexOf(MovieID);
            if(!(movieIndex > -1)) {
                return res.status(400).send(`Movie "${req.body.Title}" isn't on the favorites list of user "${req.body.Username}".`);
            } else {
                updatedUser.FavoriteMovies.splice(movieIndex, 1);
                updatedUser.save().then((updatedUser)=>{
                    res.status(201).json(updatedUser.FavoriteMovies);
                }).catch((error)=> {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                });
            }
        }
    }).catch((error)=> {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
