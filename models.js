const mongoose = require('mongoose')
const Schema =  mongoose.Schema;
const bcrypt = require('bcrypt');
// reference https://mongoosejs.com/docs/guide.html
const movieSchema = new Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {Name: String, Description: String},
    Director: {Name: String, Bio: String},
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

const userSchema = new Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: String,
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
}

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
}

const genreSchema = new Schema({
    Name: {type: String, required: true},
    Description: {type: String, required: true}
})

const directorSchema = new Schema({
    Name: {type: String, required: true},
    Bio: {type: String, required: true},
    Birth: Date,
    Death: Date
})

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Genre = Genre;
module.exports.Director = Director;
