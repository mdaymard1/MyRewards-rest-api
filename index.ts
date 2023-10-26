import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

// const express = require('express');
// var createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');

const typeorm = require('typeorm');

// import { createConnection } from 'typeorm';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

var businessRoute = require('./routes/business');
var loyaltyRoute = require('./routes/loyalty');

app.use(logger('dev'));
app.use(express.json());

app.use(bodyParser.urlencoded(
  { extended: false }
));
app.use(bodyParser.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

typeorm.createConnection()
  .then(() => {
    console.log('Connected to database');
  })
  .catch((error: any) => {
    console.log('Error connecting to database:', error);
  });

app.get('/business/:id', businessRoute.getBusiness);
app.post('/business', businessRoute.createBusiness);
app.get('/loyalty', loyaltyRoute.getLoyalty);
app.put('/business/:id/loyalty/status', loyaltyRoute.updateLoyatyStatus);
app.listen(port, () => {
  console.log(`Horror movie app is running on port ${port}.`);
});
