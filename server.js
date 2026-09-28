require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const Stripe = require('stripe');

const app = express();

const PORT = Number(process.env.PORT) || 3001;

const SITE_URL = (
    process.env.SITE_URL ||
    `http://localhost:${PORT}`
).replace(/\/$/, '');


// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const STRIPE_SECRET_KEY =
    process.env.STRIPE_SECRET_KEY;

const STRIPE_PUBLISHABLE_KEY =
    process.env.STRIPE_PUBLISHABLE_KEY;

const STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET;

const GMAIL_USER =
    process.env.GMAIL_USER;

const GMAIL_APP_PASSWORD =
    process.env.GMAIL_APP_PASSWORD;

const DONATION_EMAIL =
    process.env.DONATION_EMAIL;


// ============================================================
// STRIPE
// ============================================================

let stripe = null;

if (STRIPE_SECRET_KEY) {

    stripe = Stripe(STRIPE_SECRET_KEY);

} else {

    console.warn(
        'WARNING: STRIPE_SECRET_KEY is not configured.'
    );

}


// ============================================================
// GMAIL
// ============================================================

let mailer = null;

if (
    GMAIL_USER &&
    GMAIL_APP_PASSWORD
) {

    mailer = nodemailer.createTransport({

        service: 'gmail',

        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
        }

    });

} else {

    console.warn(
        'WARNING: Gmail settings are incomplete.'
    );

}


// ============================================================
// STRIPE WEBHOOK
//
// IMPORTANT:
// This MUST come before express.json()
// ============================================================

app.post(
    '/stripe/webhook',

    express.raw({
        type: 'application/json'
    }),

    async (req, res) => {

        if (!stripe) {

            console.error(
                'Stripe is not configured.'
            );

            return res.sendStatus(500);
        }


        const signature =
            req.headers['stripe-signature'];


        if (!signature) {

            console.error(
                'Missing Stripe signature.'
            );

            return res.sendStatus(400);
        }


        if (!STRIPE_WEBHOOK_SECRET) {

            console.error(
                'STRIPE_WEBHOOK_SECRET is not configured.'
            );

            return res.sendStatus(500);
        }


        let event;


        try {

            event =
                stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    STRIPE_WEBHOOK_SECRET
                );

        } catch (error) {

            console.error(
                'Stripe webhook verification failed:',
                error.message
            );

            return res.sendStatus(400);
        }


        console.log(
            `Stripe webhook received: ${event.type}`
        );


        // ====================================================
        // CHECKOUT COMPLETED
        // ====================================================

        if (
            event.type ===
            'checkout.session.completed'
        ) {

            const session =
                event.data.object;


            if (
                session.payment_status !==
                'paid'
            ) {

                console.log(
                    'Checkout completed but payment is not marked paid.'
                );

                return res.sendStatus(200);
            }


            try {

                const metadata =
                    session.metadata || {};


                const name =
                    cleanText(
                        metadata.name ||
                        'Unknown Donor'
                    );


                const email =
                    cleanText(
                        metadata.email ||
                        session.customer_details?.email ||
                        ''
                    );


                const instruments =
                    normalizeInstruments(
                        metadata.instruments
                    );


                const amount =
                    Number(
                        session.amount_total || 0
                    ) / 100;


                const donationType =
                    instruments.length > 0
                        ? 'Money + Physical Instrument'
                        : 'Money';


                await sendDonationEmail({

                    name,

                    email,

                    amount,

                    instruments,

                    paymentStatus: 'Paid',

                    reference:
                        session.payment_intent ||
                        session.id,

                    donationType

                });


                console.log(
                    'Donation payment confirmed and email sent.'
                );

            } catch (error) {

                console.error(
                    'Error processing successful donation:',
                    error
                );

            }

        }


        return res.sendStatus(200);

    }
);


// ============================================================
// BODY PARSERS
// ============================================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================================
// STATIC WEBSITE
// ============================================================

app.use(
    express.static(
        path.join(__dirname, 'public'),
        {
            extensions: ['html']
        }
    )
);


// ============================================================
// HELPERS
// ============================================================

function cleanText(value) {

    if (
        typeof value !== 'string'
    ) {

        return '';

    }

    return value.trim();

}


function normalizeInstruments(value) {

    if (
        Array.isArray(value)
    ) {

        return value
            .map(item => cleanText(item))
            .filter(Boolean);

    }


    if (
        typeof value === 'string'
    ) {

        try {

            const parsed =
                JSON.parse(value);


            if (
                Array.isArray(parsed)
            ) {

                return parsed
                    .map(item => cleanText(item))
                    .filter(Boolean);

            }

        } catch (_) {

            // Not JSON.
        }


        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);

    }


    return [];

}


function formatNaira(amount) {

    return new Intl.NumberFormat(
        'en-NG',
        {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0
        }
    ).format(amount);

}


// ============================================================
// DONATION EMAIL
// ============================================================

async function sendDonationEmail({

    name,

    email,

    amount = null,

    instruments = [],

    paymentStatus = 'Not applicable',

    reference = '',

    donationType = 'Physical Instrument'

}) {

    if (
        !mailer ||
        !DONATION_EMAIL
    ) {

        console.warn(
            'Gmail is not configured. Email not sent.'
        );

        return;

    }


    const amountText =
        amount !== null &&
        Number.isFinite(amount)
            ? formatNaira(amount)
            : 'None';


    const instrumentText =
        instruments.length > 0
            ? instruments.join(', ')
            : 'None';


    const subject =
        donationType ===
        'Physical Instrument'

            ? 'New Physical Instrument Donation'

            : `New Donation Received - ${amountText}`;


    const text = `
NEW DONATION
========================================

Donation Type:
${donationType}

Donor Name:
${name}

Donor Email:
${email}

Donation Amount:
${amountText}

Instrument(s):
${instrumentText}

Payment Status:
${paymentStatus}

Stripe Reference:
${reference || 'None'}

========================================

This email was generated automatically
by the NGO website.
`;


    await mailer.sendMail({

        from: GMAIL_USER,

        to: DONATION_EMAIL,

        replyTo: email || undefined,

        subject,

        text

    });

}


// ============================================================
// CONTACT EMAIL
// ============================================================

async function sendContactEmail({

    name,

    email,

    message

}) {

    if (
        !mailer ||
        !DONATION_EMAIL
    ) {

        console.warn(
            'Gmail is not configured.'
        );

        return;

    }


    await mailer.sendMail({

        from: GMAIL_USER,

        to: DONATION_EMAIL,

        replyTo: email,

        subject:
            `New Website Contact Message - ${name}`,

        text: `
NEW CONTACT MESSAGE
========================================

Name:
${name}

Email:
${email}

Message:
${message}

========================================
`

    });

}


// ============================================================
// HOME
// ============================================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'index.html'
        )
    );

});


// ============================================================
// DONATE GET
// ============================================================

app.get('/donate', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'donate.html'
        )
    );

});


// ============================================================
// DONATE POST
//
// MONEY DONATION:
//
// POST /donate
//       ↓
// Create Stripe Checkout
//       ↓
// Return checkout_url
//       ↓
// FRONTEND redirects to Stripe
//
// IMPORTANT:
// We do NOT say payment was received here.
// Payment is only confirmed by Stripe/webhook.
// ============================================================

app.post('/donate', async (req, res) => {

    try {

        const donationData =
            req.body && typeof req.body === 'object'
                ? req.body
                : {};

        console.log(
            'Donation request received:',
            donationData
        );


        const name =
            cleanText(
                donationData.name
            );


        const email =
            cleanText(
                donationData.email
            ).toLowerCase();


        const frequency =
            cleanText(
                donationData.frequency ||
                'one-time'
            );


        const instruments =
            normalizeInstruments(
                donationData.instruments
            );


        const amountRaw =
            donationData.amount;


        // ====================================================
        // AMOUNT
        // ====================================================

        let amount = NaN;


        if (
            amountRaw !== undefined &&
            amountRaw !== null
        ) {

            // Handles:
            // 100000
            // "100000"
            // "₦100,000"
            // "100,000"

            const cleanedAmount =
                String(amountRaw)
                    .replace(/[₦,\s]/g, '')
                    .trim();


            if (cleanedAmount !== '') {

                amount =
                    Number(cleanedAmount);

            }

        }


        console.log(
            'Parsed donation amount:',
            amount
        );


        // ====================================================
        // NAME
        // ====================================================

        if (!name) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please enter your full name.'

            });

        }


        // ====================================================
        // EMAIL
        // ====================================================

        if (!email) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please enter your email address.'

            });

        }


        // ====================================================
        // VALIDATE EMAIL
        // ====================================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please enter a valid email address.'

            });

        }


        // ====================================================
        // CHECK DONATION TYPE
        // ====================================================

        const hasAmount =
            Number.isFinite(amount) &&
            amount > 0;


        const hasInstrument =
            instruments.length > 0;


        if (
            !hasAmount &&
            !hasInstrument
        ) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please choose a donation amount or select at least one instrument.'

            });

        }


        // ====================================================
        // INSTRUMENT ONLY
        //
        // This does NOT require Stripe.
        // ====================================================

        if (
            !hasAmount &&
            hasInstrument
        ) {

            await sendDonationEmail({

                name,

                email,

                amount: null,

                instruments,

                paymentStatus:
                    'No payment required',

                reference: '',

                donationType:
                    'Physical Instrument'

            });


            return res.json({

                status: 'success',

                type: 'instrument',

                message:
                    'Thank you! Your instrument donation details have been received.'

            });

        }


        // ====================================================
        // MONTHLY
        // ====================================================

        if (
            frequency === 'monthly'
        ) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Monthly donations are not configured yet. Please select One-Time.'

            });

        }


        // ====================================================
        // VALIDATE MONEY
        // ====================================================

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please enter a valid donation amount.'

            });

        }


        // ====================================================
        // SAFETY LIMIT
        // ====================================================

        if (
            amount > 100000000
        ) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Donation amount is too large.'

            });

        }


        // ====================================================
        // STRIPE
        // ====================================================

        if (!stripe) {

            return res.status(500).json({

                status: 'error',

                message:
                    'Stripe is not configured on the server.'

            });

        }


        // ====================================================
        // STRIPE AMOUNT
        //
        // NGN uses kobo:
        //
        // ₦100,000
        // =
        // 10,000,000 kobo
        // ====================================================

        const stripeAmount =
            Math.round(amount * 100);


        if (
            !Number.isInteger(stripeAmount) ||
            stripeAmount <= 0
        ) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Invalid donation amount.'

            });

        }


        console.log(
            'Stripe amount:',
            stripeAmount
        );


        // ====================================================
        // METADATA
        // ====================================================

        const metadata = {

            name,

            email,

            instruments:
                JSON.stringify(
                    instruments
                ),

            donation_type:
                hasInstrument
                    ? 'Money + Physical Instrument'
                    : 'Money',

            frequency

        };


        // ====================================================
        // CREATE STRIPE CHECKOUT SESSION
        // ====================================================

        const session =
            await stripe.checkout.sessions.create({

                mode: 'payment',

                customer_email:
                    email,

                line_items: [

                    {

                        price_data: {

                            currency: 'ngn',

                            product_data: {

                                name:
                                    hasInstrument

                                        ? 'NGO Donation + Physical Instrument'

                                        : 'NGO Donation'

                            },

                            unit_amount:
                                stripeAmount

                        },

                        quantity: 1

                    }

                ],

                metadata,

                payment_intent_data: {

                    metadata

                },

                success_url:
                    `${SITE_URL}/donate?payment=success&session_id={CHECKOUT_SESSION_ID}`,

                cancel_url:
                    `${SITE_URL}/donate?payment=cancelled`

            });


        console.log(
            'Stripe Checkout created:',
            session.id
        );


        // ====================================================
        // CRITICAL
        //
        // DO NOT SEND A "PAYMENT RECEIVED" MESSAGE.
        //
        // We only return the Stripe checkout URL.
        // The frontend must redirect there.
        // ====================================================

        return res.status(200).json({

            status: 'checkout',

            type: 'payment',

            checkout_url:
                session.url,

            session_id:
                session.id

        });


    } catch (error) {

        console.error(
            'DONATION ERROR:',
            error
        );


        return res.status(500).json({

            status: 'error',

            message:
                error?.message ||
                'We could not create the Stripe checkout session.'

        });

    }

});


// ============================================================
// PAYMENT STATUS
//
// Frontend can use this to verify the session after Stripe
// redirects the donor back.
// ============================================================

app.get(
    '/api/donation-status',
    async (req, res) => {

        try {

            if (!stripe) {

                return res.status(500).json({

                    status: 'error',

                    message:
                        'Stripe is not configured.'

                });

            }


            const sessionId =
                cleanText(
                    req.query.session_id
                );


            if (!sessionId) {

                return res.status(400).json({

                    status: 'error',

                    message:
                        'Missing Stripe session ID.'

                });

            }


            const session =
                await stripe.checkout.sessions.retrieve(
                    sessionId
                );


            return res.json({

                status: 'success',

                payment_status:
                    session.payment_status,

                session_status:
                    session.status,

                paid:
                    session.payment_status === 'paid'

            });


        } catch (error) {

            console.error(
                'Donation status error:',
                error
            );


            return res.status(500).json({

                status: 'error',

                message:
                    'Unable to verify payment.'

            });

        }

    }
);


// ============================================================
// CONTACT
// ============================================================

app.get('/contact', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'contact.html'
        )
    );

});


app.post('/contact', async (req, res) => {

    try {

        const name =
            cleanText(
                req.body.name
            );


        const email =
            cleanText(
                req.body.email
            );


        const message =
            cleanText(
                req.body.message
            );


        if (!name || !email || !message) {

            return res.status(400).json({

                status: 'error',

                message:
                    'Please complete all fields.'

            });

        }


        await sendContactEmail({

            name,

            email,

            message

        });


        return res.json({

            status: 'ok',

            message:
                'Your message has been sent successfully.'

        });


    } catch (error) {

        console.error(
            'Contact error:',
            error
        );


        return res.status(500).json({

            status: 'error',

            message:
                'We could not send your message right now.'

        });

    }

});


// ============================================================
// APPLY
// ============================================================

app.post('/apply', async (req, res) => {

    try {

        const name =
            cleanText(
                req.body.name
            );


        const email =
            cleanText(
                req.body.email
            );


        const message =
            cleanText(
                req.body.message ||
                'Volunteer/application submission'
            );


        if (
            mailer &&
            DONATION_EMAIL
        ) {

            await mailer.sendMail({

                from: GMAIL_USER,

                to: DONATION_EMAIL,

                replyTo:
                    email || undefined,

                subject:
                    'New Application / Volunteer Submission',

                text: `
NEW APPLICATION / VOLUNTEER SUBMISSION
========================================

Name:
${name}

Email:
${email}

Details:
${message}

========================================
`

            });

        }


        return res.json({

            status: 'ok',

            message:
                'Application received.'

        });


    } catch (error) {

        console.error(
            'Application error:',
            error
        );


        return res.status(500).json({

            status: 'error',

            message:
                'Could not submit application.'

        });

    }

});


// ============================================================
// LINKS
// ============================================================

app.get('/links', (req, res) => {

    res.json([

        {
            path: '/',
            name: 'Home',
            method: 'GET'
        },

        {
            path: '/donate',
            name: 'Donate',
            method: 'GET/POST'
        },

        {
            path: '/contact',
            name: 'Contact',
            method: 'GET/POST'
        },

        {
            path: '/apply',
            name: 'Apply',
            method: 'POST'
        }

    ]);

});


// ============================================================
// 404
// ============================================================

app.use((req, res) => {

    res.status(404).json({

        status: 'error',

        message:
            'Endpoint not found.'

    });

});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {

    console.error(
        'Unhandled server error:',
        error
    );


    if (res.headersSent) {

        return next(error);

    }


    res.status(500).json({

        status: 'error',

        message:
            'Internal server error.'

    });

});


// ============================================================
// START
// ============================================================

app.listen(
    PORT,
    () => {

        console.log('');
        console.log('========================================');
        console.log('NGO SERVER STARTED');
        console.log('========================================');

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            `SITE_URL: ${SITE_URL}`
        );

        console.log(
            `Stripe: ${
                STRIPE_SECRET_KEY
                    ? 'configured'
                    : 'NOT configured'
            }`
        );

        console.log(
            `Gmail: ${
                mailer
                    ? 'configured'
                    : 'NOT configured'
            }`
        );

        console.log(
            '========================================'
        );

    }
);