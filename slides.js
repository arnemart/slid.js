#!/usr/bin/env node
/*jshint node:true strict:false*/
// Let's show some slides

var highlight = require('cardinal').highlight;
var fs = require('fs');
var sh = require('execSync');
var rs = require('robotskirt');
var keypress = require('keypress');
var color = require('ansi-color').set;

keypress(process.stdin);

var figlet = function(text) {
    return sh.exec('echo "' + text + '" | iconv -f UTF-8 -t ISO-8859-1 | figlet -cw ' + process.stdout.columns).stdout;
    //return sh.exec('figlet -cw ' + process.stdout.columns + ' "' + text + '"').stdout;
};

var center = function(text) {
    return text.split('\n').map(function(line) {
        return (new Array(Math.floor((process.stdout.columns - line.length) / 2) + 1)).join(' ') + line;
    }).join('\n');
};

var wrapInNl = function(text) {
    return '\n' + text + '\n';
};

var renderer = new rs.HtmlRenderer();
renderer.blockcode = function(code) {
    return wrapInNl(highlight(code));
};
renderer.header = function(text) {
    return figlet(text);
};
renderer.paragraph = function(text) {
    // Just a tilde means a couple of blank lines
    if (text === '~') {
        return '\n\n';
    // Paragraphs that start with a tilde are centered
    } else if (text.match(/^~/)) {
        return center(text.replace(/^~\s*/, '')) + '\n';
    } else {
        return text + '\n';
    }
};
renderer.list = function(text, type) {
    // This signifies an ordered list for some reason
    if (type === 9) {
        var n = 1;
        text = text.split('\n').slice(0,-1).map(function(line) {
            return line.replace(/^\*/, (n++) + '.');
        }).join('\n') + '\n';
    }
    return wrapInNl(text);
};
renderer.listitem = function(text) {
    return '* ' + text;
};
renderer.emphasis = function(text) {
    return color(text, 'bold+yellow');
};
renderer.double_emphasis = function(text) {
    return color(text, 'bold+green');
};
renderer.triple_emphasis = function(text) {
    return color(text, 'bold+green+underline');
};

var parser = new rs.Markdown(renderer);
console.log(renderer);

var slides = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'}).split(/----+/).map(function(str) {
    return str.trim();
});

var currentSlide = 0;

var clearScreen = function() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
};

var renderSlide = function(n) {
    clearScreen();
    if (slides[n]) {
        process.stdout.write(parser.render(slides[n]));
    }
};

var next = function() {
    currentSlide++;
    if (currentSlide > slides.length - 1) {
        currentSlide = slides.length - 1;
    }
    renderSlide(currentSlide);
};

var prev = function() {
    currentSlide--;
    if (currentSlide < 0) {
        currentSlide = 0;
    }
    renderSlide(currentSlide);
};

process.stdin.on('keypress', function (ch, key) {
    if (key.name === 'space' || key.name === 'right') {
        next();
    } else if (key.name === 'left') {
        prev();
    } else if (key.ctrl && key.name === 'c') {
        clearScreen();
        process.stdin.pause();
    }
});

renderSlide(currentSlide);

process.stdin.setRawMode(true);
process.stdin.resume();