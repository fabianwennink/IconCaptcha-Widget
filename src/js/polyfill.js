/**
 * IconCaptcha Plugin: v3.1.2
 * Copyright © 2023, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: https://www.fabianwennink.nl/projects/IconCaptcha/license
 */

const IconCaptchaPolyfills = (function () {

    'use strict';

    const exports = {};

    exports.extend = function (out) {
        out = out || {};

        for (let i = 1; i < arguments.length; i++) {
            let obj = arguments[i];

            if (!obj)
                continue;

            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object') {
                        if (obj[key] instanceof Array)
                            out[key] = obj[key].slice(0);
                        else
                            out[key] = IconCaptchaPolyfills.extend(out[key], obj[key]);
                    } else
                        out[key] = obj[key];
                }
            }
        }

        return out;
    };

    exports.ajax = function (options = {}) {
        options = options || {};

        const request = new XMLHttpRequest();
        request.open(options.type || 'get', options.url, options.async || true);

        // Callback on success.
        if (options.success) {
            request.onload = () => {
                if (request.status === 200) {
                    try {
                        // try to parse the response to JSON.
                        options.success(JSON.parse(request.responseText));
                    } catch (exception) {
                        options.success(request.responseText);
                    }
                } else {
                    if (options.error) {
                        options.error({message: `Request returned ${request.status}.`});
                    }
                }
            };
        }

        // Callback on error.
        if (options.error) {
            request.onerror = (err) => options.error(err);
        }

        if(options.headers) {
            for (const key in options.headers) {
                request.setRequestHeader(key, options.headers[key]);
            }
        }

        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // Make sure there is a body to encode.
        if (options.data) {

            options.processData = options.processData || true;

            // Check if JSON string or FormData.
            if (options.data instanceof  FormData|| options.processData) {
                options.data = options.data || {};

                // Turn the object into form data.
                if (options.processData && typeof options.data === 'object') {
                    const formData = new FormData();
                    for (const key in options.data) {
                        formData.append(key, options.data[key]);
                    }
                    options.data = formData;
                }

                request.send(options.data);
            } else {
                request.setRequestHeader('Content-Type', 'application/json');
                request.send(JSON.stringify(options.data));
            }
        } else {
            request.send();
        }
    }

    exports.trigger = function (element, event, data) {
        var domEvent = null;

        if (window.CustomEvent && typeof window.CustomEvent === 'function') {
            domEvent = new CustomEvent(event, {detail: data});
        } else {
            domEvent = document.createEvent('CustomEvent');
            domEvent.initCustomEvent(event, true, true, data);
        }

        element.dispatchEvent(domEvent);
    }

    exports.empty = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    exports.offset = function (element) {

        if (!element.getClientRects().length) {
            return {top: 0, left: 0};
        }

        let rect = element.getBoundingClientRect();
        let win = element.ownerDocument.defaultView;

        return {
            top: rect.top + win.pageYOffset,
            left: rect.left + win.pageXOffset
        };
    }

    exports.width = function (element) {
        return parseFloat(getComputedStyle(element, null).width.replace('px', ''));
    }

    return exports;
})();
