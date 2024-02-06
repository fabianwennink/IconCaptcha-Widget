<br/>

<p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/k8sIUQI.png">
      <source media="(prefers-color-scheme: light)" srcset="https://i.imgur.com/RMUALSz.png">
      <img alt="IconCaptcha Logo" src="https://i.imgur.com/RMUALSz.png">
    </picture>
</p>

<p align="center">
    <strong>A self-hosted, customizable, easy-to-implement and user-friendly captcha.</strong>
</p>

<p align="center">
    <a href="https://github.com/fabianwennink/IconCaptcha-Plugin-Front-End/releases"><img src="https://img.shields.io/badge/version-4.0.2-orange.svg?style=flat-square" alt="Version" /></a>
    <a href="https://fabianwennink.nl/projects/IconCaptcha/license"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://paypal.me/nlgamevideosnl"><img src="https://img.shields.io/badge/support-PayPal-lightblue.svg?style=flat-square" alt="Support via PayPal" /></a>
    <a href="https://www.buymeacoffee.com/fabianwennink"><img src="https://img.shields.io/badge/support-Buy_Me_A_Coffee-lightblue.svg?style=flat-square" alt="Buy me a coffee" /></a>
</p>

<p align="center">
    <a href="https://sonarcloud.io/dashboard?id=fabianwennink_IconCaptcha-Widget"><img src="https://img.shields.io/sonar/alert_status/fabianwennink_IconCaptcha-Widget?server=https%3A%2F%2Fsonarcloud.io&style=flat-square&logo=sonarcloud" alt="Sonar Quality" /></a>
    <a href="https://sonarcloud.io/dashboard?id=fabianwennink_IconCaptcha-Widget"><img src="https://img.shields.io/sonar/security_rating/fabianwennink_IconCaptcha-Widget?server=https%3A%2F%2Fsonarcloud.io&style=flat-square&logo=sonarcloud&color=%234c1" alt="Sonar Security" /></a>
    <a href="https://sonarcloud.io/dashboard?id=fabianwennink_IconCaptcha-Widget"><img src="https://img.shields.io/sonar/bugs/fabianwennink_IconCaptcha-Widget?server=https%3A%2F%2Fsonarcloud.io&style=flat-square&logo=sonarcloud" alt="Sonar Bugs" /></a>
    <a href="https://sonarcloud.io/dashboard?id=fabianwennink_IconCaptcha-Widget"><img src="https://img.shields.io/sonar/vulnerabilities/fabianwennink_IconCaptcha-Widget?server=https%3A%2F%2Fsonarcloud.io&style=flat-square&logo=sonarcloud" alt="Sonar Vulnerabilities" /></a>
</p>

___

Introducing IconCaptcha, a self-hosted captcha solution that's designed to be fast, user-friendly, and highly customizable. Unlike other captchas, IconCaptcha spares users the need of deciphering hard-to-read text images, solving complex math problems, or engaging with perplexing puzzle games. Instead, it's as straightforward as comparing up to 8 icons and selecting the least common one.

This repository contains the source for the IconCaptcha client-side widget, and is to be used in combination with a server-side implementation. To implement IconCaptcha on your website, follow the installation guide of the respective server-side package you wish to use.

___

## Building the source files
To build the JavaScript and CSS files, use the included Gulp file (Gulp 4). ECMAScript 6 and later is supported.

- To watch the JavaScript and SCSS files: ```gulp watch```
- To build the source code: ```gulp build```

## Credits
The icons used in this project are made by [BlendIcons](https://blendicons.com/).

## License
This project is licensed under the [MIT](https://www.fabianwennink.nl/projects/IconCaptcha-Widget/license) license.
