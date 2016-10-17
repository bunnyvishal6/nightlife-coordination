var mongoose = require('mongoose')

//mongoose Schema
const Schema = mongoose.Schema;

//BarSchema
const BarSchema = new Schema({
    identifier: {
        type: String,
        unique: true
    },
    name: String,
    image_url: String,
    url: String,
    going: Array
});

//Bar model
var Bar = mongoose.model('Bar', BarSchema);

//find or create a bar
Bar.findOrCreate = function (doc, cb) {
    Bar.findOne({ identifier: doc.identifier }, function (err, bar) {
        if (err) { return cb(err, null) }
        if (!bar) {
            var newBar = new Bar({
                identifier: doc.identifier,
                name: doc.name,
                image_url: doc.image_url,
                url: doc.url,
                going: []
            });
            newBar.save(function (err) {
                if (err) { return cb(err, null); }
                cb(null, newBar);
            });
        } else {
            cb(null, bar);
        }
    });
};

module.exports = Bar;