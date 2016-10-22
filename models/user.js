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
            const newUser = new User({ username: profile.id, name: profile.displayName });
            newUser.save((err) => {
                if (err) { return done(err); }
                User.findOne({ username: newUser.username }, (err, doc) => {
                    const token = 'JWT ' + jwt.sign({ _id: doc._id }, config.secret, { expiresIn: "24h" });
                    done(null, token);
                });
            });
        } else {
            const token = 'JWT ' + jwt.sign({ _id: user._id }, config.secret, { expiresIn: "24h" });
            return done(null, token);
        }
    });
};

//export User
module.exports = User;