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
const cookieParser = require("cookie-parser");
const logger = require("morgan");
// const bodyParser = require('body-parser');
// const typeorm = require('typeorm');
// import { createConnection } from 'typeorm';
dotenv_1.default.config();
appDataSource_1.AppDataSource.initialize()
    .then(() => {
    console.log("Data Source has been initialized");
})
    .catch((err) => {
    console.error("Error during Data Source initialization", err);
});
const app = (0, express_1.default)();
const port = process.env.PORT;
const host = process.env.HOST;
console.log("index.ts using port: " + port + ", host: " + host);
var businessRoute = require("./routes/business");
var userRoute = require("./routes/user");
var loyaltyRoute = require("./routes/loyalty");
var webhookRoute = require("./routes/webhook");
var specialRoute = require("./routes/special");
app.use(logger("dev"));
app.use((0, express_1.json)());
app.use(cookieParser());
app.get("/business", businessRoute.getBusiness);
app.post("/business", businessRoute.createBusiness);
app.put("/business", businessRoute.updateBusiness);
app.get("/business/search", businessRoute.search);
app.get("/user/:userId/loyalty", userRoute.getLoyalty);
app.post("/user/requestVerification", userRoute.requestUserPhoneNumberVerification);
app.post("/user/verifyCode", userRoute.verifyUserCode);
app.get("/locations", businessRoute.getLocations);
app.get("/location/:locationId/details", businessRoute.getLocationDetails);
app.post("/location/:locationId", businessRoute.updateLocation);
app.get("/loyalty", loyaltyRoute.getLoyalty);
app.post("/loyalty/enroll", loyaltyRoute.enrollCustomer);
app.delete("/loyalty/requestEnrollment/:enrollmentRequestId", loyaltyRoute.deleteEnrollmentRequest);
app.get("/loyalty/enrollmentRequests", loyaltyRoute.getEnrollmentRequests);
app.get("/loyalty/customers", loyaltyRoute.getCustomers);
app.post("/loyalty/requestEnrollment", loyaltyRoute.requestEnrollment);
app.post("/loyalty/enrollRequest/:enrollmentRequestId", loyaltyRoute.enrollRequest);
app.post("/loyalty/:loyaltyId", loyaltyRoute.updateLoyalty);
app.put("/loyalty/:loyaltyId/status", loyaltyRoute.updateLoyaltyStatus);
app.post("/webhook", webhookRoute.handleSquareWebhook);
app.get("/special", specialRoute.getSpecials);
app.post("/special", specialRoute.createNewSpecial);
app.post("/special/:specialId", specialRoute.updateSpecial);
app.delete("/special/:specialId", specialRoute.deleteSpecial);
app.listen(port, () => {
    console.log(`My Rewards app is running on port ${port}.`);
});
// app.listen({ port: port, host: host }, () => {
//   console.log(`Horror movie app is running on port ${port}.`);
// });
