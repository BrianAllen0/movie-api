const express = require("express");
const { check, validationResult } = require("express-validator");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
    flags: "a",
});

const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;
const port = process.env.PORT || 8080;

mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://localhost:1234",
//   "http://localhost:4200",
// ];

app.use(cors()); //{origin: (origin, callback) => {
//     if(!origin)
//         return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1) {
//         let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
//         return callback(new Error(), false);
//     }
//     return callback(null, true);
// }}));
const passport = require("passport");
require("./auth")(app);
require("./passport");

app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("public"));

app.use((err, req, res, _) => {
    res.status(500).json({ error: "Something broke!" });
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
            console.log(error);
            res.status(400).json({ error: error });
        });
});

/**
 * Returns a list of a user's favorite movies
 * @name GetUserFavoriteMovies
 * @function
 * @return {Object}
 */
app.get("/movies/favorites", (req, res) => {
    Users.findOne({ _id: req.user._id })
        .then((user) => {
            if (!user) {
                return res.status(400).json({ error: "User doesn't exist." });
            } else {
                res.status(200).json(user.FavoriteMovies);
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
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
                return res.status(400).json({ error: "Movie doesn't exist." });
            }
            return res.status(200).json(movie);
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
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
                return res.status(400).json({ error: "Genre doesn't exist." });
            }
            return res.status(200).json(genre);
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
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
                return res.status(400).json({ error: "Director doesn't exist." });
            }
            return res.status(200).json(director);
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
        });
});

/**
 * Updates a user's information and returns the new user object
 * @name UpdateUser
 * @function
 * @param {string} [email]
 * @param {string} [password]
 * @returns {object}
 */
app.patch("/user", [check("Email", "A valid email is required").isEmail()], passport.authenticate("jwt", { session: false }), (req, res) => {
    let updated = false;
    console.log(req.body);
    console.log(req.user);
    if (req.body.Email) {
        Users.findByIdAndUpdate({ _id: req.user._id }, { $set: { Email: req.body.Email } }, { new: true });
        updated = true;
    }
    if (typeof req.body.Password == "string" && req.body.Password.trim().length > 0) {
        let unhashed = req.body.Password;
        let hashed = Users.hashPassword(req.body.Password);
        console.log("Current Password ", req.user.Password);
        console.log("Hashed Password ", hashed);
        console.log("Unhashed Password ", unhashed);
        if (unhashed !== req.user.Password) {
            console.log("hit");
            Users.findByIdAndUpdate({ _id: req.user._id }, { $set: { Password: hashed } }, { new: true });
            updated = true;
        } // else password is unchanged
    }
    if (updated) {
        res.status(200).json("Update succeeded!");
    } else {
        res.status(400).json({ error: "Update failed!" });
    }
});

/**
 * Returns a specific user
 * @name GetUser
 * @function
 * @returns {object}
 */
app.get("/user", passport.authenticate("jwt", { session: false }), async (req, res) => {
    Users.findById(req.user._id)
        .select("-Password")
        .populate("FavoriteMovies")
        .then((user) => {
            if (!user) {
                return res.status(400).json({ error: "User doesn't exist." });
            } else {
                res.status(200).json(user);
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: "error" });
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
    "/user",
    [
        check("Username", "Username is required").notEmpty(),
        check("Username", "Username must contain only alphanumeric characters.").isAlphanumeric(),
        check("Password", "Password is required").notEmpty(),
        check("Email", "A valid email is required").isEmail(),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).json({ error: "User: " + req.body.Username + " already exists." });
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
                            console.log(error);
                            res.status(500).json({ error: error });
                        });
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(400).json({ error: error });
            });
    }
);

/**
 * Deletes an existing user
 * @name DeleteUser
 * @function
 * @returns {object}
 */
app.delete("/user", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findByIdAndDelete({ _id: req.user._id })
        .then(() => {
            return res.status(200).json({ message: "User deleted!" });
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
        });
});

/**
 * Adds a movie to a user's favorites
 * @name AddFavoriteMovie
 * @function
 * @param {string} movieId
 * @returns {object}
 */
app.post("/movies/favorites", passport.authenticate("jwt", { session: false }), async (req, res) => {
    Users.findByIdAndUpdate(req.user._id, {
        $addToSet: { FavoriteMovies: req.body.movieId },
    })
        .then(() => {
            res.status(200).json({ message: "Movie added!" });
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
        });
});

/**
 * Removes a movie from a user's favorites
 * @name RemoveFavoriteMovie
 * @function
 * @param {string} movieId
 * @returns {object}
 */
app.delete("/movies/favorites", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findByIdAndUpdate(req.user._id, {
        $pull: { FavoriteMovies: req.body.movieId },
    })
        .then(() => {
            res.status(200).json({ message: "movie removed!" });
        })
        .catch((error) => {
            console.log(error);
            res.status(400).json({ error: error });
        });
});

app.all("*", (req, res) => {
    res.status(404).json({ message: "Endpoint not available!" });
});

app.listen(port, "0.0.0.0", () => {
    console.log("Listening on Port " + port);
});
