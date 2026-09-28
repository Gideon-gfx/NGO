document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // HAMBURGER NAVIGATION
    // ============================================================

    const btn =
        document.querySelector('.hamburger-btn');

    const collapse =
        document.getElementById('mainNav');


    if (btn) {

        btn.addEventListener('click', function () {

            btn.classList.toggle('open');

            setTimeout(() => {

                if (
                    collapse &&
                    collapse.classList.contains('show')
                ) {

                    collapse.classList.remove('show');

                } else if (collapse) {

                    collapse.classList.add('show');

                }

            }, 20);

        });

        document.addEventListener('click', function (event) {
            if (
                collapse &&
                collapse.classList.contains('show') &&
                !collapse.contains(event.target) &&
                !btn.contains(event.target)
            ) {
                collapse.classList.remove('show');
                btn.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

    }


    // ============================================================
    // PARTNER DROPDOWNS
    // ============================================================

    const partnerMenus =
        document.querySelectorAll(
            '.nav-item.dropdown-holder, .nav-item:has(> .dropdown), .nav-item:has(> .dropdown-menu)'
        );


    partnerMenus.forEach((menu) => {

        let trigger =
            menu.querySelector(
                '.partners-toggle, :scope > .nav-link, :scope > a'
            );

        if (!trigger && menu.querySelector(':scope > .dropdown, :scope > .dropdown-menu')) {
            const partnerText = Array.from(menu.childNodes).find((node) =>
                node.nodeType === Node.TEXT_NODE &&
                node.textContent.trim().toLowerCase() === 'partners'
            );

            if (partnerText) {
                trigger = document.createElement('span');
                trigger.className = 'partners-toggle';
                trigger.textContent = 'Partners';
                trigger.setAttribute('role', 'button');
                trigger.setAttribute('tabindex', '0');
                trigger.setAttribute('aria-expanded', 'false');
                partnerText.replaceWith(trigger);
            }
        }


        if (!trigger || trigger.nodeType !== Node.ELEMENT_NODE) return;


        const setOpen = (isOpen) => {

            menu.classList.toggle(
                'open',
                isOpen
            );

            trigger.setAttribute(
                'aria-expanded',
                String(isOpen)
            );

        };


        const isDesktop =
            window.matchMedia(
                '(min-width: 836px)'
            ).matches;


        if (isDesktop) {

            menu.addEventListener(
                'mouseenter',
                () => setOpen(true)
            );


            menu.addEventListener(
                'mouseleave',
                () => setOpen(false)
            );


            trigger.addEventListener(
                'click',
                (event) => {

                    event.preventDefault();

                    const willOpen =
                        !menu.classList.contains(
                            'open'
                        );

                    setOpen(willOpen);

                }
            );

        } else {

            trigger.addEventListener(
                'click',
                (event) => {

                    event.preventDefault();

                    const willOpen =
                        !menu.classList.contains(
                            'open'
                        );

                    setOpen(willOpen);

                }
            );

        }

        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpen(!menu.classList.contains('open'));
            }
        });

        // Keep the menu closed when the hamburger opens; Partners opens only
        // after its own trigger is clicked.
        setOpen(false);


        document.addEventListener(
            'click',
            (event) => {

                if (
                    !menu.contains(
                        event.target
                    )
                ) {

                    setOpen(false);

                }

            }
        );

    });

});


// ============================================================
// COUNTERS
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    const counters =
        document.querySelectorAll(
            '.stat-number[data-count]'
        );


    if (!counters.length) return;


    const animateCounter = (el) => {

        const target =
            parseInt(
                el.dataset.count,
                10
            );


        if (!Number.isFinite(target)) return;


        const suffix =
            el.dataset.suffix || '';


        const duration = 1500;

        const start =
            performance.now();


        const step = (now) => {

            const progress =
                Math.min(
                    (now - start) /
                    duration,
                    1
                );


            const value =
                Math.round(
                    target * progress
                );


            el.textContent =
                value + suffix;


            if (progress < 1) {

                requestAnimationFrame(step);

            }

        };


        requestAnimationFrame(step);

    };


    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            animateCounter(
                                entry.target
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.4
            }
        );


    counters.forEach(
        (counter) =>
            observer.observe(counter)
    );

});


// ============================================================
// HEADER SCROLL
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    const holder =
        document.querySelector('.holder');

    const topBar =
        document.querySelector('.top');

    const spacer =
        document.querySelector('.holder-spacer');


    if (
        !holder ||
        !topBar ||
        !spacer
    ) return;


    const onScroll = () => {

        const scrolledPast =
            window.scrollY >
            topBar.offsetHeight;


        if (scrolledPast) {

            if (
                !holder.classList.contains(
                    'is-pinned'
                )
            ) {

                spacer.style.height =
                    holder.offsetHeight +
                    'px';

                holder.classList.add(
                    'is-pinned'
                );

            }

        } else {

            holder.classList.remove(
                'is-pinned'
            );

            spacer.style.height =
                '0px';

        }

    };


    let lastY =
        window.scrollY;


    const onScrollDirection = () => {

        const currentY =
            window.scrollY;


        if (
            currentY > lastY &&
            currentY > 60
        ) {

            holder.classList.add(
                'shrink'
            );

        } else {

            holder.classList.remove(
                'shrink'
            );

        }


        lastY = currentY;

    };


    window.addEventListener(
        'scroll',
        function () {

            onScroll();

            onScrollDirection();

        },
        {
            passive: true
        }
    );


    onScroll();

});


// ============================================================
// MAILING POPUP
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    const popup =
        document.getElementById(
            'mailingPopup'
        );

    const form =
        document.getElementById(
            'mailingForm'
        );

    const aboutSection =
        document.querySelector(
            '.about-section'
        );


    if (
        !popup ||
        !form ||
        !aboutSection
    ) return;


    const closeBtn =
        popup.querySelector(
            '.mailing-popup-close'
        );


    const SUBSCRIBED_KEY =
        'lagosSistemaSubscribed';


    const RESHOW_DELAY =
        15000;


    let reshowTimer = null;


    const isSubscribed = () =>
        localStorage.getItem(
            SUBSCRIBED_KEY
        ) === 'true';


    const openPopup = () => {

        if (
            isSubscribed()
        ) return;


        popup.hidden = false;

    };


    const closePopup = () => {

        popup.hidden = true;


        if (
            !isSubscribed()
        ) {

            clearTimeout(
                reshowTimer
            );


            reshowTimer =
                setTimeout(
                    openPopup,
                    RESHOW_DELAY
                );

        }

    };


    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            openPopup();

                        }

                    }
                );

            },
            {
                threshold: 0.3
            }
        );


    observer.observe(
        aboutSection
    );


    if (closeBtn) {

        closeBtn.addEventListener(
            'click',
            closePopup
        );

    }


    popup.addEventListener(
        'click',
        (event) => {

            if (
                event.target === popup
            ) {

                closePopup();

            }

        }
    );


    form.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            localStorage.setItem(
                SUBSCRIBED_KEY,
                'true'
            );


            clearTimeout(
                reshowTimer
            );


            popup.hidden = true;


            observer.disconnect();

        }
    );

});


// ============================================================
// ACCESSIBILITY
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    const toggle =
        document.getElementById(
            'a11yToggle'
        );

    const panel =
        document.getElementById(
            'a11yPanel'
        );

    const closeBtn =
        document.getElementById(
            'a11yPanelClose'
        );


    if (!toggle || !panel) return;


    const openPanel = () => {

        panel.classList.add(
            'open'
        );

        toggle.setAttribute(
            'aria-expanded',
            'true'
        );

    };


    const closePanel = () => {

        panel.classList.remove(
            'open'
        );

        toggle.setAttribute(
            'aria-expanded',
            'false'
        );

    };


    toggle.addEventListener(
        'click',
        function () {

            if (
                panel.classList.contains(
                    'open'
                )
            ) {

                closePanel();

            } else {

                openPanel();

            }

        }
    );


    if (closeBtn) {

        closeBtn.addEventListener(
            'click',
            closePanel
        );

    }


    document.addEventListener(
        'click',
        function (event) {

            if (
                panel.classList.contains(
                    'open'
                ) &&
                !panel.contains(
                    event.target
                ) &&
                event.target !== toggle &&
                !toggle.contains(
                    event.target
                )
            ) {

                closePanel();

            }

        }
    );


    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape'
            ) {

                closePanel();

            }

        }
    );


    const body =
        document.body;


    const TEXT_LEVEL_CLASSES = [

        '',

        'a11y-text-lg',

        'a11y-text-xl'

    ];


    const TOGGLE_KEYS = [

        'contrast',

        'grayscale',

        'underline',

        'spacing',

        'motion'

    ];


    const TOGGLE_CLASSES = {

        contrast:
            'a11y-contrast',

        grayscale:
            'a11y-grayscale',

        underline:
            'a11y-underline',

        spacing:
            'a11y-spacing',

        motion:
            'a11y-reduce-motion'

    };


    const toggleBtns = {};


    TOGGLE_KEYS.forEach(
        (key) => {

            toggleBtns[key] =
                panel.querySelector(
                    '[data-a11y="' +
                    key +
                    '"]'
                );

        }
    );


    let textLevel =
        parseInt(
            localStorage.getItem(
                'a11yTextLevel'
            ) || '0',
            10
        ) || 0;


    const toggleState = {};


    TOGGLE_KEYS.forEach(
        (key) => {

            toggleState[key] =
                localStorage.getItem(
                    'a11y_' +
                    key
                ) === 'true';

        }
    );


    const applyState = () => {

        TEXT_LEVEL_CLASSES.forEach(
            (cls) => {

                if (cls) {

                    body.classList.remove(
                        cls
                    );

                }

            }
        );


        if (
            TEXT_LEVEL_CLASSES[
                textLevel
            ]
        ) {

            body.classList.add(
                TEXT_LEVEL_CLASSES[
                    textLevel
                ]
            );

        }


        localStorage.setItem(
            'a11yTextLevel',
            String(textLevel)
        );


        TOGGLE_KEYS.forEach(
            (key) => {

                body.classList.toggle(
                    TOGGLE_CLASSES[key],
                    toggleState[key]
                );


                if (
                    toggleBtns[key]
                ) {

                    toggleBtns[key]
                        .setAttribute(
                            'aria-pressed',
                            String(
                                toggleState[key]
                            )
                        );

                }


                localStorage.setItem(
                    'a11y_' + key,
                    String(
                        toggleState[key]
                    )
                );

            }
        );


        if (
            toggleState.motion
        ) {

            document
                .querySelectorAll(
                    '.carousel'
                )
                .forEach((el) => {

                    if (
                        window.bootstrap &&
                        window.bootstrap.Carousel
                    ) {

                        const inst =
                            window.bootstrap.Carousel
                                .getOrCreateInstance(
                                    el
                                );

                        inst.pause();

                    }

                });

        }

    };


    // ========================================================
    // READ ALOUD
    // ========================================================

    const readBtn =
        panel.querySelector(
            '[data-a11y="read-aloud"]'
        );


    const getPageText = () => {

        const nodes =
            document.querySelectorAll(
                '.page-hero, .content-section, .section, article'
            );


        let text =
            document.title +
            '. ';


        nodes.forEach(
            (n) => {

                text +=
                    n.innerText +
                    '. ';

            }
        );


        return text;

    };


    const stopReading = () => {

        if (
            'speechSynthesis' in window
        ) {

            window.speechSynthesis.cancel();

        }


        if (readBtn) {

            readBtn.setAttribute(
                'aria-pressed',
                'false'
            );

        }

    };


    if (readBtn) {

        readBtn.addEventListener(
            'click',
            function () {

                if (
                    !(
                        'speechSynthesis'
                        in window
                    )
                ) {

                    alert(
                        'Sorry, your browser does not support reading pages aloud.'
                    );

                    return;

                }


                if (
                    readBtn.getAttribute(
                        'aria-pressed'
                    ) === 'true'
                ) {

                    stopReading();

                    return;

                }


                const utterance =
                    new SpeechSynthesisUtterance(
                        getPageText()
                    );


                utterance.rate =
                    0.95;


                utterance.onend =
                    stopReading;


                utterance.onerror =
                    stopReading;


                window.speechSynthesis.cancel();

                window.speechSynthesis.speak(
                    utterance
                );


                readBtn.setAttribute(
                    'aria-pressed',
                    'true'
                );

            }
        );

    }


    panel.addEventListener(
        'click',
        function (event) {

            const btn =
                event.target.closest(
                    '[data-a11y]'
                );


            if (!btn) return;


            switch (
                btn.dataset.a11y
            ) {

                case 'font-inc':

                    textLevel =
                        Math.min(
                            textLevel + 1,
                            TEXT_LEVEL_CLASSES.length - 1
                        );

                    applyState();

                    break;


                case 'font-dec':

                    textLevel =
                        Math.max(
                            textLevel - 1,
                            0
                        );

                    applyState();

                    break;


                case 'contrast':

                case 'grayscale':

                case 'underline':

                case 'spacing':

                case 'motion':

                    toggleState[
                        btn.dataset.a11y
                    ] =
                        !toggleState[
                            btn.dataset.a11y
                        ];

                    applyState();

                    break;


                case 'reset':

                    textLevel = 0;


                    TOGGLE_KEYS.forEach(
                        (key) => {

                            toggleState[key] =
                                false;

                        }
                    );


                    stopReading();

                    applyState();

                    break;

            }

        }
    );


    applyState();

});


// ============================================================
// DONATION SYSTEM
//
// THIS IS THE IMPORTANT PART.
//
// Money:
// form → POST /donate
//      → server creates Stripe Checkout
//      → server returns checkout_url
//      → browser redirects to Stripe
//      → customer pays
//      → Stripe redirects back
//      → frontend verifies payment
//      → success message
//
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const donateForm =
            document.querySelector(
                '.donate-form'
            );


        if (!donateForm) return;


        const presets =
            donateForm.querySelectorAll(
                'input[name="amount-preset"]'
            );


        const amountField =
            donateForm.querySelector(
                'input[name="amount"]'
            );


        const freqOnce =
            donateForm.querySelector(
                '#freq-once'
            );


        const freqMonthly =
            donateForm.querySelector(
                '#freq-monthly'
            );


        // ====================================================
        // AMOUNT PRESETS
        // ====================================================

        const updateForFrequency = () => {

            const isMonthly =
                freqMonthly &&
                freqMonthly.checked;


            presets.forEach(
                (preset) => {

                    const onetime =
                        preset.dataset.onetime;


                    const monthly =
                        preset.dataset.monthly;


                    if (
                        preset.value ===
                        'custom'
                    ) {

                        return;

                    }


                    const newValue =
                        isMonthly
                            ? monthly
                            : onetime;


                    if (
                        newValue ===
                        undefined
                    ) {

                        return;

                    }


                    preset.value =
                        String(
                            newValue
                        );


                    const label =
                        donateForm.querySelector(
                            'label[for="' +
                            preset.id +
                            '"]'
                        );


                    if (label) {

                        label.textContent =
                            '₦' +
                            Number(
                                newValue
                            ).toLocaleString(
                                'en-NG'
                            );

                    }

                }
            );


            if (amountField) {

                amountField.min =
                    isMonthly
                        ? '50000'
                        : '100000';

            }


            const checked =
                donateForm.querySelector(
                    'input[name="amount-preset"]:checked'
                );


            if (
                checked &&
                checked.value !==
                'custom'
            ) {

                amountField.value =
                    checked.value;

            }

        };


        if (
            freqOnce &&
            freqMonthly
        ) {

            freqOnce.addEventListener(
                'change',
                updateForFrequency
            );


            freqMonthly.addEventListener(
                'change',
                updateForFrequency
            );


            updateForFrequency();

        }


        presets.forEach(
            (preset) => {

                preset.addEventListener(
                    'change',
                    function () {

                        if (
                            preset.value ===
                            'custom'
                        ) {

                            amountField.value =
                                '';

                            amountField.focus();

                        } else {

                            amountField.value =
                                preset.value;

                        }

                    }
                );

            }
        );


        if (amountField) {

            amountField.addEventListener(
                'input',
                function () {

                    const value =
                        amountField.value
                            .replace(
                                /[₦,\s]/g,
                                ''
                            );


                    amountField.value =
                        value;


                    presets.forEach(
                        (preset) => {

                            preset.checked =
                                false;

                        }
                    );


                    const matchingPreset =
                        Array.from(
                            presets
                        ).find(
                            (preset) =>
                                preset.value ===
                                value
                        );


                    if (
                        matchingPreset
                    ) {

                        matchingPreset.checked =
                            true;

                    }

                }
            );

        }


        // ====================================================
        // INITIAL AMOUNT
        // ====================================================

        const checkedPreset =
            donateForm.querySelector(
                'input[name="amount-preset"]:checked'
            );


        if (
            checkedPreset &&
            checkedPreset.value !==
            'custom' &&
            amountField
        ) {

            amountField.value =
                checkedPreset.value;

        }


        // ====================================================
        // PAYMENT RESULT
        // ====================================================

        handleDonationResult();


        // ====================================================
        // FORM SUBMISSION
        // ====================================================

        donateForm.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                // Prevent double-click
                if (
                    donateForm.dataset.processing ===
                    'true'
                ) {

                    return;

                }


                donateForm.dataset.processing =
                    'true';


                const submitButton =
                    donateForm.querySelector(
                        'button[type="submit"], input[type="submit"]'
                    );


                const originalButtonText =
                    submitButton
                        ? (
                            submitButton.tagName ===
                            'INPUT'
                                ? submitButton.value
                                : submitButton.textContent
                        )
                        : 'Donate';


                if (submitButton) {

                    if (
                        submitButton.tagName ===
                        'INPUT'
                    ) {

                        submitButton.value =
                            'Connecting to secure checkout...';

                    } else {

                        submitButton.textContent =
                            'Connecting to secure checkout...';

                    }


                    submitButton.disabled =
                        true;

                }


                try {

                    // ==================================================
                    // GET FORM VALUES
                    // ==================================================

                    const formData =
                        new FormData(
                            donateForm
                        );


                    const name =
                        String(
                            formData.get(
                                'name'
                            ) || ''
                        ).trim();


                    const email =
                        String(
                            formData.get(
                                'email'
                            ) || ''
                        ).trim()
                            .toLowerCase();


                    const frequency =
                        String(
                            formData.get(
                                'frequency'
                            ) ||
                            'one-time'
                        ).trim();


                    let amount =
                        String(
                            formData.get(
                                'amount'
                            ) || ''
                        );


                    amount =
                        amount
                            .replace(
                                /[₦,\s]/g,
                                ''
                            )
                            .trim();


                    // ==================================================
                    // GET INSTRUMENTS
                    // ==================================================

                    const instruments =
                        [];


                    donateForm
                        .querySelectorAll(
                            'input[name="instruments"]:checked, select[name="instruments"] option:checked'
                        )
                        .forEach(
                            (input) => {

                                const value =
                                    String(
                                        input.value ||
                                        ''
                                    ).trim();


                                if (value) {

                                    instruments.push(
                                        value
                                    );

                                }

                            }
                        );


                    // ==================================================
                    // VALIDATION
                    // ==================================================

                    if (!name) {

                        throw new Error(
                            'Please enter your full name.'
                        );

                    }


                    if (!email) {

                        throw new Error(
                            'Please enter your email address.'
                        );

                    }


                    const numericAmount =
                        Number(
                            amount
                        );


                    const hasAmount =
                        Number.isFinite(
                            numericAmount
                        ) &&
                        numericAmount > 0;


                    const hasInstrument =
                        instruments.length >
                        0;


                    if (
                        !hasAmount &&
                        !hasInstrument
                    ) {

                        throw new Error(
                            'Please choose a donation amount or select an instrument.'
                        );

                    }


                    // ==================================================
                    // MONTHLY
                    // ==================================================

                    if (
                        frequency ===
                        'monthly'
                    ) {

                        throw new Error(
                            'Monthly donations are not configured yet. Please select One-Time.'
                        );

                    }


                    // ==================================================
                    // BUILD REQUEST
                    // ==================================================

                    const payload = {

                        name,

                        email,

                        amount:
                            hasAmount
                                ? String(
                                    numericAmount
                                )
                                : '',

                        frequency,

                        instruments

                    };


                    console.log(
                        'Sending donation:',
                        payload
                    );


                    // ==================================================
                    // SEND TO NODE SERVER
                    // ==================================================

                    const response =
                        await fetch(
                            '/donate',
                            {

                                method:
                                    'POST',

                                headers: {

                                    'Content-Type':
                                        'application/json',

                                    'Accept':
                                        'application/json'

                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )

                            }
                        );


                    // ==================================================
                    // READ RESPONSE SAFELY
                    // ==================================================

                    const responseText =
                        await response.text();


                    console.log(
                        'Donation server status:',
                        response.status
                    );


                    console.log(
                        'Donation server response:',
                        responseText
                    );


                    let data;


                    try {

                        data =
                            JSON.parse(
                                responseText
                            );

                    } catch (parseError) {

                        console.error(
                            'Server returned non-JSON:',
                            responseText
                        );


                        throw new Error(
                            'The donation server returned an invalid response. Please check that your website is connected to the Node server.'
                        );

                    }


                    // ==================================================
                    // SERVER ERROR
                    // ==================================================

                    if (
                        !response.ok ||
                        data.status ===
                        'error'
                    ) {

                        throw new Error(
                            data.message ||
                            'Unable to process your donation.'
                        );

                    }


                    // ==================================================
                    // PAYMENT DONATION
                    //
                    // THIS IS THE CRITICAL CHECK.
                    //
                    // We DO NOT show success here.
                    //
                    // We redirect to Stripe first.
                    // ==================================================

                    if (
                        data.type ===
                        'payment'
                    ) {

                        if (
                            !data.checkout_url
                        ) {

                            throw new Error(
                                'Stripe Checkout URL was not returned by the server.'
                            );

                        }


                        console.log(
                            'Redirecting to Stripe Checkout:',
                            data.checkout_url
                        );


                        // =================================================
                        // REDIRECT TO STRIPE
                        // =================================================

                        window.location.assign(
                            data.checkout_url
                        );


                        return;

                    }


                    // ==================================================
                    // INSTRUMENT-ONLY DONATION
                    //
                    // This one does NOT require Stripe.
                    // ==================================================

                    if (
                        data.type ===
                        'instrument'
                    ) {

                        showDonationSuccess(
                            data.message ||
                            'Thank you! Your instrument donation details have been received.'
                        );


                        donateForm.reset();


                        return;

                    }


                    throw new Error(
                        'Unexpected response from the donation server.'
                    );


                } catch (error) {

                    console.error(
                        'Donation submission error:',
                        error
                    );


                    showDonationFailure(
                        error.message ||
                        'Something went wrong while processing your donation.'
                    );


                } finally {

                    donateForm.dataset.processing =
                        'false';


                    if (submitButton) {

                        submitButton.disabled =
                            false;


                        if (
                            submitButton.tagName ===
                            'INPUT'
                        ) {

                            submitButton.value =
                                originalButtonText;

                        } else {

                            submitButton.textContent =
                                originalButtonText;

                        }

                    }

                }

            }
        );


        // ============================================================
        // SHOW DONATION MESSAGE
        // ============================================================

        const successCard =
            document.getElementById('donate-success');

        const successClose =
            document.getElementById('donate-success-close');

        const failureCard =
            document.getElementById('donate-failure');

        const failureClose =
            document.getElementById('donate-failure-close');

        const retryButton =
            document.getElementById('donate-retry');

        if (successClose && successCard) {
            successClose.addEventListener('click', () => {
                successCard.hidden = true;
                document.body.classList.remove('donation-modal-open');
            });
        }

        if (failureClose && failureCard) {
            failureClose.addEventListener('click', () => {
                failureCard.hidden = true;
                document.body.classList.remove('donation-modal-open');
            });
        }

        if (retryButton && failureCard) {
            retryButton.addEventListener('click', () => {
                failureCard.hidden = true;
                document.body.classList.remove('donation-modal-open');
                donateForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const firstField = donateForm.querySelector('input, select, textarea');
                if (firstField) firstField.focus({ preventScroll: true });
            });
        }

        function showDonationSuccess(message) {
            if (!successCard) {
                showDonationMessage(message, 'success');
                return;
            }

            const messageElement =
                document.getElementById('donate-success-message');

            if (messageElement) messageElement.textContent = message;
            if (failureCard) failureCard.hidden = true;
            successCard.hidden = false;
            document.body.classList.add('donation-modal-open');
            successClose?.focus({ preventScroll: true });
        }

        function showDonationFailure(message) {
            if (!failureCard) {
                showDonationMessage(message, 'error');
                return;
            }

            const messageElement =
                document.getElementById('donate-failure-message');

            if (messageElement) {
                messageElement.textContent = message;
            }

            if (successCard) successCard.hidden = true;
            failureCard.hidden = false;
            document.body.classList.add('donation-modal-open');
            failureClose?.focus({ preventScroll: true });
        }

        function showDonationMessage(
            message,
            type
        ) {

            let box =
                document.getElementById(
                    'donationMessage'
                );


            if (!box) {

                box =
                    document.createElement(
                        'div'
                    );


                box.id =
                    'donationMessage';


                donateForm.parentNode.insertBefore(
                    box,
                    donateForm
                );

            }


            box.textContent =
                message;


            box.className =
                'donation-message ' +
                (
                    type === 'error'
                        ? 'error'
                        : 'success'
                );


            box.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

        }


        // ============================================================
        // HANDLE STRIPE RETURN
        // ============================================================

        async function handleDonationResult() {

            const params =
                new URLSearchParams(
                    window.location.search
                );


            const payment =
                params.get(
                    'payment'
                );


            const sessionId =
                params.get(
                    'session_id'
                );


            // ========================================================
            // CANCELLED
            // ========================================================

            if (payment === 'cancelled' || payment === 'failed') {

                showDonationFailure(
                    payment === 'cancelled'
                        ? 'Your payment was cancelled and no donation was charged. Please try again when you are ready.'
                        : 'Your payment could not be completed. Please check your payment details and try again.'
                );


                cleanDonationUrl();

                return;

            }


            // ========================================================
            // SUCCESS
            // ========================================================

            if (
                payment !==
                'success' ||
                !sessionId
            ) {

                return;

            }


            showDonationMessage(
                'Verifying your payment...',
                'success'
            );


            try {

                const response =
                    await fetch(
                        '/api/donation-status?session_id=' +
                        encodeURIComponent(
                            sessionId
                        ),
                        {
                            headers: {
                                'Accept':
                                    'application/json'
                            }
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    data.status !==
                    'success'
                ) {

                    throw new Error(
                        data.message ||
                        'Unable to verify payment.'
                    );

                }


                if (
                    data.paid ===
                    true
                ) {

                    showDonationSuccess(
                        'Thank you! Your donation payment was received successfully.',
                    );

                } else {

                    showDonationFailure(
                        'We could not confirm that payment. No donation was charged. Every amount matters, so please try again or contact us if you believe you were charged.'
                    );

                }


                cleanDonationUrl();


            } catch (error) {

                console.error(
                    'Payment verification error:',
                    error
                );


                showDonationFailure(
                    'We could not verify your payment automatically. Please try again. Every amount matters, and please contact us if you believe you were charged.'
                );

            }

        }


        // ============================================================
        // REMOVE SESSION ID FROM ADDRESS BAR
        // ============================================================

        function cleanDonationUrl() {

            try {

                const cleanUrl =
                    window.location.origin +
                    window.location.pathname;


                window.history.replaceState(
                    {},
                    document.title,
                    cleanUrl
                );

            } catch (_) {

                // Ignore browser history errors.
            }

        }

    }
);