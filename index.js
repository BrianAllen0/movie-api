const bodyParser = require("body-parser");
const express = require("express");
const { check, validationResult } = require("express-validator");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const Models = require("./models.js");
const fs = require("fs");
const path = require("path");
const { update } = require("lodash");
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let allowedOrigins = ["http://localhost:8080", "http://testsite.com"];

app.use(cors()); //{origin: (origin, callback) => {
//     if(!origin)
//         return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1) {
//         let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
//         return callback(new Error(), false);
//     }
//     return callback(null, true);
// }}));
let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("public"));

app.use((err, req, res, next) => {
    res.status(500).send("Something broke!");
    console.log(err.stack);
});

/**
 * Returns a list of all movies
 * @name GetMovies
 * @function
 * @return {Object}
 */
app.get("/movies", (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Returns a list of a user's favorite movies
 * @name GetUserFavoriteMovies
 * @function
 * @param {string} userId - Username in request body
 * @return {Object}
 */
app.get("/movies/favorites", (req, res) => {
    Users.findOne({ _id: req.body.userId })
        .then((user) => {
            if (!user) {
                return res.status(400).send("User doesn't exist.");
            } else {
                res.status(200).json(user.FavoriteMovies);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Returns a specific movie
 * @name GetMovie
 * @function
 * @param {string} movieId - Movie id in url
 * @returns {object}
 */
app.get("/movies/:movieId", (req, res) => {
    Movies.findOne({ _id: req.params.movieId })
        .then((movie) => {
            if (!movie) {
                return res.status(400).send("Movie doesn't exist.");
            } else {
                res.status(200).json(movie);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Returns a specific genre
 * @name GetGenre
 * @function
 * @param {string} genreId - Genre title
 * @returns {object}
 */
app.get("/genres/:genreId", (req, res) => {
    Genres.findOne({ _id: req.params.genreId })
        .then((genre) => {
            if (!genre) {
                return res.status(400).send("Genre: " + req.params.genreId + " doesn't exist.");
            } else {
                res.status(200).json(genre);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Returns a specific director
 * @name GetDirector
 * @function
 * @param {string} directorId - Director's ID
 * @returns {object}
 */
app.get("/directors/:directorId", (req, res) => {
    Directors.findOne({ _id: req.params.directorId })
        .then((director) => {
            if (!director) {
                return res.status(400).send("Director doesn't exist.");
            } else {
                res.status(200).json(director);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Updates a user's information and returns the new user object
 * @name UpdateUser
 * @function
 * @param {string} userId - ID of user to update
 * @param {string} [email]
 * @param {string} [password]
 * @returns {object}
 */
app.patch("/user/update", (req, res) => {
    Users.findOne({ _id: req.body.userId })
        .then((user) => {
            if (!user) {
                return res.status(400).send("User doesn't exist.");
            } else {
                if (req.body.Password) user.Password = Users.hashPassword(req.body.Password);
                if (req.body.Email) user.Email = req.body.Email;
            }
            res.status(201).json(user);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Returns a specific user
 * @name GetUser
 * @function
 * @param {string} userId
 * @returns {object}
 */
app.get("/user/:username", (req, res) => {
    Users.findOne({ _id: req.params.userId })
        .then((user) => {
            if (!user) {
                return res.status(400).send("User doesn't exist.");
            } else {
                res.status(200).json(user);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Registers a new user
 * @name RegisterUser
 * @function
 * @param {string} username
 * @param {string} password
 * @param {string} email
 * @param {string} birthday
 * @returns {object}
 */
app.post(
    "/user/register",
    [
        check("Username", "Username is required").notEmpty(),
        check("Username", "Username must contain only alphanumeric characters.").isAlphanumeric(),
        check("Password", "Password is required").notEmpty(),
        check("Email", "A valid email is required").isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send("User: " + req.body.Username + " already exists.");
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send("Error: " + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send("Error: " + error);
            });
    }
);

/**
 * Deletes an existing user
 * @name DeleteUser
 * @function
 * @param {string} userId
 * @returns {object}
 */
app.delete("/user/unregister", (req, res) => {
    Users.findOne({ _id: req.body.userId })
        .then((user) => {
            if (!user) {
                return res.status(400).send("User doesn't exist.");
            } else {
                Users.deleteOne({ _id: req.body.userId });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Adds a movie to a user's favorites
 * @name AddFavoriteMovie
 * @function
 * @param {string} userId
 * @param {string} movieId
 * @returns {object}
 */
app.post("/movies/favorites/add/:movieId", (req, res) => {
    Users.findOneAndUpdate({ _id: req.user._id }, { $addToSet: { FavoriteMovies: req.params.movieId } })
        .then((updatedUser) => {
            res.status(201).json(updatedUser.FavoriteMovies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * Removes a movie from a user's favorites
 * @name RemoveFavoriteMovie
 * @function
 * @param {string} userId
 * @param {string} movieId
 * @returns {object}
 */
app.delete("/movies/favorites/remove", (req, res) => {
    Users.findOneAndDelete({ _id: req.user._id }, { $addToSet: { FavoriteMovies: req.params.movieId } })
        .then((updatedUser) => {
            res.status(201).json(updatedUser.FavoriteMovies);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log("Listening on Port " + port);
});
