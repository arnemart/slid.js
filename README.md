# Slid.js

A super stupid tool for running slides on the command line.

It’s on NPM. Just do `npm install slid.js`, add `-g` if you are a true masochist.

You need pygments and figlet.

Please don't use this for anything ever and PLEASE don't read the code.

## Usage

    slid mySlides.txt

Some markdown supported, plus there’s some special syntax. If you try to use markdown that is not supported you are likely to get html output, because of Reasons.

Use `----` to separate slides, and `--` to separate slide content.

A paragraph starting with `~` is centered.

A paragraph containing nothing but `~` is rendered as a couple of newlines.

Guarded code blocks are supported. Code is highlighted with pygments if language is provided.

Inline code spans can be prefixed with programming language like this: &#96;`lang=javascript alert('hello')`&#96;

Headers are rendered using figlet.

Blockquotes are not shown. This is handy for printing out slide content with added comments.

## Settings

There are none. You'll have to modify the code, which is basically a single strand of spaghetti.