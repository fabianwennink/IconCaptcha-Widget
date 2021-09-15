/**
 * Icon Captcha Plugin: v3.0.0
 * Copyright © 2021, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

const IconCaptcha = (function () {

    'use strict';

    const exports = {};
    const defaults = {
        general: {
            validationPath: null,
            fontFamily: null,
            credits: 'show',
        },
        security: {
            clickDelay: 1500,
            hoverDetection: true,
            enableInitialMessage: true,
            initializeDelay: 500,
            selectionResetDelay: 3000,
            loadingAnimationDelay: 1000,
            invalidateTime: 1000 * 60 * 2,
        },
        messages: {
            initialization: {
                loading: 'Loading challenge...',
                verify: 'Verify that you are human.'
            },
            header: 'Select the image displayed the <u>least</u> amount of times',
            correct: 'Verification complete.',
            incorrect: {
                title: 'Uh oh.',
                subtitle: "You've selected the wrong image."
            },
            timeout: {
                title: 'Please wait 60 sec.',
                subtitle: 'You made too many incorrect selections.'
            }
        }
    };

    const homepage = 'https://www.fabianwennink.nl/projects/IconCaptcha';
    const creditText = 'IconCaptcha by Fabian Wennink';
    const checkmarkSVG = '<svg viewBox="0 0 98.5 98.5" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path class="checkmark" d="M81.7 17.8C73.5 9.3 62 4 49.2 4 24.3 4 4 24.3 4 49.2s20.3 45.2 45.2 45.2 45.2-20.3 45.2-45.2c0-8.6-2.4-16.6-6.5-23.4L45.6 68.2 24.7 47.3" fill="none" stroke-miterlimit="10" stroke-width="8"/></svg>';

    /**
     * Initializes the IconCaptcha plugin.
     * @param selector The selector of the captcha holder, in which the captcha will be generated.
     * @param options Object containing the options for the captcha.
     * @returns IconCaptcha The plugin instance.
     */
    exports.init = function (selector, options) {

        // Prevent initializing if already initialized.
        if (_alreadyInitialized(this.nodes)) {
            return;
        }

        this.nodes = document.querySelectorAll(selector);
        let _options = IconCaptchaPolyfills.extend({}, defaults, (options || {}));

        // Initialize each captcha.
        _forEach(this.nodes, (element, id) => {
            _init(element, id, _options);
        });

        return this;
    };

    /**
     * Initializes the IconCaptcha plugin, called via jQuery hook.
     * @param elements An array of DOM elements, each element represents a single captcha holder.
     * @param options Object containing the options for the captcha.
     * @returns IconCaptcha The plugin instance.
     */
    exports.$init = function (elements, options) {

        // Prevent initializing if already initialized.
        if (_alreadyInitialized(this.nodes)) {
            return;
        }

        this.nodes = elements;
        let _options = IconCaptchaPolyfills.extend({}, defaults, (options || {}));

        // Initialize each captcha.
        _forEach(this.nodes, (element, id) => {
            _init(element, id, _options);
        });

        return this;
    }

    /**
     * Binds the given callback function to the given event type. When the specific
     * event type is fired, the callback function will be executed.
     * @param event The event type name.
     * @param callback The callback function.
     * @returns IconCaptcha The plugin instance.
     */
    exports.bind = function (event, callback) {
        _forEach(this.nodes, (element) => {
            element.addEventListener(event, callback);
        });

        return this;
    }

    /**
     * Loops through every item in the given array and executes the callback function for each item.
     * @param arr The array which will be iterated.
     * @param callback The function which will be called every iteration, the array item and index will be passed to the callback.
     * @private
     */
    const _forEach = function (arr, callback) {
        for (let i = 0; i < arr.length; i++) {
            callback(arr[i], i);
        }
    };

    /**
     * Checks if the plugin has already been initialized. In case the captcha has already been
     * initialized, an error will be added to the browser developer console.
     * @param nodes The array of captcha holder DOM elements.
     * @returns {boolean} TRUE if the plugin has already been initialized, FALSE if it hasn't.
     * @private
     */
    const _alreadyInitialized = function (nodes) {
        if (nodes) {
            console.error('IconCaptcha has already been initialized.')
            return true;
        }
        return false;
    }

    /**
     * Initializes the captcha for a given DOM element.
     * @param element The DOM element which represents the captcha holder.
     * @param id The identifier of the captcha.
     * @param options Object containing the options for the captcha.
     * @private
     */
    const _init = function (element, id, options) {

        const _captchaId = id + 1;
        const _captchaHolder = element;
        let _captchaIconHolder;
        let _captchaSelectionCursor;

        let startedInitialization = false;
        let invalidateTimeoutId = null;

        let captchaImageWidth = 0;

        let generated = false;
        let generatedInTime = 0;
        let submitting = false;
        let hovering = false;

        // Make sure the validationPath option is set.
        if (!options.general.validationPath) {
            setCaptchaError(true,
                'The IconCaptcha was configured incorrectly.',
                'The option `validationPath` has not been set.');
            return;
        }

        // Initialize the captcha
        init();

        function init() {

            // Apply the captcha theme, if set, else default to 'light'.
            let captchaTheme = _captchaHolder.getAttribute('data-theme') || 'light';
            _captchaHolder.classList.add('iconcaptcha-theme-' + captchaTheme);

            // Apply the custom font family, if set.
            if (options.general.fontFamily) {
                _captchaHolder.style.fontFamily = options.general.fontFamily;
            }

            // If not initialized yet, show the 'initial' captcha holder.
            if (!startedInitialization && options.security.enableInitialMessage) {
                registerHolderEvents();
                buildCaptchaInitialHolder();
                return;
            }

            // Build the captcha if it hasn't been build yet
            if (!generated) {
                buildCaptchaHolder();
            }

            // Add the loading spinner.
            addLoadingSpinner();

            // If the loadingAnimationDelay has been set and is not 0, add the loading delay.
            if (options.security.loadingAnimationDelay && options.security.loadingAnimationDelay > 0 && !options.security.enableInitialMessage) {
                setTimeout(() => loadCaptcha(captchaTheme), options.security.loadingAnimationDelay);
            } else {
                loadCaptcha(captchaTheme);
            }
        }

        function loadCaptcha(captchaTheme) {

            // Create the base64 payload.
            const requestPayload = createPayload({
                i: _captchaId, a: 1, t: captchaTheme
            });

            // Load the captcha data.
            IconCaptchaPolyfills.ajax({
                url: options.general.validationPath,
                type: 'post',
                data: {requestPayload},
                success: function (data) {
                    if (data && typeof data === 'string') {

                        // Decode and parse the response.
                        const result = JSON.parse(atob(data));

                        // If an error message was returned.
                        if (result.error) {
                            processCaptchaRequestError(result.error, result.data);
                            return;
                        }

                        // Create the base64 payload.
                        const payload = createPayload({i: _captchaId});

                        // Load the captcha image.
                        const iconsHolder = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-icons');
                        iconsHolder.style.backgroundImage = `url(${options.general.validationPath}?payload=${payload})`;
                        removeLoadingSpinnerOnImageLoad(iconsHolder);

                        // Add the selection area to the captcha holder.
                        iconsHolder.parentNode.insertAdjacentHTML('beforeend', '<div class="iconcaptcha-modal__body-selection"><i></i></div>');
                        _captchaSelectionCursor = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-selection > i');

                        // Register the events.
                        const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
                        registerSelectionEvents(captchaSelection);

                        // Event: init
                        if (!generated) {
                            IconCaptchaPolyfills.trigger(_captchaHolder, 'init', {captchaId: _captchaId});
                        }

                        // Determine the width of the image.
                        const modalSelection = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-selection');
                        captchaImageWidth = IconCaptchaPolyfills.width(modalSelection);

                        // Set the building timestamp.
                        generatedInTime = new Date();
                        generated = true;

                        // Start the invalidation timer, save the timer identifier.
                        invalidateTimeoutId = setTimeout(() => invalidateSession(true), options.security.invalidateTime);

                        return;
                    }

                    // Invalid data was returned.
                    setCaptchaError(true,
                        'The IconCaptcha could not be loaded.',
                        'Invalid data was returned by the captcha back-end service. ' +
                        'Make sure IconCaptcha is installed/configured properly.');
                },
                error: () => showIncorrectIconMessage()
            });
        }

        function buildCaptchaInitialHolder() {
            const captchaHTML = [
                "<div class='iconcaptcha-modal'>",
                "<div class='iconcaptcha-modal__body'>",
                "<div class='iconcaptcha-modal__body-circle'></div>",
                "<div class='iconcaptcha-modal__body-info'>",
                `<a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha &copy;</a>`,
                "</div>",
                `<div class='iconcaptcha-modal__body-title'>${options.messages.initialization.verify}</div>`,
                "</div>",
                "</div>"
            ];

            _captchaHolder.classList.add('iconcaptcha-init');
            _captchaHolder.classList.remove('iconcaptcha-error', 'iconcaptcha-success');
            _captchaHolder.innerHTML = captchaHTML.join('');
        }

        function buildCaptchaHolder() {
            let captchaHTML = [];

            // Adds the first portion of the HTML to the array.
            captchaHTML.push(
                "<div class='iconcaptcha-modal'>",
                "<div class='iconcaptcha-modal__header'>",
                `<span>${options.messages.header}</span>`,
                "</div>",
                "<div class='iconcaptcha-modal__body'>",
                "<div class='iconcaptcha-modal__body-icons'></div>",
                "</div>",
                `<div class='iconcaptcha-modal__footer'>`
            );

            // If the credits option is enabled, push the HTML to the array.
            if (options.general.credits === 'show' || options.general.credits === 'hide') {
                const style = (options.general.credits === 'hide') ? 'display: none' : '';
                captchaHTML.push(
                    `<span style='${style}'><a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha</a> &copy;</span>`
                );
            }

            // Adds the last portion of the HTML to the array.
            captchaHTML.push(
                "</div>",
                "<div class='iconcaptcha-modal__fields'>",
                "<input type='hidden' name='ic-hf-se' required />",
                `<input type='hidden' name='ic-hf-id' value='${_captchaId}' required />`,
                "<input type='hidden' name='ic-hf-hp' required />",
                "</div>"
            );

            // Close the holder.
            captchaHTML.push("</div>");

            _captchaHolder.innerHTML = captchaHTML.join('');
            _captchaIconHolder = _captchaHolder.querySelector('.iconcaptcha-modal__body');
        }

        function resetCaptchaHolder() {
            _captchaHolder.classList.remove('iconcaptcha-error');
            _captchaHolder.querySelector("input[name='ic-hf-se']").setAttribute('value', null);

            // Reset the captcha body.
            IconCaptchaPolyfills.empty(_captchaIconHolder);
            _captchaIconHolder.insertAdjacentHTML('beforeend', "<div class='iconcaptcha-modal__body-icons'></div>");

            // Reload the captcha.
            init();

            // Trigger: refreshed
            IconCaptchaPolyfills.trigger(_captchaHolder, 'refreshed', {captchaId: _captchaId});
        }

        function submitIconSelection(xPos, yPos) {
            if (xPos !== undefined && yPos !== undefined) {

                submitting = true;

                // Stop the reset timeout.
                clearInvalidationTimeout();

                // Round the clicked position.
                xPos = Math.round(xPos);
                yPos = Math.round(yPos);

                // Update the form fields with the captcha data.
                _captchaHolder.querySelector('input[name="ic-hf-se"]').setAttribute('value', [xPos, yPos, captchaImageWidth].join(','));
                _captchaHolder.querySelector('input[name="ic-hf-id"]').setAttribute('value', _captchaId);

                // Hide the mouse cursor.
                _captchaSelectionCursor.style.display = 'none';

                // Create the base64 payload.
                const payload = createPayload({
                    i: _captchaId, x: xPos, y: yPos, w: captchaImageWidth, a: 2
                });

                IconCaptchaPolyfills.ajax({
                    url: options.general.validationPath,
                    type: 'POST',
                    data: {payload},
                    success: () => showCompletionMessage(),
                    error: () => showIncorrectIconMessage()
                });
            }
        }

        function showCompletionMessage() {
            _captchaIconHolder.classList.remove('captcha-opacity');

            // Unregister the selection events to prevent possible memory leaks.
            const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
            unregisterSelectionEvents(captchaSelection);

            // Clear the modal, except for the input fields.
            const elements = _captchaHolder.querySelectorAll('.iconcaptcha-modal__header, .iconcaptcha-modal__footer, .iconcaptcha-modal__body');
            _forEach(elements, function(el) {
                element.parentNode.removeChild(el);
            });

            // Add the success message to the element.
            _captchaHolder.classList.add('iconcaptcha-success');

            // Add the success screen to the captcha modal.
            const captchaModal = _captchaHolder.querySelector('.iconcaptcha-modal');
            captchaModal.innerHTML +=
                `<div class="iconcaptcha-modal__body">` +
                `<div class="iconcaptcha-modal__body-title">${options.messages.correct}</div>` +
                `<div class="iconcaptcha-modal__body-checkmark">${checkmarkSVG}</div>` +
                `<div class='iconcaptcha-modal__body-info'>` +
                `<a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha &copy;</a>` +
                `</div>` +
                `</div>`;

            // Mark the captcha as 'not submitting'.
            submitting = false;

            // Trigger: success
            IconCaptchaPolyfills.trigger(_captchaHolder, 'success', {captchaId: _captchaId});
        }

        function showIncorrectIconMessage(topMessage, bottomMessage, reset = true) {
            _captchaIconHolder.classList.remove('captcha-opacity');

            // Unregister the selection events.
            const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
            unregisterSelectionEvents(captchaSelection);

            topMessage = topMessage || options.messages.incorrect.title;
            bottomMessage = bottomMessage || options.messages.incorrect.subtitle;

            // Add the error message to the element.
            _captchaHolder.classList.add('iconcaptcha-error');
            _captchaIconHolder.innerHTML =
                `<div class="iconcaptcha-modal__body-title">${topMessage}</div>` +
                `<div class="iconcaptcha-modal__body-subtitle">${bottomMessage}</div>`;

            // Mark the captcha as 'not submitting'.
            submitting = false;

            // Trigger: error
            IconCaptchaPolyfills.trigger(_captchaHolder, 'error', {captchaId: _captchaId});

            // Reset the captcha.
            if (reset) {
                setTimeout(resetCaptchaHolder, options.security.selectionResetDelay);
            }
        }

        function addLoadingSpinner() {
            _captchaIconHolder.classList.add('captcha-opacity');
            _captchaIconHolder.insertAdjacentHTML('beforeend', '<div class="captcha-loader"></div>')
        }

        function removeLoadingSpinner() {
            _captchaIconHolder.classList.remove('captcha-opacity');

            const captchaLoader = _captchaIconHolder.querySelector('.captcha-loader');
            captchaLoader?.parentNode?.removeChild(captchaLoader);
        }

        function removeLoadingSpinnerOnImageLoad(elem) {
            const imageUrl = elem.style.backgroundImage.match(/\((.*?)\)/)[1].replace(/(['"])/g, '');
            const imgObject = new Image();

            // Listen to the image loading event.
            imgObject.onload = () => removeLoadingSpinner();

            // Workaround for IE (IE sometimes doesn't fire onload on cached resources).
            imgObject.src = imageUrl;
            if (imgObject.complete) {
                imgObject.onload(this);
            }
        }

        function invalidateSession(invalidateServer = true) {

            // Reset the captcha state.
            generated = false;
            startedInitialization = false;

            // Create the base64 payload.
            if (invalidateServer) {
                const payload = createPayload({i: _captchaId, a: 3});
                IconCaptchaPolyfills.ajax({
                    url: options.general.validationPath,
                    type: 'post',
                    data: {payload},
                    success: function() {
                        IconCaptchaPolyfills.trigger(_captchaHolder, 'invalidated', {captchaId: _captchaId});
                        buildCaptchaInitialHolder();
                    },
                    error: () => showIncorrectIconMessage()
                });
            } else {
                buildCaptchaInitialHolder();
            }
        }

        function clearInvalidationTimeout() {
            if (invalidateTimeoutId !== null) {
                clearTimeout(invalidateTimeoutId);
                invalidateTimeoutId = null;
            }
        }

        function processCaptchaRequestError(code, data) {
            code = parseInt(code);

            // Too many incorrect selections, timeout.
            if (code === 1) {
                showIncorrectIconMessage(options.messages.timeout.title, options.messages.timeout.subtitle, false);

                // Remove the header from the captcha.
                const captchaHeader = _captchaHolder.querySelector('.iconcaptcha-modal__header');
                captchaHeader.parentNode.removeChild(captchaHeader);

                // Reset the captcha to the init holder.
                setTimeout(() => invalidateSession(false), data);
            }
        }

        function setCaptchaError(triggerEvent, displayError, consoleError = '') {

            // Display and log the error.
            _captchaHolder.innerHTML = 'IconCaptcha Error: ' + displayError;
            console.error('IconCaptcha Error: ' + (consoleError !== '') ? consoleError : displayError);

            // Trigger: error
            if (triggerEvent) {
                IconCaptchaPolyfills.trigger(_captchaHolder, 'error', {captchaId: _captchaId});
            }
        }

        function createPayload(data) {
            return btoa(JSON.stringify(data));
        }

        function registerHolderEvents() {
            if (options.security.enableInitialMessage) {
                _captchaHolder.addEventListener('click', function (e) {

                    // Prevent initialization if the captcha was initialized, or the info link was clicked.
                    if (startedInitialization || e.target instanceof HTMLAnchorElement)
                        return;

                    // Mark the captcha as initializing.
                    startedInitialization = true;

                    // Display the loading state.
                    _captchaHolder.querySelector('.iconcaptcha-modal__body-circle').style.animationDuration = '2s';
                    _captchaHolder.querySelector('.iconcaptcha-modal__body-title').innerText = options.messages.initialization.loading;

                    setTimeout(() => {
                        _captchaHolder.classList.remove('iconcaptcha-init');
                        init();
                    }, options.security.initializeDelay);
                });
            }
        }

        function registerSelectionEvents(captchaSelection) {

            const mouseClickEvent = function (e) {

                // Only allow a user to click after a set click delay.
                if ((new Date() - generatedInTime) <= options.security.clickDelay)
                    return;

                // If the cursor is not hovering over the element, return
                if (options.security.hoverDetection && !hovering)
                    return;

                // Detect if the click coordinates. If not present, it's not a real click.
                const offset = IconCaptchaPolyfills.offset(e.currentTarget);
                const xPos = (e.pageX - offset.left), yPos = (e.pageY - offset.top);
                if (!xPos || !yPos)
                    return;

                // If an image is clicked, do not allow clicking again until the form has reset
                if (_captchaIconHolder.classList.contains('captcha-opacity'))
                    return;

                // Trigger: selected
                IconCaptchaPolyfills.trigger(_captchaHolder, 'selected', {captchaId: _captchaId});

                if (options.security.loadingAnimationDelay && options.security.loadingAnimationDelay > 0) {
                    addLoadingSpinner();
                    setTimeout(() => submitIconSelection(xPos, yPos), options.security.loadingAnimationDelay);
                } else {
                    submitIconSelection(xPos, yPos);
                }
            }

            const mouseMoveEvent = function (e) {
                if (!hovering || submitting || !generated)
                    return;
                moveCustomCursor(e);
            }

            const mouseEnterEvent = function (e) {
                _captchaSelectionCursor.style.display = 'inline';
                moveCustomCursor(e);
                hovering = true;
            }

            const mouseLeaveEvent = function () {
                _captchaSelectionCursor.style.display = 'none';
                hovering = false;
            }

            // Cache the listeners for later removal.
            captchaSelection._ic_listeners = {
                'click': mouseClickEvent,
                'mousemove': mouseMoveEvent,
                'mouseenter': mouseEnterEvent,
                'mouseleave': mouseLeaveEvent,
            }

            // Register the events.
            for (let key in captchaSelection._ic_listeners) {
                captchaSelection.addEventListener(key, captchaSelection._ic_listeners[key]);
            }
        }

        function unregisterSelectionEvents(captchaSelection) {

            // Make sure the listeners cache exists on the element.
            if (!captchaSelection || !captchaSelection._ic_listeners)
                return;

            // Unregister every cached event listener.
            for (let key in captchaSelection._ic_listeners) {
                captchaSelection.removeEventListener(key, captchaSelection._ic_listeners[key]);
            }
        }

        function moveCustomCursor(e) {
            if (e.currentTarget == null)
                return;

            // Calculate the clicked X and Y position.
            let offset = IconCaptchaPolyfills.offset(e.currentTarget);

            // Apply the style position to the cursor.
            _captchaSelectionCursor.style.left = (Math.round(e.pageX - offset.left) - 8) + 'px';
            _captchaSelectionCursor.style.top = (Math.round(e.pageY - offset.top) - 7) + 'px';
        }
    }

    return exports;
})();

// Try to hook into jQuery.
if (window.jQuery != null) {
    (function ($) {
        $.fn.extend({
            iconCaptcha: function (options) {

                // Extract the DOM elements from the jQuery object.
                let nodes = [];
                for (let i = 0; i < this.length; i++) {
                    nodes.push(this[i]);
                }

                // Initialize IconCaptcha.
                return IconCaptcha.$init(nodes, options);
            }
        });
    })(jQuery);
}