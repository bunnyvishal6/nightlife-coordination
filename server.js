var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path'),
    passport = require('passport'),
    session = require('client-sessions'),
    mongoose = require('mongoose'),
    twitterLogin = require('./config/passport'),
    Yelp = require('yelp'),
    config = require('./config/config'),
    Bar = require('./models/bar');

//mongoose default basic es6 promise
mongoose.Promise = global.Promise;

//connect to mongodb
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
            for (var i = 0; i < bars.length; i++) {
                array.push({
                    identifier: bars[i].id,
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

//check for savedSearch
app.get('/checkForSavedSearch', (req, res) => {
    var msg = "";
    if (req.session.savedSearch) {
        msg = "yes";
    }
    res.json({ jwt: req.session.user, msg: msg });
});

//saveSearch
app.post('/saveSearch', (req, res) => {
    if (req.body.saveSearch) {
        req.session.savedSearch = req.body.saveSearch;
        res.json("success");
    } else {
        res.json("no-save-search");
    }
});

//get savedSearch
app.get('/savedSearch', (req, res) => {
    if (req.session.savedSearch) {
        yelp.search({ term: 'bar', location: req.session.savedSearch, limit: 20 })
            .then((data) => {
                var array = [];
                var bars = data.businesses;
                for (var i = 0; i < bars.length; i++) {
                    array.push({
                        identifier: bars[i].id,
                        image_url: bars[i].image_url,
                        name: bars[i].name,
                        url: bars[i].url,
                        snippet_text: bars[i].snippet_text
                    });
                    if (i == (bars.length - 1)) {
                        const savedSearch = req.session.savedSearch;
                        req.session.savedSearch = null;
                        return res.json({ bars: array, savedSearch: savedSearch });
                    }
                }
            })
            .catch((err) => {
                req.session.savedSearch = null;
                return res.json(JSON.parse(err.data));
            });
    }
});

//user wanna got to this bar 
app.post('/goingTo', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.session.user) {
        Bar.findOrCreate(req.body.bar, (err, bar) => {
            if (err) { console.log(err); return res.json(err); }
            const num = bar.going.indexOf(req.user._id);
            if (num < 0) {
                bar.going.push(req.user._id);
                bar.save((err) => {
                    if (err) { console.log(err); return res.json(err); }
                    return res.json("going");
                });
            } else {
                //If bar.going length is one then remove the doc from the database else just remove the user from the bar.going array.
                if (bar.going.length == 1) {
                    bar.remove((err)=>{
                        if(err){return console.log(err);}
                        return res.json("not-going");
                    });
                } else {
                    bar.going.splice(num, 1);
                    bar.save((err) => {
                        if (err) { console.log(err); return res.json(err) }
                        return res.json("not-going");
                    });
                }
            }
        });
    } else {
        res.status(401).json("no jwt found");
    }
});

//getGoing number for the bar
app.post('/getGoing', (req, res) => {
    Bar.findOne({ identifier: req.body.identifier }, (err, bar) => {
        if (err) { return res.json(err); }
        if (!bar) {
            return res.json({ msg: "no-going" });
        } else {
            res.json({ msg: "someoneGoing", going: bar.going });
        }
    });
});





//listen to environment port or 3000
app.listen(process.env.PORT || 3000);
