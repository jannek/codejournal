# Code Journal

A simple linear single-file Markdown journal to support software development.

![Using Code Journal](images/codejournal-use.gif)

## Features

Creates a new top-level localized date string Markdown heading for every day. Keeps user-added Markdown headings intact. Subsequent
entries on same date are added as new paragraphs.

## Extension Settings

This extension contributes the following settings:

* `codejournal.journalFileLocation`: Journal file location
* `codejournal.journalHeadingLocale`: Javascript locale to use for heading date string, defaults to en-US
* `codejournal.debugLog`: Open an output channel for debug log

## Known Issues

* Only top-level headings supported.
* There is an inconsistency in local vs. remote locale support, Code Journal uses ISO datestring if no full ICU present ([see this bug](https://github.com/microsoft/vscode-remote-release/issues/2884))

## References

The icon used is by Harwen. It is free to use for non-commercial use. Source: [IconArchive](http://www.iconarchive.com/show/pleasant-icons-by-harwen/Default-Icon-icon.html)