var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path');
Yelp = require('yelp');
config = require('./config/config.js');

//Setup yelp client
const yelp = new Yelp({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    token: config.token,
    token_secret: config.token_secret
});

//Use body-parser to get POST requests for API use
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

//search for bar with provided location
app.post('/search/:location', (req, res) => {
    yelp.search({ term: 'bar', location: req.params.location, limit: 20 })
        .then((data) => {
            var array = [];
            bars = data.businesses;
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
})

// search for bar with provided location
app.get('/search/:location', (req, res) => {
    yelp.search({ term: 'bar', location: req.params.location, limit: 20 })
        .then((data) => {
            var array = [];
            bars = data.businesses;
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