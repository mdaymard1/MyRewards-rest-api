import express, { json, Express, Request, Response } from 'express';
import { AppDataSource } from './appDataSource';
import dotenv from 'dotenv';
// import { json } from 'stream/consumers';

// const express = require('express');
// var createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const bodyParser = require('body-parser');

// const typeorm = require('typeorm');

// import { createConnection } from 'typeorm';

dotenv.config();

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

const app: Express = express();
const port = process.env.PORT;
const host = process.env.HOST;

console.log('index.ts using port: ' + port + ', host: ' + host);

var businessRoute = require('./routes/business');
var loyaltyRoute = require('./routes/loyalty');
var webhookRoute = require('./routes/webhook');

app.use(logger('dev'));
// app.use(express.json());
app.use(json());

// app.use(bodyParser.urlencoded(
//   { extended: false }
// ));
// app.use(bodyParser.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// typeorm.createConnection()
//   .then(() => {
//     console.log('Connected to database');
//   })
//   .catch((error: any) => {
//     console.log('Error connecting to database:', error);
//   });

app.get('/business', businessRoute.getBusiness);
app.post('/business', businessRoute.createBusiness);
app.get('/loyalty', loyaltyRoute.getLoyalty);
app.post('/loyalty/:loyaltyId', loyaltyRoute.updateLoyalty);
app.put('/loyalty/:loyaltyId/status', loyaltyRoute.updateLoyaltyStatus);
app.post('/webhook', webhookRoute.handleSquareWebhook);
app.listen(port, () => {
  console.log(`Horror movie app is running on port ${port}.`);
});
// app.listen({ port: port, host: host }, () => {
//   console.log(`Horror movie app is running on port ${port}.`);
// });
