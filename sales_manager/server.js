const express = require('express');
const app = express();
const axios = require('axios').default;
const fetch = require("node-fetch");
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const request = require('request');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
    throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file';
}

const checkScopes = jwtAuthz(['read:api']);

const corsOptions = {
    origin: 'http://localhost:' + process.env.PORT
};

app.use(cors(corsOptions));

const checkJwt = jwt({
    // Dynamically provide a signing key based on the [Key ID](https://tools.ietf.org/html/rfc7515#section-4.1.4) header parameter ("kid") and the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

app.get('/api/public', function (req, res) {
    res.json({
        message: 'Public SALES MANAGER',
        else: 'SOMETHING ELSE',
        scope: checkScopes
    });
});

async function getDataFromDMS() {
    const config = {
        headers: {
            'Authorization': 'Bearer ' + process.env.TOKEN
        }
    };

    let response = await fetch('http://localhost:2222/api/dms', config);

    if (response.err) {
        console.log('error');
    } else {
        const data = response.json();
        return data;
    }
}

async function getDataFromXPROJECT() {
    try {
        const config = {
            headers: {
                'Authorization': 'Bearer ' + process.env.TOKEN
            }
        };

        let response = await fetch('http://localhost:3333/api/x_project', config);

        if (response.err) {
            console.log('error');
        } else {
            const data = response.json();
            return data;
        }
    } catch (e) {
        return {ERROR: 'X PROJECT IST OFFLINE'};
    }
}


app.get('/api/communicate', checkJwt, async function (req, res) {
    const myData = {
        dms: await getDataFromDMS(),
        x_project: await getDataFromXPROJECT(),
        sales_manager: 'WE ARE IN SALES MANAGER'
    };

    res.json(myData);
});

app.get('/api/scope', checkJwt, checkScopes, function (req, res) {
    res.json({
        message: 'You can read this because you have SCOPE -> read:api'
    });
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    return res.status(err.status).json({message: err.message});
});

app.listen(process.env.PORT);

console.info('Listening on http://localhost:' + process.env.PORT);
