bbClear
==========

A visualization framework for health records, based on [bluebutton.js](http://github.com/blue-button/bluebutton.js/).

bbClear creates self-contained HTML documents that can parse and display the contents of common XML-formatted health records, such as those conforming to the CCDA standard. It assembles assets such as stylesheets, Javascripts, and the XML data, and provides an easy-to-use templating framework based on [swig](http://paularmstrong.github.io/swig/) to produce a portable, user-faceable representation of the data.

## Getting Started

bbClear comes with a default theme, aptly named 'clear,' so you're able to get moving right away. If you have an XML data file that conforms to CCDA or one of the other formats supported by bluebutton.js, place it in the main directory of this repository and run:

    python build.py -f -d <filename>

This will build a BlueButton HTML file in the same directory, named `bluebutton.html`. Fire this up in your favorite [modern] web browser, and see what it gives you.

## Depdendencies

bbClear itself is dependent only on [Python](http://python.org). Some themes may have additional dependencies as well. The official theme makes optional use of [Compass](http://compass-style.org/) for CSS authoring.

## Browser support

Currently, bbClear tries to support commonly-used browsers down to IE8. No support is claimed for IE7 or below, or relatively-ancient versions of browsers such as Safari, Firefox, or Chrome.

## Documentation

For more information and documentation, visit http://blue-button.github.io/bbClear/

## Copyright and Licensing

Copyright (c) 2013 by [M. Jackson Wilkinson](http://mjacksonw.com). Licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html) license.
