/**
 * Icon Captcha Plugin: v3.0.0
 * Copyright © 2021, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

// Element.prototype.someNewMethod= function() {
//     alert('hello from a '+this.tagName);
// };

// window.jQuery == null

(function($){

    $.fn.extend({
        iconCaptcha: function(options) {

            // Default plugin options, will be ignored if not set
            const defaults = {
                theme: [''],
                fontFamily: '',
                clickDelay: 1000,
                invalidResetDelay: 3000,
                hoverDetection: true,
                showCredits: 'show',
                enableLoadingAnimation: false,
                loadingAnimationDelay: 2000,
                requestIconsDelay: 1500,
                validationPath: '',
                invalidateTime: 1000 * 60 * 5,
                messages: {
                    initialization: {
                        loading: 'Loading challenge...',
                        verify: 'Verify that you are human.'
                    },
                    header: 'Select the icon displayed the least amount of times',
                    correct: {
                        top: 'Great!',
                        bottom: 'You do not appear to be a robot.'
                    },
                    incorrect: {
                        top: 'Oops!',
                        bottom: 'You\'ve selected the wrong image.'
                    }
                }
            };

            const _options =  $.extend(true, defaults, options);

            const homepage = 'https://www.fabianwennink.nl/projects/IconCaptcha';
            const creditText = 'IconCaptcha by Fabian Wennink';

            // Loop through all the captcha holder.
            return this.each(function(id) {

                const _captchaId = id + 1;
                const _captchaHolder = $(this);
                let _captchaIconHolder;
                let _captchaSelectionCursor;

                let initialized = false;
                let startedInitialization = false;
                let invalidateTimeoutId = null;

                let captchaImageWidth = 0;
                let captchaImageHeight = 0;
                let iconAmount = 0;

                let generated = false;
                let generatedInTime = 0;
                let submitting = false;
                let hovering = false;

				// Make sure the validationPath option is set.
				if(!_options.validationPath) {
                    setCaptchaError(true,
                        'The IconCaptcha was configured incorrectly.',
                        'The option `validationPath` has not been set.');
                    return;
				}

                // Initialize the captcha
                init(false);

                function init(displayLoader) {

                    // TODO determine color of icons
                    let captchaTheme = _captchaHolder.data('theme') || 'light';
                    _captchaHolder.addClass('iconcaptcha-theme-' + captchaTheme);

                    if(_options.fontFamily) {
                        _captchaHolder.css('font-family', _options.fontFamily);
                    }

                    if(!startedInitialization) {
                        buildCaptchaInitialHolder();
                        return;
                    }

                    // Build the captcha if it hasn't been build yet
                    if(!generated) {
                        buildCaptchaHolder();
                    }

                    // Add the loading animation
                    if(!displayLoader) {
                        addLoader();
                    }

                    loadCaptcha(captchaTheme, displayLoader);

                    initialized = true;
                }

                function loadCaptcha(captchaTheme, loadDelay) {

                    // TODO theme moet of naar light of naar dark, of PHP andere ook ondersteunen

                    // Create the base64 payload.
                    const payload = createPayload({ i: _captchaId, a: 1, t: captchaTheme });

                    $.ajax({
                        url: _options.validationPath,
                        type: 'post',
                        data: { payload },
                        success: function (data) {
                            if(data && typeof data === "string") {

                                // Decode and parse the response.
                                const result = JSON.parse(atob(data));
                                iconAmount = result.icons;

                                // Create the base64 payload.
                                const payload = createPayload({ i: _captchaId });

                                // Load the captcha image.
                                const iconsHolder = _captchaIconHolder.find('.iconcaptcha-modal__body-icons');
                                iconsHolder.css('background-image', `url(${_options.validationPath}?payload=${payload})`);
                                removeLoaderOnImageLoad(iconsHolder, _captchaIconHolder);

                                iconsHolder.parent().append('<div class="iconcaptcha-modal__body-selection"><i></i></div>');

                                _captchaSelectionCursor = _captchaIconHolder.find('.iconcaptcha-modal__body-selection > i');

                                // Event: init
                                if(!generated) {
                                    _captchaHolder.trigger('init', [{captcha_id: id}]);
                                }

                                // Determine the width of the image.
                                const modalSelection = _captchaIconHolder.find('.iconcaptcha-modal__body-selection');
                                captchaImageWidth = modalSelection.width();
                                captchaImageHeight = modalSelection.height();

                                // Set the building timestamp.
                                generatedInTime = new Date();
                                generated = true;

                                invalidateTimeoutId = setTimeout(() => invalidateSession(), _options.invalidateTime);

                                return;
                            }

                            // Invalid data was returned.
                            setCaptchaError(true,
                                'The IconCaptcha could not be loaded.',
                                'Invalid data was returned by the captcha back-end service. ' +
                                'Make sure IconCaptcha is installed/configured properly.');
                        },
                        error: showIncorrectIconMessage
                    });
                }

                function buildCaptchaInitialHolder() {
                    const captchaHTML = [
                        "<div class='iconcaptcha-modal'>",
                        "<div class='iconcaptcha-modal__body'>",
                        "<div class='iconcaptcha-modal__body-circle'></div>",
                        "<div class='iconcaptcha-modal__body-info'>",
                        `<a href='${ homepage }' target='_blank' rel='follow' title='${ creditText }'>IconCaptcha &copy;</a>`,
                        "</div>",
                        `<div class='iconcaptcha-modal__body-title'>${ _options.messages.initialization.verify }</div>`,
                        "</div>",
                        "</div>"
                    ];

                    _captchaHolder.addClass('iconcaptcha-init');
                    _captchaHolder.html(captchaHTML.join(''));
                }

                function buildCaptchaHolder() {
                    let captchaHTML = [];

                    // Adds the first portion of the HTML to the array.
                    captchaHTML.push(
                        "<div class='iconcaptcha-modal'>",
                        "<div class='iconcaptcha-modal__header'>",
                        `<span>${_options.messages.header}</span>`,
                        "</div>",
                        "<div class='iconcaptcha-modal__body'>",
                        "<div class='iconcaptcha-modal__body-icons'></div>",
                        "</div>",
                        `<div class='iconcaptcha-modal__footer'>`
                    );

                    // If the credits option is enabled, push the HTML to the array.
                    if(_options.showCredits === 'show' || _options.showCredits === 'hide') {
                        const style = (_options.showCredits === 'hide') ? 'display: none' : '';
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

                    _captchaHolder.html(captchaHTML.join(''));
                    _captchaIconHolder = _captchaHolder.find('.iconcaptcha-modal__body');
                }

                function resetCaptchaHolder() {
                    _captchaHolder.removeClass('iconcaptcha-error');
                    _captchaHolder.find("input[name='ic-hf-se']").attr('value', null);

                    // Reset the captcha body.
                    _captchaIconHolder.empty();
                    _captchaIconHolder.append("<div class='iconcaptcha-modal__body-icons'></div>");

                    // Reload the captcha.
                    init(true);

                    // Trigger: refreshed
                    _captchaHolder.trigger('refreshed', [{captcha_id: _captchaId}]);
                }

                function submitIconSelection(xPos, yPos) {
                    if(xPos !== undefined && yPos !== undefined) {

                        submitting = true;

                        // Stop the reset timeout.
                        clearInvalidateTimeout();

                        // Round the clicked position.
                        xPos = Math.round(xPos);
                        yPos = Math.round(yPos);

                        // Update the form fields with the captcha data.
                        _captchaHolder.find('input[name="ic-hf-se"]').attr('value', [xPos, yPos, captchaImageWidth].join(','));
                        _captchaHolder.find('input[name="ic-hf-id"]').attr('value', _captchaId);

                        // Hide the mouse cursor.
                        _captchaSelectionCursor.hide();

                        // Create the base64 payload.
                        const payload = createPayload({
                            i: _captchaId, x: xPos, y: yPos, w: captchaImageWidth, a : 2
                        });

                        $.ajax({
                            url: _options.validationPath,
                            type: 'POST',
                            data: { payload },
                            success: showCompletionMessage,
                            error: showIncorrectIconMessage
                        });
                    }
                }

                // TODO aanpassen
                function showCompletionMessage() {
                    _captchaHolder.find('.iconcaptcha-modal__header').remove();
                    _captchaHolder.addClass('iconcaptcha-success');

                    _captchaIconHolder.removeClass('captcha-opacity');
                    _captchaIconHolder.html(
                        `<div class="iconcaptcha-modal__body-title">${ _options.messages.correct.top }</div>` +
                        `<div class="iconcaptcha-modal__body-subtitle">${ _options.messages.correct.bottom }</div>`
                    );

                    submitting = false;

                    // Trigger: success
                    _captchaHolder.trigger("success", [{ captcha_id: _captchaId }]);
                }

                // TODO aanpassen
                function showIncorrectIconMessage() {
                    _captchaHolder.addClass('iconcaptcha-error');

                    _captchaIconHolder.removeClass('captcha-opacity');
                    _captchaIconHolder.html(
                        '<div class="iconcaptcha-modal__body-title">' +
                        ((_options.messages.incorrect && _options.messages.incorrect.top) ? _options.messages.incorrect.top : 'Oops!') +
                        '</div><div class="iconcaptcha-modal__body-subtitle">' +
                        ((_options.messages.incorrect && _options.messages.incorrect.bottom) ? _options.messages.incorrect.bottom : 'You\'ve selected the wrong image.') +
                        '</div>'
                    );

                    submitting = false;

                    // Trigger: error
                    _captchaHolder.trigger('error', [{captcha_id: _captchaId}]);

                    // Reset the captcha.
                    setTimeout(resetCaptchaHolder, _options.invalidResetDelay);
                }

                function addLoader() {
                    _captchaIconHolder.addClass('captcha-opacity');
                    _captchaIconHolder.prepend('<div class="captcha-loader"></div>');
                }

                function removeLoader() {
                    _captchaIconHolder.removeClass('captcha-opacity');
                    _captchaIconHolder.find('.captcha-loader').remove();
                }

                function removeLoaderOnImageLoad(elem) {
                    const imageUrl = elem.css('background-image').match(/\((.*?)\)/)[1].replace(/('|")/g, '');
                    const imgObject = new Image();

                    // Listen to the image loading event.
                    imgObject.onload = () => removeLoader(_captchaIconHolder);

                    // Workaround for IE (IE sometimes doesn't fire onload on cached resources).
                    imgObject.src = imageUrl;
                    if (imgObject.complete) {
                        imgObject.onload(this);
                    }
                }

                function invalidateSession() {

                    // Reset the captcha state.
                    generated = false;
                    startedInitialization = false;

                    // Create the base64 payload.
                    const payload = createPayload({ i: _captchaId, a: 3 });

                    $.ajax({
                        url: _options.validationPath,
                        type: 'post',
                        data: { payload },
                        success: buildCaptchaInitialHolder,
                        error: showIncorrectIconMessage
                    });
                }

                function clearInvalidateTimeout() {
                    if(invalidateTimeoutId !== null) {
                        clearTimeout(invalidateTimeoutId);
                        invalidateTimeoutId = null;
                    }
                }

                function setCaptchaError(triggerEvent, displayError, consoleError = '') {

                    // Display and log the error.
                    _captchaHolder.html('IconCaptcha Error: ' + displayError);
                    console.error('IconCaptcha Error: ' + (consoleError !== '') ? consoleError : displayError);

                    // Trigger: error
                    if(triggerEvent) {
                        _captchaHolder.trigger('error', [{captcha_id: _captchaId}]);
                    }
                }

                function createPayload(data) {
                    return btoa(JSON.stringify(data));
                }

                // On captcha init click.
                // TODO niet inladen als uitgezet door user
                _captchaHolder.on('click', function(e) {

                    // Prevent initialization if the captcha was initialized, or the info link was clicked.
                    if(startedInitialization || e.target instanceof HTMLAnchorElement)
                        return;

                    // Display the loading state.
                    _captchaHolder.find('.iconcaptcha-modal__body-circle').css('animation-duration', '2s');
                    _captchaHolder.find('.iconcaptcha-modal__body-title').text(_options.messages.initialization.loading);

                    setTimeout(() => {
                        startedInitialization = true;
                        _captchaHolder.removeClass('iconcaptcha-init');
                        init(true);
                    }, 500); // TODO custom
                });

                // On icon click
                _captchaHolder.on('click', '.iconcaptcha-modal__body-selection', function(e) {

                    // Only allow a user to click after a set click delay.
                    if((new Date() - generatedInTime) <= _options.clickDelay)
                        return;

                    // If the cursor is not hovering over the element, return
                    if(_options.hoverDetection && !hovering)
                        return;

                    // Detect if the click coordinates. If not present, it's not a real click.
                    const xPos = (e.pageX - $(e.currentTarget).offset().left),
                        yPos = (e.pageY - $(e.currentTarget).offset().top);
                    if(!xPos || !yPos)
                        return;

                    // If an image is clicked, do not allow clicking again until the form has reset
                    if(_captchaIconHolder.hasClass('captcha-opacity'))
                        return;

                    // Trigger: selected
                    _captchaHolder.trigger('selected', [{captcha_id: _captchaId}]);

                    if(_options.enableLoadingAnimation === true) {
                        addLoader();
                        setTimeout(() => submitIconSelection(xPos, yPos), _options.loadingAnimationDelay);
                    } else {
                        submitIconSelection(xPos, yPos);
                    }
                });

                // On icon hover
                _captchaHolder.on('mousemove', '.iconcaptcha-modal__body-selection', function(e) {

                    if(!initialized || !hovering || submitting || !generated)
                        return;

                    moveMouseIcon(e);

                }).on('mouseenter', '.iconcaptcha-modal__body-selection', function(e) {
                    _captchaSelectionCursor.show();
                    moveMouseIcon(e);

                    hovering = true;
                }).on('mouseleave', '.iconcaptcha-modal__body-selection', function() {
                    _captchaSelectionCursor.hide();
                    hovering = false;
                });

                function moveMouseIcon(e) {
                    let x = Math.round(e.pageX - $(e.currentTarget).offset().left);
                    let y = Math.round(e.pageY - $(e.currentTarget).offset().top);

                    _captchaSelectionCursor.css({
                        left: (x - 8) + 'px',
                        top: (y - 7) + 'px'
                    });
                }
            });
        }
    });
})(jQuery);