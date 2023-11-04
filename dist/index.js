"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const appDataSource_1 = require("./appDataSource");
const dotenv_1 = __importDefault(require("dotenv"));
// import { json } from 'stream/consumers';
// const express = require('express');
// var createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const bodyParser = require('body-parser');
// const typeorm = require('typeorm');
// import { createConnection } from 'typeorm';
dotenv_1.default.config();
appDataSource_1.AppDataSource.initialize()
    .then(() => {
    console.log('Data Source has been initialized');
})
    .catch((err) => {
    console.error('Error during Data Source initialization', err);
});
const app = (0, express_1.default)();
const port = process.env.PORT;
const host = process.env.HOST;
console.log('index.ts using port: ' + port + ', host: ' + host);
var businessRoute = require('./routes/business');
var loyaltyRoute = require('./routes/loyalty');
var webhookRoute = require('./routes/webhook');
app.use(logger('dev'));
// app.use(express.json());
app.use((0, express_1.json)());
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
