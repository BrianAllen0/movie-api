const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

app.use(morgan('combined', {stream: accessLogStream}));
app.use(express.static('public'));

app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

app.get('/', (req,res) => {
    res.status(200).send('Welcome to my app!');
});

app.get('/movies', (req,res) => {
    res.status(200).send('Movie catalogue coming soon!');
});

app.get('/movies/favorites', (req,res) => {
    res.status(200).send('Favorites page coming soon!');
});

app.get('/movies/:title', (req,res) => {
    let movie = req.params.title;
    res.status(200).send(movie + '? Never heard of it, but I\'m sure it\'s a good one!');
});

app.get('/genres/:name', (req,res) => {
    let genre = req.params.name;
    res.status(200).send(genre + '? Never watched any of those.');
});

app.get('/directors/:name', (req,res) => {
    let director = req.params.name;
    res.status(200).send(director + '? Never heard of them.');
});

app.get('/users/register', (req,res) => {
    res.status(200).send('Thank you for your interest in my site! Unfortunately it\'s just a skeleton right now!');
});

app.get('/users/update', (req,res) => {
    res.status(200).send('My site isn\'t ready yet, so I\'m pretty sure you\'re not a user.');
});

app.get('/users/deregister', (req,res) => {
    res.status(200).send('My site isn\'t even ready yet and I\'m already catching flak. :(');
});

app.post('/movies/favorites/add/:title', (req,res) => {
    let movie = req.params.title;
    res.status(201).send(movie + '? I\'m sure it\'s great, but the favorites page isn\'t ready yet.');
});

app.delete('/movies/favorites/remove/:title', (req,res) => {
    let movie = req.params.title;
    res.status(201).send(movie + ' is no longer your favorite? Well I\'m sorry you feel that way, but the favorites page isn\'t ready yet.');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});