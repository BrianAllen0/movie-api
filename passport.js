const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({usernameField: 'Username', passwordField: 'Password'}, (username, password, callback) => {
    console.log(`${username} ${password}`);
    Users.findOne({Username: username}).then((user)=> {
        if(!user) {
            console.log('Incorrect username.');
            return callback(null, false, {message: 'Incorrect username.'});
        }
        if(!user.validatePassword(password)) {
            console.log('Incorrect password.');
            return callback(null, false, {message: 'Incorrect password.'});
        }
        return callback(null, user);
    }).catch((error)=> {
        console.log('Error: ' + error);
        return callback(null, false, {message: error});
    })
}));

passport.use(new JWTStrategy({jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),secretOrKey: 'MakingApps'}, (jwtPayLoad, callback) => {
    return Users.findById(jwtPayLoad._id).then((user)=> {
        return callback(null, user);
    }).catch((error)=> {
        return callback(error);
    });
}));