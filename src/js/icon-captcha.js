/**
 * Icon Captcha Plugin: v2.5.0
 * Copyright © 2017, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

//# sourceMappingURL=icon-captcha.min.js.map
(function($){

    $.fn.extend({
        iconCaptcha: function(options) {

            // Default plugin options, will be ignored if not set
            let defaults = {
                themes: [''],
                fontFamily: '',
                clickDelay: 1000,
                invalidResetDelay: 3000,
                hoverDetection: true,
                showCredits: 'show',
                enableLoadingAnimation: false,
                loadingAnimationDelay: 2000,
                requestIconsDelay: 1500,
                validationPath: '',
                messages: {
                    header: 'Select the image that does not belong in the row',
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

            let $options =  $.extend(defaults, options);

            // Loop through all the captcha holder.
            return this.each(function(id) {

                let $holder = $(this);
                let $captcha_id = id;

                let build_time = 0;
                let hovering = false;
                let generated = false;
                let images_ready = 0;

				// Make sure the captchaAjaxFile is set.
				if(!$options.validationPath) {
					console.error('IconCaptcha: The option captchaAjaxFile has not been set.');

					// Trigger: error
                    $holder.trigger('error', [{captcha_id: $captcha_id}]);

                    return;
				}
				
                // Initialize the captcha
                initCaptcha(false);

                /**
                 * Initialize the captcha.
                 *
                 * @param {boolean} loaderActive If the loading animation should play.
                 */
                function initCaptcha(loaderActive) {
                    let captchaTheme = 'light';

                    if($options.themes[$captcha_id] !== undefined && ($options.themes[$captcha_id] === 'dark' || $options.themes[$captcha_id] === 'light')) {
                        captchaTheme = $options.themes[$captcha_id].toLowerCase();
                    }

                    // Reset image loading count
                    images_ready = 0;

                    $holder.addClass('captcha-theme-' + captchaTheme);

                    // Build the captcha if it hasn't been build yet
                    if(!generated)
                        _buildCaptchaHolder();

                    let $icon_holder = $holder.find('.captcha-modal__icons');

                    // If the requestIconsDelay has been set and is not 0, add the loading delay.
                    // The loading delay will (possibly) prevent high CPU usage when a page displaying
                    // one or more captchas gets constantly refreshed during a DDoS attack.
                    if(($options.requestIconsDelay && $options.requestIconsDelay > 0) && !generated) {

                        // Add the loading animation
                        if(!loaderActive)
                            addLoader($icon_holder);

                        // Set the timeout
                        setTimeout(function() {
                            loadCaptcha(captchaTheme, $icon_holder, true);
                        }, $options.requestIconsDelay)
                    } else {
                        loadCaptcha(captchaTheme, $icon_holder, loaderActive);
                    }
                }

                /**
                 * Load the captcha by playing the animations and requesting
                 * the catpcha icons from the back-end server.
                 *
                 * @param {string} captchaTheme The theme of the captcha.
                 * @param iconHolder The captcha holder element.
                 * @param {boolean} loadDelay If the loading animation should play.
                 */
                function loadCaptcha(captchaTheme, iconHolder, loadDelay) {
                    $.ajax({
                        url: $options.validationPath,
                        type: 'post',
						dataType: 'json',
                        data: {cID: $captcha_id, rT : 1, tM: captchaTheme},
                        success: function (data) {
                            if(data && typeof data === "object") {

                                // Add the loading animation
                                if(!loadDelay)
                                    addLoader(iconHolder);

                                build_time = new Date();

                                $holder.find('.captcha-image').each(function(i) {
                                    $(this).css('background-image', 'url(' + $options.validationPath + '?cid=' + $captcha_id + '&hash=' + data[i] + ')');
                                    $(this).attr('icon-hash', data[i]);

                                    loadImage($(this), iconHolder);
                                });

                                // Event: init
                                if(!generated)
                                    $holder.trigger('init', [{captcha_id: id}]);

                                generated = true;
                            }
                        },
                        error: function() {
                            showError();
                        }
                    });
                }

                /**
                 * Build the captcha's holder element.
                 * The modal will be inserted, along with hidden fields
                 * which will be used during validation.
                 *
                 * @private
                 */
                function _buildCaptchaHolder() {
                    if($options.fontFamily) {
                        $holder.css('font-family', $options.fontFamily);
                    } else {
                        $holder.css('font-family', 'Arial, sans-serif');
                    }

                    let captchaHTML = [];

                    // Adds the first portion of the HTML to the array.
                    captchaHTML.push(
                        "<div class='captcha-modal'>",
                        "<div class='captcha-modal__header'>",
                        "<span>" + (($options.messages.header) ? $options.messages.header : "Select the image that does not belong in the row") + "</span>",
                        "</div>",
                        "<div class='captcha-modal__icons'>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "</div>"
                    );

                    // If the credits option is enabled, push the HTML to the array.
                    if($options.showCredits === 'show' || $options.showCredits === 'hide') {
                        let className = 'captcha-modal__credits' + (($options.showCredits === 'hide') ? ' captcha-modal__credits--hide' : '');

                        captchaHTML.push(
                            "<div class='" + className + "' title='IconCaptcha by Fabian Wennink'>",
                            "<a href='https://www.fabianwennink.nl/projects/IconCaptcha/v2/' target='_blank' rel='follow'>IconCaptcha</a> &copy;",
                            "</div>"
                        );
                    }

                    // Adds the last portion of the HTML to the array.
                    captchaHTML.push(
                        "<input type='hidden' name='captcha-hf' required />",
                        "<input type='hidden' name='captcha-idhf' value='" + $captcha_id + "' required />",
                        "</div>"
                    );

                    $holder.html(captchaHTML.join('')).attr('data-captcha-id', $captcha_id);
                }

                /**
                 * Will be called when an icon is selected.
                 * The user's input will be validated by the back-end server.
                 *
                 * @param iconHash The hash of the selected icon.
                 */
                function submitCaptcha(iconHash) {
                    if(iconHash) {
                        $holder.find('input[name="captcha-hf"]').attr('value', iconHash);
                        $holder.find('input[name="captcha-idhf"]').attr('value', $captcha_id);

                        $.ajax({
                            url: $options.validationPath,
                            type: 'POST',
                            data: {cID: $captcha_id, pC: iconHash, rT : 2},
                            success: function () {
                                showSuccess();
                            },
                            error: function() {
                                showError();
                            }
                        });
                    }
                }

                /**
                 * Show the success message.
                 */
                function showSuccess() {
                    $holder.find('.captcha-modal__icons').empty();

                    $holder.addClass('captcha-success');
                    $holder.find('.captcha-modal__icons').html('<div class="captcha-modal__icons-title">' + (($options.messages.correct && $options.messages.correct.top) ? $options.messages.correct.top : 'Great!')
                        + '</div><div class="captcha-modal__icons-subtitle">' + (($options.messages.correct && $options.messages.correct.bottom) ? $options.messages.correct.bottom : 'You do not appear to be a robot.') + '</div>');

                    // Trigger: success
                    $holder.trigger("success", [{captcha_id: $captcha_id}]);
                }

                /**
                 * Show the error message.
                 */
                function showError() {
                    $holder.find('.captcha-modal__icons').empty();

                    $holder.addClass('captcha-error');
                    $holder.find('.captcha-modal__icons').html('<div class="captcha-modal__icons-title">' + (($options.messages.incorrect && $options.messages.incorrect.top) ? $options.messages.incorrect.top : 'Oops!')
                        + '</div><div class="captcha-modal__icons-subtitle">' + (($options.messages.incorrect && $options.messages.incorrect.bottom) ? $options.messages.incorrect.bottom : 'You\'ve selected the wrong image.') + '</div>');

                    // Trigger: error
                    $holder.trigger('error', [{captcha_id: $captcha_id}]);

                    setTimeout(resetCaptcha, $options.invalidResetDelay);
                }

                /**
                 * Reset the captcha and rebuild it.
                 */
                function resetCaptcha() {
                    $holder.removeClass('captcha-error');
                    $holder.find("input[name='captcha-hf']").attr('value', null);

                    $holder.find('.captcha-modal__icons').html([
                        "<div class='captcha-loader'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>",
                        "<div class='captcha-image'></div>"
                    ].join('\n'));

                    $holder.find('.captcha-modal__icons > .captcha-image').attr('icon-hash', null);

                    // Rebuild the captcha
                    initCaptcha(true);

                    // Trigger: refreshed
                    $holder.trigger('refreshed', [{captcha_id: $captcha_id}]);
                }

                /**
                 * Load the requested icon and wait for it to fully load.
                 * When all 5 icons are loaded, remove the loading animation.
                 *
                 * @param image The image to load.
                 * @param iconHolder The captcha holder element.
                 */
                function loadImage(image, iconHolder) {
                    let url = image.css('background-image').match(/\((.*?)\)/)[1].replace(/('|")/g,'');
                    let img = new Image();

                    // Listen to the image loading event
                    img.onload = function() {
                        images_ready += 1;

                        // Fire when all icons are ready
                        if(images_ready === 5) {

                            // Remove the preloader
                            if(iconHolder)
                                removeLoader(iconHolder);
                        }
                    };

                    // Workaround for IE (IE sometimes doesn't fire onload)
                    img.src = url;
                    if (img.complete) img.onload();
                }

                /**
                 * Add the loading animation to the captcha holder
                 *
                 * @param iconHolder The captcha holder element.
                 */
                function addLoader(iconHolder) {
                    iconHolder.addClass('captcha-opacity');
                    iconHolder.prepend('<div class="captcha-loader"></div>');
                }

                /**
                 * Remove the loading animation from the captcha holder
                 *
                 * @param iconHolder The captcha holder element.
                 */
                function removeLoader(iconHolder) {
                    iconHolder.removeClass('captcha-opacity');
                    iconHolder.find('.captcha-loader').remove();
                }

                // On icon click
                $holder.on('click', '.captcha-modal__icons > .captcha-image', function(e) {

                    // Only allow a user to click after 1.5 seconds
                    if((new Date() - build_time) <= $options.clickDelay)
                        return;

                    // if the cursor is not hovering over the element, return
                    if($options.hoverDetection && !hovering)
                        return;

                    // Detect if the click coordinates. If not present, it's not a real click.
                    let _x = (e.pageX - $(e.target).offset().left),
                        _y = (e.pageY - $(e.target).offset().top);
                    if(!_x || !_y)
                        return;

                    let iconHash = $(this).attr('icon-hash');
                    let iconHolder = $holder.find('.captcha-modal__icons');

                    // If an image is clicked, do not allow clicking again until the form has reset
                    if(iconHolder.hasClass('captcha-opacity')) return;

                    // Trigger: selected
                    $holder.trigger('selected', [{captcha_id: $captcha_id}]);

                    if($options.enableLoadingAnimation === true) {
                        addLoader(iconHolder);

                        setTimeout(function() {
                            submitCaptcha(iconHash);
                        }, $options.loadingAnimationDelay);
                    } else {
                        submitCaptcha(iconHash);
                    }
                }).on({
                        mouseenter: function() {
                            if(!hovering)
                                hovering = true
                        },
                        mouseleave: function() {
                            if(hovering)
                                hovering = false
                        }
                    }, $holder
                );
            });
        }
    });
})(jQuery);