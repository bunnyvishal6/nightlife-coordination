var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path'),
    passport = require('passport'),
    session = require('client-sessions'),
    mongoose = require('mongoose'),
    twitterLogin = require('./config/passport'),
    Yelp = require('yelp'),
    config = require('./config/config');

//connect mongoose
mongoose.connect(config.db);

//Setup yelp client
const yelp = new Yelp({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    token: config.token,
    token_secret: config.token_secret
});

// Client Session
app.use(session({
    cookieName: 'session',
    secret: config.session_secret,
    duration: 24 * 60 * 1000,
    activeDuration: 10 * 60 * 1000,
    cookie: {
        httpOnly: true,
        ephemeral: true
    }
}));

//Use body-parser to get POST requests for API use
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Passport init
app.use(passport.initialize());
app.use(passport.session());

//set twitterLogin strategy
twitterLogin(passport);

//statis files serve 
app.use("/public", express.static(path.join(__dirname, 'public')));

//Allow CORS 
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//get home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

//get /auth/twitter
app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/loginFailedFirst', session: false }));

//get /auth/twitter/callback
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/loginFailedSecond', session: false }),
    (req, res) => {
        req.session.user = req.user;
        res.redirect('/');
    }
);

//search for bar with provided location
app.post('/search/:location', (req, res) => {
    yelp.search({ term: 'bar', location: req.params.location, limit: 20 })
        .then((data) => {
            var array = [];
            var bars = data.businesses;
            console.log(bars.length);
            for (var i = 0; i < bars.length; i++) {
                array.push({
                    id: bars[i].id,
                    image_url: bars[i].image_url,
                    name: bars[i].name,
                    url: bars[i].url,
                    snippet_text: bars[i].snippet_text
                });
                if (i == (bars.length - 1)) {
                    return res.json(array);
                }
            }
        })
        .catch((err) => {
            return res.json(JSON.parse(err.data));
        });
});

//user wanna got to this bar 
app.post('/goingTo', (req, res) => {
    if (req.session.user) {
        res.json({ jwt: req.session.user });
    } else {
        res.status(401).json("no jwt found");
    }
});

//saveSearch
app.post('/saveSearch', (req, res) => {
    console.log('saveSearch called');
    if (req.body.saveSearch) {
        req.session.savedSearch = req.body.saveSearch;
        res.json("success");
    } else {
        res.json("no-save-search");
    }
});

//check for savedSearch
app.get('/checkForSavedSearch', (req, res) => {
    console.log('checkForSavedSearch called');
    if (req.session.savedSearch) {
        res.json("yes");
    }
});

//get savedSearch
app.get('/savedSearch', (req, res) => {
    console.log("savedSearch called");
    if (req.session.savedSearch) {
        yelp.search({ term: 'bar', location: req.session.savedSearch, limit: 20 })
            .then((data) => {
                var array = [];
                var bars = data.businesses;
                console.log(bars.length);
                for (var i = 0; i < bars.length; i++) {
                    array.push({
                        id: bars[i].id,
                        image_url: bars[i].image_url,
                        name: bars[i].name,
                        url: bars[i].url,
                        snippet_text: bars[i].snippet_text
                    });
                    if (i == (bars.length - 1)) {
                        const savedSearch = req.session.savedSearch;
                        req.session.savedSearch = null;
                        return res.json({ bars: bars, savedSearch: savedSearch });
                    }
                }
            })
            .catch((err) => {
                req.session.savedSearch = null;
                return res.json(JSON.parse(err.data));
            });
    }
});

// search for bar with provided location (used for dev)
app.get('/search/:location', (req, res) => {
    yelp.search({ term: 'bar', location: req.params.location, limit: 20 })
        .then((data) => {
            var array = [];
            var bars = data.businesses;
            console.log(bars.length);
            for (var i = 0; i < bars.length; i++) {
                array.push({
                    id: bars[i].id,
                    image_url: bars[i].image_url,
                    name: bars[i].name,
                    url: bars[i].url,
                    snippet_text: bars[i].snippet_text
                });
                if (i == (bars.length - 1)) {
                    return res.json(bars);
                }
            }
        })
        .catch((err) => {
            return res.json(JSON.parse(err.data));
        });
});



//listen to environment port or 3000
app.listen(process.env.PORT || 3000);