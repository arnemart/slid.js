var color = require('ansi-color').set;
var figlet = require('figlet');
var marked = require('marked');
var async = require('async');
var pygmentize = require('pygmentize-bundled');
var asyncReplace = require('async-replace');
var ent = require('ent');

// Center some text on the screen
var center = function(text) {
    return text.split('\n').map(function(line) {
        var spaces = Math.floor((process.stdout.columns - line.replace(/\033\[[0-9;]*m/g, '').length) / 2) + 1;
        if (spaces < 0) {
            throw new Error('The following is too wide to fit on screen: ' + text);
        }
        return (new Array(spaces)).join(' ') + line;
    }).join('\n');
};


// Put some newlines around it
var wrapInNl = function(text) {
    return '\n' + text + '\n';
};


var renderer = new marked.Renderer();

renderer.br = function() {
    return '\n';
};
// Highlighting is handled further down.
renderer.code = function(code) {
    return wrapInNl(wrapInNl(code));
};
renderer.hr = function() {
    return wrapInNl(color((new Array(process.stdout.columns + 1)).join('-'), 'blue') + '\n');
};
// Headers should be figleted
renderer.heading = function(text, level, raw) {
    return '\n\n' + center(raw) + '\n';
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
        return text + '\n\n';
    }
};
// Make lists nice and dandy
renderer.list = function(text, ordered) {
    if (ordered) {
        text = text.split('\n').slice(0, -1).reduce(function(lines, line) {
            return lines.concat(line.replace(/^\*/, (lines.length + 1) + '.'));
        }, []).join('\n') + '\n';
    }
    return text;
};
renderer.listitem = function(text) {
    return '* ' + text + '\n';
};
// Don't put the emPHASis on the wrong sylLABle
renderer.em = function(text) {
    return color(text, 'bold+yellow');
};
renderer.strong = function(text) {
    return color(text, 'bold+green+italic');
};
// Hide blockquotes altogether. Use for adding comments.
renderer.blockquote = function() {
    return '';
};

marked.setOptions({
    renderer: renderer
});

var inlineCodeRegex = /(`+)\s*(lang=(\w+)\s+)?([\s\S]*?[^`])\s*\1(?!`)/g;

function doThePygmentsThing(code, lang, callback) {
    if (lang) {
        pygmentize({ lang: lang, format: '256', options: { style: 'monokai' } }, code, function(err, result) {
            if (err) {
                callback(color(code, 'blue'));
            } else {
                callback(result.toString().trim());
            }
        });
    } else {
        callback(color(code, 'blue'));
    }
}

module.exports.render = function(content, callback) {
    // We need to do some work on the lexed tokens before generating the final output
    async.map(marked.lexer(content), function(token, cb) {
        // Inline tokens are not exposed through the lexer, so we do highlighted code spans the hard way
        if (token.type === 'paragraph' || token.type === 'text') {
            if (token.text.match(inlineCodeRegex)) {
                asyncReplace(token.text, inlineCodeRegex, function() {
                    var lang = arguments[3];
                    var code = arguments[4];
                    var done = arguments[7];
                    doThePygmentsThing(code, lang, function(result) {
                        done(null, result);
                    });
                }, function(err, result) {
                    token.text = result;
                    cb(null, token);
                });
            } else {
                cb(null, token);
            }
        } else if (token.type === 'code') {
            token.escaped = true;
            doThePygmentsThing(token.text, token.lang, function(result) {
                token.text = result;
                cb(null, token);
            });
        // Need to do figleting of headers here because async
        } else if (token.type === 'heading') {
            token.escaped = true;
            figlet(token.text, function(err, result) {
                token.text = result;
                cb(null, token);
            });
        } else {
            cb(null, token);
        }
    }, function(err, tokens) {
        // This is needed for some reason
        if (!tokens.links) {
            tokens.links = {};
        }
        // Finally parse and make sure html entities are decoded
        callback(ent.decode(marked.parser(tokens)));
    });
};
