const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
    throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file';
}

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

const checkScopes = jwtAuthz(['read:messages']);

app.get('/api/public', function (req, res) {
    res.json({
        message: 'Public X PROJECT'
    });
});

app.get('/api/x_project', checkJwt, function (req, res) {
    try {
        res.json({
            X_PROJECT_response: 'I am your X PROJECT Microservice'
        });
    } catch (e) {
        res.json(e)
    }
});


app.use(function (err, req, res, next) {
    console.error(err.stack);
    return res.status(err.status).json({message: err.message});
});

app.listen(process.env.PORT);
console.log('Listening on http://localhost:' + process.env.PORT);
