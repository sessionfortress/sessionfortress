sessionfortress
===============

A nodejs implementation of a CSRF defense scheme robust against all
network attackers. It also prevents login CSRF even on websites that
rely on a cookie-based session system.

Before running, it is necessary to create a copy of config.sample.js
named config.js and adjust the certificate and origin settings.
The provided sample website can be used for testing. The current
version injects signatures into all static links in the page.
This allows to only start monitoring the DOM after it is created,
but changes to the DOM before it is loaded may not be captured
(in particular, document.write).
