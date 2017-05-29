var parser = require('./ansi-markdown');
var fs = require('fs');

var rawSlides = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'});

parser.render(rawSlides, function(data) {
    console.log(data);
});

