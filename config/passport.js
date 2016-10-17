var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    config = require('./config'),
    User = require('../models/user'),
    jwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = (passport) => {
    //use passport-twitter strategy
    passport.use(new TwitterStrategy(
        {
            consumerKey: config.twitter_consumer_key,
            consumerSecret: config.twitter_consumer_secret,
            callbackUrl: config.twitter_callback_url
        },
        (token, tokenSecret, profile, done) => {
            User.findOrCreate(profile, done);
        }
    ));

    //passport jwtStrategy options
    const options = {
        jwtFromRequest: ExtractJwt.fromAuthHeader(),
        secretOrKey : config.secret
    }

    passport.use(new jwtStrategy(options, function (payload, done) {
        done(null, payload);
    }));
};