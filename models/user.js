var mongoose = require('mongoose'),
    jwt = require('jsonwebtoken'),
    config = require('../config/config');

//mongoose schema
const Schema = mongoose.Schema;

//User Schema
const UserSchema = new Schema({
    username: String,
    name: String
});

var User = mongoose.model('User', UserSchema);

// return a token for (an existing user or a new user)
User.findOrCreate = (profile, done) => {
    User.findOne({ username: profile.id }, (err, user) => {
        if (err) { return done(err, null); }
        if (!user) {
            console.log(profile);
            const newUser = new User({ username: profile.id, name: profile.displayName });
            newUser.save((err) => {
                if (err) { return done(err); }
                const token = 'JWT ' + jwt.sign({ id: user._id }, config.secret, { expiresIn: 100080 });
                done(null, token);
            });
        } else {
            const token = 'JWT ' + jwt.sign({ id: user._id }, config.secret, { expiresIn: 100080 });
            return done(null, token);
        }
    });
};

//export User
module.exports = User;