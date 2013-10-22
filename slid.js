#!/usr/bin/env node
/*jshint node:true strict:false*/

// Let's show some slides

var fs = require('fs');
var sh = require('execSync');
var rs = require('robotskirt');
var keypress = require('keypress');
var color = require('ansi-color').set;

// Escape for command line
var esc = function(text) {
  return '"' + text.replace(/"/g, '\\"') + '"';
};

// Make text all big and ascii-like
var figlet = function(text) {
    return sh.exec('echo ' + esc(text) + ' | iconv -f UTF-8 -t ISO-8859-1 | figlet -cw ' + process.stdout.columns).stdout;
};

// Center some text on the screen
var center = function(text) {
    return text.split('\n').map(function(line) {
        return (new Array(Math.floor((process.stdout.columns - line.length) / 2) + 1)).join(' ') + line;
    }).join('\n');
};

// Highlight some code using pygments
var highlight = function(text, language) {
    if (!language) {
        language = 'javascript';
    }
    return sh.exec('echo ' + esc(text) + ' | pygmentize -f 256 -O bg=dark,style=monokai -l ' + language).stdout.trim();
};

// Put some newlines around it
var wrapInNl = function(text) {
    return '\n' + text + '\n';
};

// Create and extend robotskirts markdown->html renderer
var renderer = new rs.HtmlRenderer();
// Code should be highlighted
renderer.blockcode = function(code, language) {
    if (language) {
        return wrapInNl(highlight(code, language));
    } else {
        return wrapInNl(code);
    }
};
renderer.codespan = function(code) {
    var reg = new RegExp('^(lang=([a-z]+) ?)?(.*)$');
    var parts = reg.exec(code);
    return highlight(parts[3], parts[2]);
};
// Headers should be figleted
renderer.header = function(text) {
    return '\n\n' + figlet(text) + '\n';
};
// Special handling for paragraphs
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
// Make lists nice and dandy
renderer.list = function(text, type) {
    // This signifies an ordered list for some reason
    if (type % 2 === 1) {
        text = text.split('\n').slice(0,-1).reduce(function(lines, line) {
            return lines.concat(line.replace(/^\*/, (lines.length + 1) + '.'));
        }, []).join('\n') + '\n';
    }
    return wrapInNl(text);
};
renderer.listitem = function(text) {
    return '* ' + text;
};
// Don't put the emPHASis on the wrong sylLABle
renderer.emphasis = function(text) {
    return color(text, 'bold+yellow');
};
renderer.double_emphasis = function(text) {
    return color(text, 'bold+green');
};
renderer.triple_emphasis = function(text) {
    return color(text, 'bold+green+underline');
};

// Yeah those extensions
var parser = new rs.Markdown(renderer, [rs.EXT_FENCED_CODE, rs.EXT_NO_INTRA_EMPHASIS]);
//console.log(renderer);process.exit();

// Load slides from the provided argument
// Error handling is for losers
// A line consisting of four or more dashes separates slides
// A line consisting of two slashes separates slide content
var slides = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'}).split(/\n----+\n/).reduce(function(collectedSlides, str) {
    str = str.trim();
    str.split('\n--\n').reduce(function(a, b) {
        currentSlide = a + '\n' + b;
        collectedSlides.push(currentSlide);
        return currentSlide;
    }, '');
    return collectedSlides;
}, []);

// Guess what this function does (read the function name for a hint)
var clearScreen = function() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
};

// Keep track of where we are in the slide deck
var currentSlide = 0;

// Render a slide with a specific number
var renderSlide = function(n) {
    if (slides[n]) {
        var slide = parser.render(slides[n]);
        clearScreen();
        process.stdout.write(slide);
    }
};

// Show next slide
var next = function() {
    currentSlide++;
    if (currentSlide > slides.length - 1) {
        currentSlide = slides.length - 1;
    }
    renderSlide(currentSlide);
};

// Show previous slide
var prev = function() {
    currentSlide--;
    if (currentSlide < 0) {
        currentSlide = 0;
    }
    renderSlide(currentSlide);
};

// Make process.stdin respond to keyboard events
keypress(process.stdin);

// Space or right arrow advances, left arrow goes back, ctrl+c or q quits
process.stdin.on('keypress', function (ch, key) {
    if (key.name === 'space' || key.name === 'right') {
        next();
    } else if (key.name === 'left') {
        prev();
    } else if ((key.ctrl && key.name === 'c') || key.name === 'q') {
        clearScreen();
        process.stdin.pause();
    }
});

// Let's go
renderSlide(currentSlide);

// Let's listen for those keyboard events
process.stdin.setRawMode(true);
process.stdin.resume();