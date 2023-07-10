/**
 * IconCaptcha Plugin: v3.1.2
 * Copyright © 2023, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: https://www.fabianwennink.nl/projects/IconCaptcha/license
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
     * Initializes an IconCaptcha instance, called via jQuery hook.
     * @param {HTMLElement[]} elements An array of DOM elements, each element represents a single captcha widget holder.
     * @param {Object} options An object containing configuration options for the widgets.
     * @returns {Object} The IconCaptcha instance (for method chaining).
     */
    exports.$init = function (elements, options) {
        return _initShared(this, elements, options);
    }

    /**
     * Initializes an IconCaptcha instance.
     * @param {string} selector The selector of the captcha holder, in which the widgets will be generated.
     * @param {Object} options An object containing configuration options for the widgets.
     * @returns {Object} The IconCaptcha instance (for method chaining).
     */
    exports.init = function (selector, options) {
        const elements = Array.from(document.querySelectorAll(selector));
        return _initShared(this, elements, options);
    };

    /**
     * Resets the specified widget, or all widgets in all captcha instances if no widget identifier is provided.
     * @param {string} [widgetId] The identifier of the widget to reset.
     * @returns {IconCaptcha} The plugin instance (for method chaining).
     */
    exports.reset = function (widgetId) {

        // Make sure there are instances to reset.
        if (typeof this.instances === 'undefined') {
            console.error('IconCaptcha has not yet been initialized. Cannot use \'reset\' yet.');
            return this;
        }

        // Process all widgets.
        _eachWidget(this.instances, (widget) => {
            // Reset if the widget matches, or if no widget was specified.
            if(widgetId === undefined || widget.id === widgetId) {
                widget?.reset();
            }
        });

        return this;
    }

    /**
     * Binds an event listener to all widgets in all captcha instances.
     * @param {string} event The name of the event to bind to.
     * @param {Function} callback The function to be called when the event is triggered.
     * @returns {IconCaptcha} The plugin instance (for method chaining).
     */
    exports.bind = function (event, callback) {

        // Make sure there are instances to reset.
        if (typeof this.instances === 'undefined') {
            console.error('IconCaptcha has not yet been initialized. Cannot use \'bind\' yet.');
            return this;
        }

        // Bind the event to every widget.
        _eachWidget(this.instances, (widget) => {
            widget.element.addEventListener(event, callback);
        });

        return this;
    }

    /**
     * Initializes a captcha instance its widgets.
     * @param {Object} self The plugin instance.
     * @param {HTMLElement[]} elements The DOM elements to render the captcha widgets in.
     * @param {Object} options An object containing configuration options for the widgets.
     * @returns {Object} The IconCaptcha instance.
     * @private
     */
    const _initShared = function (self, elements, options) {

        // Prevent initializing if already initialized.
        if (
            typeof self.instances !== 'undefined' &&
            elements.some(element => element.querySelector('.iconcaptcha-modal') !== null)
        ) {
            console.error(`IconCaptcha has already been initialized on one or more elements in this list:`, elements);
            return;
        }

        // Initialize the instances object if still empty.
        if(typeof self.instances === 'undefined') {
            self.instances = {};
        }

        // Combine the given options with the default ones.
        let mergedOptions = IconCaptchaPolyfills.extend({}, defaults, (options || {}));

        // Create a new entry in the instances object.
        const index = Object.values(self.instances).length;
        self.instances[index] = [];

        // Initialize each captcha.
        for (let i = 0; i < elements.length; i++) {
            self.instances[index].push(
                _initWidget(elements[i], i, mergedOptions)
            );
        }

        return _initInstance(self.instances[index]);
    }

    /**
     * Iterates over each widget in the provided instances and calls the callback function.
     * @param {Object} instances The object containing captcha instances.
     * @param {Function} callback The function which will be called per widget. The widget will be passed to the callback as the first parameter.
     * @private
     */
    const _eachWidget = function (instances, callback) {
        for (const instance of Object.values(instances)) {
            for (const widget of Object.values(instance)) {
                callback(widget);
            }
        }
    };

    /**
     * Initializes an instance of the captcha with the given widgets.
     * @param {Object[]} widgets An array of rendered widgets.
     * @returns {Object} A captcha instance object with public methods.
     * @private
     */
    const _initInstance = function(widgets) {
        const exports = {};

        /**
         * Resets the specified widget, or all widgets if no widget identifier is provided.
         * @param {string} [widgetId] The identifier of the widget to reset.
         * @returns {Object} The captcha instance (for method chaining).
         */
        exports.reset = function (widgetId) {
            for(const widget of widgets) {
                // Reset if the widget matches, or if no widget was specified.
                if(widgetId === undefined || widget.id === widgetId) {
                    widget?.reset();
                }
            }
            return this;
        }

        /**
         * Binds an event listener to all widgets in the captcha instance.
         * @param {string} event The name of the event to bind to.
         * @param {Function} callback The function to be called when the event is triggered.
         * @returns {Object} The captcha instance (for method chaining).
         */
        exports.bind = function (event, callback) {
            for(const widget of widgets) {
                widget.element.addEventListener(event, callback);
            }
            return this;
        }

        return exports;
    }

    /**
     * Initializes the widget for the specified element.
     * @param {HTMLElement} element The DOM element to generate the widget into.
     * @param {string} id The index of the widget.
     * @param {Object} options An object containing the configuration options for the widget.
     * @returns {Object} The initialized captcha widget.
     * @private
     */
    const _initWidget = function (element, id, options) {

        const _captchaId = _captchaId || generateCaptchaId();
        const _captchaHolder = element;
        let _captchaIconHolder;
        let _captchaSelectionCursor;
        let _captchaToken;

        let startedInitialization = false;
        let invalidateTimeoutId = null;

        let captchaImageWidth = 0;

        let generated = false;
        let generatedInTime = 0;
        let submitting = false;
        let hovering = false;

        // Make sure the validationPath option is set.
        if (!options.general.validationPath) {
            setCaptchaError(true, 'IconCaptcha was configured incorrectly', 'The IconCaptcha option `validationPath` has not been set.');
            return;
        }

        // Initialize the captcha.
        init();

        /**
         * Initializes the plugin.
         */
        function init() {

            // Get the CSRF token, if available.
            _captchaToken = document.querySelector('input[name="_iconcaptcha-token"]')?.value;

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

        /**
         * Requests the captcha data from the server via an AJAX call. Based on the result of the
         * request, the captcha will either be initialized or an error message will be shown.
         * @param captchaTheme The theme name which is used by the captcha instance.
         */
        function loadCaptcha(captchaTheme) {

            // Create the base64 payload.
            const requestPayload = createPayload({
                i: _captchaId, a: 1, t: captchaTheme, tk: _captchaToken
            });

            // Load the captcha data.
            IconCaptchaPolyfills.ajax({
                url: options.general.validationPath,
                type: 'POST',
                headers: createHeaders(_captchaToken),
                data: {payload: requestPayload},
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
                        const imageRequestPayload = createPayload({i: _captchaId, tk: _captchaToken});
                        const urlParamSeparator = options.general.validationPath.indexOf('?') > -1 ? '&' : '?';

                        // Load the captcha image.
                        const iconsHolder = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-icons');
                        iconsHolder.style.backgroundImage = `url(${options.general.validationPath}${urlParamSeparator}payload=${imageRequestPayload})`;
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

        /**
         * Builds the HTML for the initial state of the captcha. The HTML will
         * replace the current content of the captcha holder element.
         */
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

        /**
         * Builds the HTML for the challenge state of the captcha. The HTML will
         * replace the current content of the captcha holder element.
         */
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

        /**
         * Resets the state of the captcha holder element. The error state will be removed,
         * some hidden input fields will be cleared and the captcha will be reinitialized.
         */
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

        /**
         * Submits the icon selection made by the user to the server for validation. Before submitting, the
         * invalidation timer will be cancelled and some information will be written to the hidden input fields.
         * In case the correct icon was selected, the success state will be shown. If an incorrect icon
         * was selected, the error state will be shown instead.
         * @param xPos The clicked X position.
         * @param yPos The clicked Y position.
         */
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
                const requestPayload = createPayload({
                    i: _captchaId, x: xPos, y: yPos, w: captchaImageWidth, a: 2, tk: _captchaToken
                });

                // Perform the request.
                IconCaptchaPolyfills.ajax({
                    url: options.general.validationPath,
                    type: 'POST',
                    headers: createHeaders(_captchaToken),
                    data: {payload: requestPayload},
                    success: () => showCompletionMessage(),
                    error: () => showIncorrectIconMessage()
                });
            }
        }

        /**
         * Changes the captcha state to the 'success' state. The header, parts of the
         * body and the footer will be replaced with the new success message state.
         */
        function showCompletionMessage() {
            _captchaIconHolder.classList.remove('captcha-opacity');

            // Unregister the selection events to prevent possible memory leaks.
            const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
            unregisterSelectionEvents(captchaSelection);

            // Clear the modal, except for the input fields.
            const elements = _captchaHolder.querySelectorAll('.iconcaptcha-modal__header, .iconcaptcha-modal__footer, .iconcaptcha-modal__body');
            for (const element of elements) {
                element.parentNode.removeChild(element);
            }

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

        /**
         * Changes the captcha state to the 'error' state.
         * @param topMessage The title message of the error state.
         * @param bottomMessage The subtitle message of the error state.
         * @param reset TRUE If the captcha should reinitialize automatically after some time, FALSE if not.
         */
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

        /**
         * Adds the loading spinner icon to the captcha holder element.
         */
        function addLoadingSpinner() {
            _captchaIconHolder.classList.add('captcha-opacity');
            _captchaIconHolder.insertAdjacentHTML('beforeend', '<div class="captcha-loader"></div>')
        }

        /**
         * Removes the loading spinner icon from the captcha holder element.
         */
        function removeLoadingSpinner() {
            _captchaIconHolder.classList.remove('captcha-opacity');

            const captchaLoader = _captchaIconHolder.querySelector('.captcha-loader');
            captchaLoader?.parentNode?.removeChild(captchaLoader);
        }

        /**
         * Removes the loading spinner icon from the captcha holder element when
         * the background image of the given DOM element is fully loaded.
         * @param elem The DOM element.
         */
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

        /**
         * Invalidates the current captcha session and resets requests the captcha holder element to be reset.
         * An AJAX call will be performed to invalidate the session on the server-side, after which the client-side
         * state will be invalidated and reset.
         * @param invalidateServer TRUE if the server-side should be invalidated or not, FALSE if not.
         */
        function invalidateSession(invalidateServer = true) {

            // Reset the captcha state.
            generated = false;
            startedInitialization = false;

            // Create the base64 payload.
            if (invalidateServer) {
                const payload = createPayload({i: _captchaId, a: 3, tk: _captchaToken});
                IconCaptchaPolyfills.ajax({
                    url: options.general.validationPath,
                    type: 'post',
                    headers: createHeaders(_captchaToken),
                    data: {payload},
                    success: function () {
                        IconCaptchaPolyfills.trigger(_captchaHolder, 'invalidated', {captchaId: _captchaId});
                        resetCaptchaHolder();
                    },
                    error: () => showIncorrectIconMessage()
                });
            } else {
                resetCaptchaHolder();
            }
        }

        /**
         * Clears the invalidation timer.
         */
        function clearInvalidationTimeout() {
            if (invalidateTimeoutId !== null) {
                clearTimeout(invalidateTimeoutId);
                invalidateTimeoutId = null;
            }
        }

        /**
         * Resets the instance and rebuilds the captcha holder.
         */
        function resetCaptcha() {

            // Reset the invalidation timer.
            clearInvalidationTimeout();

            // Reset the state.
            startedInitialization = false;
            generated = false;
            submitting = false;
            hovering = false;

            IconCaptchaPolyfills.trigger(_captchaHolder, 'reset', {captchaId: _captchaId});

            // Re-init the captcha.
            init();
        }

        /**
         * Processes the error data which was received from the server while requesting the captcha data. Actions
         * might be performed based on the given error code or error data.
         * @param code The error code.
         * @param data The payload of the error.
         */
        function processCaptchaRequestError(code, data) {
            code = parseInt(code);

            switch (code) {
                case 1: // Too many incorrect selections, timeout.
                    showIncorrectIconMessage(options.messages.timeout.title, options.messages.timeout.subtitle, false);

                    // Remove the header from the captcha.
                    const captchaHeader = _captchaHolder.querySelector('.iconcaptcha-modal__header');
                    captchaHeader.parentNode.removeChild(captchaHeader);

                    // Trigger: timeout
                    IconCaptchaPolyfills.trigger(_captchaHolder, 'timeout', {captchaId: _captchaId});

                    // Reset the captcha to the init holder.
                    setTimeout(() => invalidateSession(false), data);
                    break;
                case 2: // No CSRF token found while validating.
                    setCaptchaError(true,
                        'The captcha token is missing or is incorrect.',
                        'A server request was made without including a captcha token, however this option is enabled.');
                    break;
                default: // Any other error.
                    setCaptchaError(true, 'An unexpected error occurred.', 'An unexpected error occurred while IconCaptcha performed an action.');
                    break;
            }
        }

        /**
         * Use to log a serious error which prevents the plugin from initializing.
         * @param triggerEvent TRUE if the custom 'error' event should be triggered.
         * @param displayError The error message to display in the captcha holder element.
         * @param consoleError The error message to display in the developer console. When left empty, the
         * displayError will be written to the developer console instead.
         */
        function setCaptchaError(triggerEvent, displayError, consoleError = '') {

            // Display and log the error.
            showIncorrectIconMessage('IconCaptcha Error', displayError, false);
            console.error('IconCaptcha Error: ' + (consoleError !== '') ? consoleError : displayError);

            // Trigger: error
            if (triggerEvent) {
                IconCaptchaPolyfills.trigger(_captchaHolder, 'error', {captchaId: _captchaId});
            }
        }

        /**
         * Generates a random captcha identifier.
         * @returns {number} The widget identifier.
         */
        function generateCaptchaId() {
            const maxNumber = Math.pow(10, 13) - 1;
            return Math.floor(Math.random() * maxNumber);
        }

        /**
         * Creates a Base64 encoded JSON string from the given data parameter.
         * @param data The payload object to encode.
         * @returns {string} The encoded payload.
         */
        function createPayload(data) {
            return btoa(JSON.stringify({...data, ts: Date.now()}));
        }

        /**
         * Creates the custom header object which should be included in every AJAX request.
         * @param token The captcha session token, possibly empty.
         * @returns {{}} The header object.
         */
        function createHeaders(token) {
            let headers = {};
            if (token) {
                headers = {
                    'X-IconCaptcha-Token': token
                };
            }
            return headers;
        }

        /**
         * Registers any event which is linked to the captcha holder element.
         */
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

        /**
         * Registers any event which is linked to the captcha selection area element.
         */
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

        /**
         * Unregisters any event which is linked to the captcha selection area element.
         */
        function unregisterSelectionEvents(captchaSelection) {

            // Make sure the listeners cache exists on the element.
            if (!captchaSelection || !captchaSelection._ic_listeners)
                return;

            // Unregister every cached event listener.
            for (let key in captchaSelection._ic_listeners) {
                captchaSelection.removeEventListener(key, captchaSelection._ic_listeners[key]);
            }
        }

        /**
         * Moves the custom cursor to the current location of the actual cursor.
         * @param event The mouse move event.
         */
        function moveCustomCursor(event) {
            if (event.currentTarget == null)
                return;

            // Calculate the clicked X and Y position.
            let offset = IconCaptchaPolyfills.offset(event.currentTarget);

            // Apply the style position to the cursor.
            _captchaSelectionCursor.style.left = (Math.round(event.pageX - offset.left) - 8) + 'px';
            _captchaSelectionCursor.style.top = (Math.round(event.pageY - offset.top) - 7) + 'px';
        }

        return {
            id: _captchaId,
            element: element,
            reset: resetCaptcha,
        };
    }

    return exports;
})();

// Try to hook into jQuery.
if (window.jQuery != null) {
    (function ($) {
        $.fn.extend({
            iconCaptcha: function (options) {

                // Extract the DOM elements from the jQuery object.
                let instances = [];
                $.each(this, (_, element) => {
                    instances.push(element);
                });

                // Initialize IconCaptcha.
                return IconCaptcha.$init(instances, options);
            }
        });
    })(jQuery);
}
