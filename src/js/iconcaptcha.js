/*
 * IconCaptcha - Copyright 2017-2024, Fabian Wennink (https://www.fabianwennink.nl)
 * Licensed under the MIT license: https://www.fabianwennink.nl/projects/IconCaptcha-Widget/license
 *
 * The above copyright notice and license shall be included in all copies or substantial portions of the software.
 */

const IconCaptcha = (function () {

    'use strict';

    const exports = {};
    const defaults = {
        general: {
            endpoint: null,
            fontFamily: null,
            showCredits: true,
        },
        security: {
            interactionDelay: 1500,
            hoverProtection: true,
            displayInitialMessage: true,
            initializationDelay: 500,
            incorrectSelectionResetDelay: 3000,
            loadingAnimationDuration: 1000,
        },
        locale: {
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
                title: 'Please wait.',
                subtitle: 'You made too many incorrect selections.'
            }
        }
    };

    const homepage = 'https://www.fabianwennink.nl/projects/IconCaptcha';
    const creditText = 'IconCaptcha by Fabian Wennink';
    const checkmarkSVG = '<svg viewBox="0 0 98.5 98.5" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path class="checkmark" d="M81.7 17.8C73.5 9.3 62 4 49.2 4 24.3 4 4 24.3 4 49.2s20.3 45.2 45.2 45.2 45.2-20.3 45.2-45.2c0-8.6-2.4-16.6-6.5-23.4L45.6 68.2 24.7 47.3" fill="none" stroke-miterlimit="10" stroke-width="8"/></svg>';
    const challengeDimension = { width: 320, height: 50 };

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
     * @param {string} id The identifier of the widget.
     * @param {Object} options An object containing the configuration options for the widget.
     * @returns {Object} The initialized captcha widget.
     * @private
     */
    const _initWidget = function (element, id, options) {

        const _captchaHolder = element;
        let _captchaIconHolder;
        let _captchaSelectionCursor;

        let _widgetId;
        let _challengeId;
        let _captchaToken;

        let startedInitialization = false;
        let invalidateTimeoutId = null;

        let captchaImageWidth = 0;

        let generated = false;
        let generatedInTime = 0;
        let submitting = false;
        let hovering = false;

        let scriptLoadTime = Date.now();

        // Make sure the server request endpoint option is set.
        if (!options.general.endpoint) {
            setCaptchaError(true, 'IconCaptcha was configured incorrectly', 'The IconCaptcha option `general.endpoint` has not been set.');
            return;
        }

        // Initialize the captcha.
        init();

        /**
         * Initializes the plugin.
         */
        function init() {

            _widgetId = _widgetId || generateWidgetId();

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
            if (!startedInitialization && options.security.displayInitialMessage) {
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

            // If the loadingAnimationDuration has been set and is not 0, add the loading delay.
            if (options.security.loadingAnimationDuration && options.security.loadingAnimationDuration > 0 && !options.security.displayInitialMessage) {
                setTimeout(() => loadCaptcha(captchaTheme), options.security.loadingAnimationDuration);
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
            const requestPayload = encodePayload({
                widgetId: _widgetId,
                action: 'LOAD',
                theme: captchaTheme,
                token: _captchaToken,
            });

            // Load the captcha data.
            IconCaptchaPolyfills.ajax({
                url: options.general.endpoint,
                type: 'POST',
                headers: createHeaders(_captchaToken),
                data: {payload: requestPayload},
                success: function (data) {
                    if (data && typeof data === 'string') {

                        // Decode and parse the response.
                        const result = decodePayload(data);

                        // Set the captcha identifier.
                        _challengeId = result.identifier;

                        // If an error message was returned.
                        if (result.error) {
                            processCaptchaRequestError(result.error, result.data);
                            return;
                        }

                        // Check if the challenge was autocompleted on the server.
                        if(result.completed && !result.challenge) {
                            clearInvalidationTimeout();
                            showCompletionMessage();
                            return;
                        }

                        // Update the form fields with the captcha data.
                        _captchaHolder.querySelector('input[name="ic-cid"]')?.setAttribute('value', _challengeId);
                        _captchaHolder.querySelector('input[name="ic-wid"]')?.setAttribute('value', _widgetId);

                        // Render the challenge.
                        const challengeCanvas = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-icons');
                        renderChallengeOnCanvas(challengeCanvas, result.challenge, () => {
                            removeLoadingSpinner();
                        });

                        // Add the selection area to the captcha holder.
                        challengeCanvas.parentNode.insertAdjacentHTML('beforeend', '<div class="iconcaptcha-modal__body-selection"><i></i></div>');
                        _captchaSelectionCursor = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-selection > i');

                        // Register the events.
                        const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
                        registerSelectionEvents(captchaSelection);

                        // Event: init
                        if (!generated) {
                            IconCaptchaPolyfills.trigger(_captchaHolder, 'init', {captchaId: _widgetId});
                        }

                        // Determine the width of the image.
                        const modalSelection = _captchaIconHolder.querySelector('.iconcaptcha-modal__body-selection');
                        captchaImageWidth = Math.round(IconCaptchaPolyfills.width(modalSelection));

                        // Set the building timestamp.
                        generatedInTime = new Date();
                        generated = true;

                        // Start the invalidation timer, save the timer identifier.
                        if(result?.expiredAt) {
                            const expirationTime = result.expiredAt - Date.now(); // calculate the remaining milliseconds.
                            invalidateTimeoutId = setTimeout(() => invalidate(), expirationTime);
                        }

                        return;
                    }

                    // Invalid data was returned.
                    setCaptchaError(true,
                        'The IconCaptcha could not be loaded.',
                        'Invalid data was returned by the captcha back-end service. ' +
                        'Make sure IconCaptcha is installed/configured properly.');
                },
                error: () => processCaptchaRequestError(-1)
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
                `<div class='iconcaptcha-modal__body-title'>${options.locale.initialization.verify}</div>`,
                "</div>",
                "</div>"
            ];

            // Include the credits.
            const style = options.general.showCredits ? '' : 'display: none';
            captchaHTML.splice(4, 0,
                `<div class='iconcaptcha-modal__body-info' style='${style}'>`,
                `<a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha &copy;</a>`,
                "</div>"
            );

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
                `<span>${options.locale.header}</span>`,
                "</div>",
                "<div class='iconcaptcha-modal__body'>",
                "<canvas class='iconcaptcha-modal__body-icons'></canvas>",
                "</div>",
                `<div class='iconcaptcha-modal__footer'>`
            );

            // Include the credits.
            const style = options.general.showCredits ? '' : 'display: none';
            captchaHTML.push(
                `<span style='${style}'><a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha</a> &copy;</span>`
            );

            // Adds the first portion of the hidden fields to the array.
            captchaHTML.push("</div>",
                "<div class='iconcaptcha-modal__fields'>",
                "<input type='hidden' name='ic-rq' value='1' required style='display:none;' />",
            );

            // Add the remaining hidden fields to the array.
            for (let field of ['wid', 'cid', 'hp']) {
                captchaHTML.push(`<input type='hidden' name='ic-${field}' required style='display:none;' />`)
            }

            // Close the holder.
            captchaHTML.push("</div></div>");

            _captchaHolder.innerHTML = captchaHTML.join('');
            _captchaIconHolder = _captchaHolder.querySelector('.iconcaptcha-modal__body');
        }

        /**
         * Resets the state of the captcha holder element. The error state will be removed,
         * some hidden input fields will be cleared and the captcha will be reinitialized.
         */
        function resetCaptchaHolder() {
            _captchaHolder.classList.remove('iconcaptcha-error');

            // Reset the captcha body.
            IconCaptchaPolyfills.empty(_captchaIconHolder);
            _captchaIconHolder.insertAdjacentHTML('beforeend', "<canvas class='iconcaptcha-modal__body-icons'></canvas>");

            // Reload the captcha.
            init();

            // Trigger: refreshed
            IconCaptchaPolyfills.trigger(_captchaHolder, 'refreshed', {captchaId: _widgetId});
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

                // Hide the mouse cursor.
                _captchaSelectionCursor.style.display = 'none';

                // Create the base64 payload.
                const requestPayload = encodePayload({
                    widgetId: _widgetId,
                    challengeId: _challengeId,
                    action: 'SELECTION',
                    x: xPos,
                    y: yPos,
                    width: captchaImageWidth,
                    token: _captchaToken,
                });

                // Perform the request.
                IconCaptchaPolyfills.ajax({
                    url: options.general.endpoint,
                    type: 'POST',
                    headers: createHeaders(_captchaToken),
                    data: {payload: requestPayload},
                    success: (response) => {

                        // Decode and parse the response.
                        const result = decodePayload(response);

                        // In the captcha was not completed.
                        if(!result.completed) {
                            showIncorrectIconMessage();
                            return;
                        }

                        showCompletionMessage(result)
                    },
                    error: () => processCaptchaRequestError(-1)
                });
            }
        }

        /**
         * Changes the captcha state to the 'success' state. The header, parts of the
         * body and the footer will be replaced with the new success message state.
         * @param response The captcha selection response.
         */
        function showCompletionMessage(response) {
            _captchaIconHolder.classList.remove('captcha-opacity');

            // Unregister the selection events to prevent possible memory leaks.
            const captchaSelection = _captchaHolder.querySelector('.iconcaptcha-modal__body-selection');
            unregisterSelectionEvents(captchaSelection);

            // If the response contains an expiration time, start the timer.
            if(response?.expiredAt) {
                const expirationTime = response.expiredAt - Date.now(); // calculate the remaining milliseconds.
                invalidateTimeoutId = setTimeout(() => invalidate(), expirationTime);
            }

            // Clear the modal, except for the input fields.
            const elements = _captchaHolder.querySelectorAll('.iconcaptcha-modal__header, .iconcaptcha-modal__footer, .iconcaptcha-modal__body');
            for (const element of elements) {
                element.parentNode.removeChild(element);
            }

            // Add the success message to the element.
            _captchaHolder.classList.add('iconcaptcha-success');

            // Build the widget HTML.
            let widgetHtml =
                `<div class="iconcaptcha-modal__body">` +
                `<div class="iconcaptcha-modal__body-title">${options.locale.correct}</div>` +
                `<div class="iconcaptcha-modal__body-checkmark">${checkmarkSVG}</div>`;

            // Include the credits.
            const style = options.general.showCredits ? '' : 'display: none';
            widgetHtml += `<div class='iconcaptcha-modal__body-info' style='${style}'>` +
                `<a href='${homepage}' target='_blank' rel='follow' title='${creditText}'>IconCaptcha &copy;</a>` +
                `</div>`;

            widgetHtml += '</div>';

            // Add the success screen to the captcha modal.
            const captchaModal = _captchaHolder.querySelector('.iconcaptcha-modal');
            captchaModal.innerHTML += widgetHtml;

            // Mark the captcha as 'not submitting'.
            submitting = false;

            // Trigger: success
            IconCaptchaPolyfills.trigger(_captchaHolder, 'success', {captchaId: _widgetId});
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

            topMessage = topMessage || options.locale.incorrect.title;
            bottomMessage = bottomMessage || options.locale.incorrect.subtitle;

            // Add the error message to the element.
            _captchaHolder.classList.add('iconcaptcha-error');
            _captchaIconHolder.innerHTML =
                `<div class="iconcaptcha-modal__body-title">${topMessage}</div>` +
                `<div class="iconcaptcha-modal__body-subtitle">${bottomMessage}</div>`;

            // Mark the captcha as 'not submitting'.
            submitting = false;

            // Trigger: error
            IconCaptchaPolyfills.trigger(_captchaHolder, 'error', {captchaId: _widgetId});

            // Reset the captcha.
            if (reset) {
                setTimeout(resetCaptchaHolder, options.security.incorrectSelectionResetDelay);
            }
        }

        /**
         * Renders the challenge image onto the captcha's canvas.
         * @param canvas The canvas element in which the challenge will be rendered.
         * @param challenge The challenge image, as a base64 string.
         * @param callback The callback which will be fired when the challenge was rendered.
         */
        function renderChallengeOnCanvas(canvas, challenge, callback) {

            // Get the calculated dimensions of the challenge canvas.
            const style = window.getComputedStyle(canvas);
            const width = parseInt(style?.getPropertyValue('width')?.replace('px', ''));
            const height = parseInt(style?.getPropertyValue('height')?.replace('px', ''));
            const smallerThanDefaultWidth = width < challengeDimension.width;

            // Calculate the height of the challenge based on its width.
            // This only has to be done if the width is less than the default size.
            const challengeHeight = smallerThanDefaultWidth
                ? width / (challengeDimension.width / challengeDimension.height)
                : height;

            // Set the canvas dimensions to fixed values.
            canvas.width = width;
            canvas.style.width = `${width}px`;
            canvas.height = challengeHeight
            canvas.style.height = `${challengeHeight}px`;

            // Apply spacing correction for smaller challenges.
            if (smallerThanDefaultWidth) {
                const additionalSpacing = Math.round((height - challengeHeight) / 2);
                canvas.style.marginTop = `${additionalSpacing}px`;
            }

            // Render the challenge onto the canvas.
            const image = new Image();
            image.src = `data:image/png;base64,${challenge}`;
            image.onload = () => {
                canvas.getContext('2d')?.drawImage(image, 0, 0, width, challengeHeight);
                callback();
            };

            // Workaround for IE (IE sometimes doesn't fire onload on cached resources).
            if (image.complete) {
                image.onload(this);
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
         * Invalidates the current captcha, resetting the state and rebuilding the captcha holder.
         */
        function invalidate() {

            _challengeId = undefined;

            // Reset the captcha state.
            generated = false;
            startedInitialization = false;

            // Reset the captcha holder.
            resetCaptchaHolder();

            // Trigger the 'invalidated' event.
            IconCaptchaPolyfills.trigger(_captchaHolder, 'invalidated', {captchaId: _widgetId});
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

            _challengeId = undefined;

            // Reset the invalidation timer.
            clearInvalidationTimeout();

            // Reset the state.
            startedInitialization = false;
            generated = false;
            submitting = false;
            hovering = false;

            IconCaptchaPolyfills.trigger(_captchaHolder, 'reset', {captchaId: _widgetId});

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
            switch (code) {
                case 'too-many-attempts': // Too many incorrect selections, timeout.
                    showIncorrectIconMessage(options.locale.timeout.title, options.locale.timeout.subtitle, false);

                    // Remove the header from the captcha.
                    const captchaHeader = _captchaHolder.querySelector('.iconcaptcha-modal__header');
                    captchaHeader.parentNode.removeChild(captchaHeader);

                    // Trigger: timeout
                    IconCaptchaPolyfills.trigger(_captchaHolder, 'timeout', {captchaId: _widgetId});

                    // Reset the captcha to the init holder.
                    setTimeout(() => invalidate(), data);
                    break;
                case 'invalid-form-token': // No CSRF token found while validating.
                    setCaptchaError(true,
                        'Captcha form token is missing or incorrect.',
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
            showIncorrectIconMessage('Captcha Error', displayError, false);
            console.error('IconCaptcha Error: ' + (consoleError !== '') ? consoleError : displayError);

            // Trigger: error
            if (triggerEvent) {
                IconCaptchaPolyfills.trigger(_captchaHolder, 'error', {captchaId: _widgetId});
            }
        }

        /**
         * Generates a random widget identifier. The identifier follows the UUID v4 format.
         * Note: While it is not cryptographically secure, when combined with the challenge ID, it provides sufficient randomness.
         * @returns {string} The widget identifier.
         */
        function generateWidgetId() {
            let uuid = '', random;
            for (let i = 0; i < 32; i++) {
                if (i === 8 || i === 12 || i === 16 || i === 20) {
                    uuid += '-';
                }
                random = Math.random() * 16 | 0;
                uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
            }
            return uuid;
        }

        /**
         * Encodes the given payload with base64 and JSON.
         * @param data The payload object to encode.
         * @returns {string} The encoded payload.
         */
        function encodePayload(data) {
            return btoa(JSON.stringify({
                ...data,
                timestamp: Date.now(),
                initTimestamp: scriptLoadTime
            }));
        }

        /**
         * Tries to decode the given base64 and JSON encoded payload.
         * @param data The request payload to be decoded.
         * @return {object} The decoded payload.
         */
        function decodePayload(data) {
            return JSON.parse(atob(data));
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
            if (options.security.displayInitialMessage) {
                _captchaHolder.addEventListener('click', function (e) {

                    // Prevent initialization if the captcha was initialized, or the info link was clicked.
                    if (startedInitialization || e.target instanceof HTMLAnchorElement)
                        return;

                    // Mark the captcha as initializing.
                    startedInitialization = true;

                    // Display the loading state.
                    _captchaHolder.querySelector('.iconcaptcha-modal__body-circle').style.animationDuration = '2s';
                    _captchaHolder.querySelector('.iconcaptcha-modal__body-title').innerText = options.locale.initialization.loading;

                    setTimeout(() => {
                        _captchaHolder.classList.remove('iconcaptcha-init');
                        init();
                    }, options.security.initializationDelay);
                });
            }
        }

        /**
         * Registers any event which is linked to the captcha selection area element.
         */
        function registerSelectionEvents(captchaSelection) {

            const mouseClickEvent = function (e) {

                // Only allow a user to click after a set click delay.
                if ((new Date() - generatedInTime) <= options.security.interactionDelay)
                    return;

                // If the cursor is not hovering over the element, return
                if (options.security.hoverProtection && !hovering)
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
                IconCaptchaPolyfills.trigger(_captchaHolder, 'selected', {captchaId: _widgetId});

                if (options.security.loadingAnimationDuration && options.security.loadingAnimationDuration > 0) {
                    addLoadingSpinner();
                    setTimeout(() => submitIconSelection(xPos, yPos), options.security.loadingAnimationDuration);
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
            id: _widgetId,
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
