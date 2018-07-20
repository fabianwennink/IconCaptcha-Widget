# IconCaptcha Plugin - Front-End Package

[![Version](https://img.shields.io/badge/Version-2.4.0-orange.svg?style=flat-square)]() [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)]() [![Maintenance](https://img.shields.io/badge/Maintained-Yes-green.svg?style=flat-square)]()
[![Donate](https://img.shields.io/badge/Donate-PayPal-yellow.svg?style=flat-square)](https://paypal.me/nlgamevideosnl)

<br><img src="http://i.imgur.com/RMUALSz.png" />

IconCaptcha is a faster and more user-friendly captcha than most other captchas. You no longer have to read any annoying 
text-images, with IconCaptcha you only have to compare two images and select the image which is only present once.

This repository contains the front-end source of the IconCaptcha plugins for PHP and ASP.NET. For the installation guide of this package, follow the installation guide of the respective back-end package you want to use.

_Note: The initial version of this package starts at 2.4.0, which corresponds with the current version of the PHP back-end package. This choice was made due to the fact that the front-end files where initially part of the PHP back-end package._

___

## Building the source files
To build the JavaScript and CSS files, you can use either Gulp or Compass (only CSS). ECMAScript 6 and later is supported.

__Compass:__
- To watch the SCSS files: ```compass watch```


__Gulp:__
- To watch both the JavaScript and SCSS files: ```gulp watch```
- To watch only the SCSS files: ```gulp scss:watch```
- To watch only the JavaScript files: ```gulp js:watch```
- To combine the media queries in the minified CSS file: ```gulp query:css```

## Credits
The icons used in this project are made by <a href="https://www.webalys.com" target="_blank" rel="nofollow">Webalys</a>.

## License
This project is licensed under the <a href="https://github.com/fabianwennink/jQuery-Icon-Captcha-Plugin/blob/master/LICENSE">MIT</a> license.
