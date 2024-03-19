import express, { json, Express, Request, Response } from "express";
import { AppDataSource } from "./appDataSource";
import dotenv from "dotenv";
// import { json } from 'stream/consumers';

// const express = require('express');
// var createError = require('http-errors');
const cookieParser = require("cookie-parser");
const logger = require("morgan");
// const bodyParser = require('body-parser');

// const typeorm = require('typeorm');

// import { createConnection } from 'typeorm';

dotenv.config();

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

const app: Express = express();
const port = process.env.PORT;
const host = process.env.HOST;

console.log("index.ts using port: " + port + ", host: " + host);

var businessRoute = require("./routes/business");
var customerlRoute = require("./routes/customer");
var loyaltyRoute = require("./routes/loyalty");
var webhookRoute = require("./routes/webhook");
var specialRoute = require("./routes/special");

app.use(logger("dev"));
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

app.get("/business", businessRoute.getBusiness);
app.post("/business", businessRoute.createBusiness);
app.put("/business", businessRoute.updateBusiness);
app.get("/business/search", businessRoute.search);

app.post("/customer/requestVerification", customerlRoute.requestVerification);
app.post("/customer/verifyCode", customerlRoute.verifyCode);

app.get("/locations", businessRoute.getLocations);
app.get("/location/:locationId/details", businessRoute.getLocationDetails);
app.post("/location/:locationId", businessRoute.updateLocation);

app.get("/loyalty", loyaltyRoute.getLoyalty);
app.post("/loyalty/enroll", loyaltyRoute.enrollCustomer);
app.delete(
  "/loyalty/requestEnrollment/:enrollmentRequestId",
  loyaltyRoute.deleteEnrollmentRequest
);
app.get("/loyalty/enrollmentRequests", loyaltyRoute.getEnrollmentRequests);
app.get("/loyalty/customers", loyaltyRoute.getCustomers);
app.post("/loyalty/requestEnrollment", loyaltyRoute.requestEnrollment);
app.post(
  "/loyalty/enrollRequest/:enrollmentRequestId",
  loyaltyRoute.enrollRequest
);
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
