var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    config = require('./config');
    User = require('../models/user');

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

};