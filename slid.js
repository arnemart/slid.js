#!/usr/bin/env node
/*jshint node:true*/

// Let's show some slides

var fs = require('fs');
var exec= require('child_process').exec;
var keypress = require('keypress');
var async = require('async');
var markdown = require('./ansi-markdown');

// Load slides from the provided argument
// Error handling is for people who make errors
// A line consisting of exactly four dashes separates slides
// A line consisting of exactly two slashes separates slide content
var rawSlides = fs.readFileSync(process.argv[2], { encoding: 'UTF-8' })
        .split(/\n----\n/)
        .reduce(function(collectedSlides, str) {
            str = str.trim();
            str.split('\n--\n').reduce(function(a, b) {
                var currentSlide = stripExecCode(a) + '\n' + b;
                collectedSlides.push(currentSlide);
                return currentSlide;
            }, '');
            return collectedSlides;
        }, []);

async.map(rawSlides, function(rawSlide, callback) {
    markdown.render(rawSlide, function(data, codeToRun) {
        callback(null, [data, codeToRun]);
    });
}, function(err, slides) {
    // Guess what this function does (read the function name for a hint)
    function clearScreen() {
        process.stdout.write('\u001B[2J\u001B[0;0f');
    }

    // Keep track of where we are in the slide deck
    var currentSlide = 0;

    // Render a slide with a specific number
    function renderSlide(n) {
        if (slides[n]) {
            var slide = slides[n][0];
            var code = slides[n][1];
            clearScreen();
            process.stdout.write(slide);
            code.forEach(function(c) {
                exec(c);
            });
        }
    }

    // Show next slide
    function next() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            renderSlide(currentSlide);
        }
    }

    // Show previous slide
    function prev() {
        if (currentSlide > 0) {
            currentSlide = currentSlide - 1;
            renderSlide(currentSlide);
        }
    }

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

    process.stdin.setRawMode(true);
    process.stdin.resume();
});

function stripExecCode(str) {
    return str.replace(/^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/m, function(match, _, lang) {
        if (lang === '#!') {
            return '';
        } else {
            return match;
        }
    });
}
