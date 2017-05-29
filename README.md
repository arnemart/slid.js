# Slid.js

A super stupid tool for running slides on the command line.

It’s on NPM. Just do `npm install slid.js`, add `-g` if you are a true masochist.

Please don't use this for anything ever and PLEASE don't read the code.

## Usage

    slid mySlides.txt

Some markdown supported, plus there’s some special syntax. If you try to use markdown that is not supported you are likely to get html output (I’ve basically just overridden a bunch of methods on the [Marked][1] markdown parser.).

Use `----` (exactly four dashes) to separate slides, and `--` (two dashes) to separate slide content.

A paragraph starting with `~` is centered.

A paragraph containing nothing but `~` is rendered as a couple of newlines.

Guarded code blocks are supported. Code is highlighted with pygments if language is provided.

Inline code spans can be prefixed with programming language like this: `&#96;lang=javascript alert('hello')&#96;`

Headers are rendered using figlet.

Blockquotes (lines prefixed with `>`) are not shown. This is handy for printing out slide content with added comments.

## Presenter display

There is a web-based presenter display running on `*:3000`. Enjoy.

## Executing code

If you add a code snippet and set the language to `#!`, it will not be shown in the slides but executed in the shell in the background. Useful for trigging build jobs/launching editors etc.

## Settings

There are none. You'll have to modify the code, which is basically a single strand of spaghetti.


[1]: https://github.com/chjj/marked
