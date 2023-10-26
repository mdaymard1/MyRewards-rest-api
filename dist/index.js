"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// const express = require('express');
// var createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const typeorm = require('typeorm');
// import { createConnection } from 'typeorm';
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
var businessRoute = require('./routes/business');
var loyaltyRoute = require('./routes/loyalty');
app.use(logger('dev'));
app.use(express_1.default.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
typeorm.createConnection()
    .then(() => {
    console.log('Connected to database');
})
    .catch((error) => {
    console.log('Error connecting to database:', error);
});
app.get('/business/:id', businessRoute.getBusiness);
app.post('/business', businessRoute.createBusiness);
app.get('/loyalty', loyaltyRoute.getLoyalty);
app.put('/business/:id/loyalty/status', loyaltyRoute.updateLoyatyStatus);
app.listen(port, () => {
    console.log(`Horror movie app is running on port ${port}.`);
});
