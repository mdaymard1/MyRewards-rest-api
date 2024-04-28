import express, { json, Express, Request, Response } from "express";
import { AppDataSource } from "./appDataSource";
import dotenv from "dotenv";
import { checkJwt } from "./src/middleware/checkJwt";
import { asyncHandler } from "./src/middleware/asyncHandler";
import { getMerchantEnvironment } from "./src/utility/Utility";
import bodyParser from "body-parser";

const cookieParser = require("cookie-parser");
const logger = require("morgan");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
var userRoute = require("./routes/user");
var loyaltyRoute = require("./routes/loyalty");
var webhookRoute = require("./routes/webhook");
var specialRoute = require("./routes/special");

app.use(logger("dev"));
app.use(json());
app.use(cookieParser());

/* Business */
// app.post("/business/sendTestPush", businessRoute.testPush);

app.get("/business", [checkJwt, asyncHandler(businessRoute.getBusiness)]);
app.post("/business/refreshToken", asyncHandler(businessRoute.refreshToken));
app.post("/business", asyncHandler(businessRoute.createBusiness));
app.post("/business/test", businessRoute.createTestBusiness);
app.post("/business/availability", [
  checkJwt,
  asyncHandler(businessRoute.updateAvailability),
]);
app.put("/business", businessRoute.updateBusiness);

app.get("/business/search", asyncHandler(businessRoute.search));
app.post("/user/verifyCode", asyncHandler(userRoute.verifyUserCode));

/* User - called by app */
app.post(
  "/user/requestVerification",
  asyncHandler(userRoute.requestUserPhoneNumberVerification)
);
app.get("/user/:userId/loyalty", asyncHandler(userRoute.getLoyalty));

app.get(
  "/user/:userId/notificationSettings",
  asyncHandler(userRoute.getNotificationSettings)
);
app.post(
  "/user/:userId/notificationSettings",
  asyncHandler(userRoute.updateNotificationSettings)
);
app.post(
  "/user/:userId/businessNotificationSettings",
  asyncHandler(userRoute.updateBusinessNotificationSettings)
);
app.get("/user/:userId/details", asyncHandler(userRoute.getDetails));
app.post("/user/:userId/details", asyncHandler(userRoute.updateDetails));
app.get(
  "/user/:userId/enrolledAndPending",
  asyncHandler(userRoute.getEnrolledAndPendingLoyalty)
);
app.get("/user/:userId/favorites", asyncHandler(userRoute.getFavorites));
app.post("/user/:userId/favorite", asyncHandler(userRoute.addFavorite));
app.delete("/user/:userId/favorite", asyncHandler(userRoute.deleteFavorite));

/* Locations */

/* Loyalty and Specials for a Location - called by app */
app.get(
  "/location/:locationId/details",
  asyncHandler(businessRoute.getLocationDetails)
);

app.get("/locations", [checkJwt, asyncHandler(businessRoute.getLocations)]);
app.get("/location/:locationId", [
  checkJwt,
  asyncHandler(businessRoute.getLocation),
]);
app.post("/location/:locationId", [
  checkJwt,
  asyncHandler(businessRoute.updateLocation),
]);

/* Loyalty */
app.get("/loyalty", [checkJwt, asyncHandler(loyaltyRoute.getLoyalty)]);
app.delete("/loyalty/requestEnrollment/:enrollmentRequestId", [
  checkJwt,
  asyncHandler(loyaltyRoute.deleteEnrollmentRequest),
]);
app.get("/loyalty/enrollmentRequests", [
  checkJwt,
  asyncHandler(loyaltyRoute.getEnrollmentRequests),
]);
app.get("/loyalty/customers", [
  checkJwt,
  asyncHandler(loyaltyRoute.getCustomers),
]);
app.post("/loyalty/enrollRequest/:enrollmentRequestId", [
  checkJwt,
  asyncHandler(loyaltyRoute.enrollRequest),
]);
app.get("/loyalty/enrollment/availability", [
  checkJwt,
  asyncHandler(loyaltyRoute.getEnrollmentAvailability),
]);
app.post("/loyalty/enrollment/availability", [
  checkJwt,
  asyncHandler(loyaltyRoute.updateEnrollmentAvailability),
]);

/* User Enrollment - called by app  */
app.post("/loyalty/enroll", asyncHandler(loyaltyRoute.enrollCustomer));
app.post(
  "/loyalty/requestEnrollment",
  asyncHandler(loyaltyRoute.requestEnrollment)
);

app.post("/loyalty/:loyaltyId", [
  checkJwt,
  asyncHandler(loyaltyRoute.updateLoyalty),
]);
app.put("/loyalty/:loyaltyId/status", [
  checkJwt,
  asyncHandler(loyaltyRoute.updateLoyaltyStatus),
]);

/* Webhook */
app.post("/webhook", webhookRoute.handleSquareWebhook);

/* Specials */
app.get("/specials", [checkJwt, asyncHandler(specialRoute.getSpecials)]);
app.post("/special", [checkJwt, asyncHandler(specialRoute.createNewSpecial)]);
app.post("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.updateSpecial),
]);
app.get("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.getSpecial),
]);
app.delete("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.deleteSpecial),
]);

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Reward Me! Express API with Swagger",
      version: "0.1.0",
      description:
        "This is Reward Me! API application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "LogRocket",
        url: "https://logrocket.com",
        email: "info@email.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5004",
      },
    ],
  },
  apis: ["./routes/*.js"],
};
const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

app.listen(port, () => {
  console.log(`My Rewards app is running on port ${port}.`);
  const env = getMerchantEnvironment();
  console.log("Square is pointing to: " + env);
});
// app.listen({ port: port, host: host }, () => {
//   console.log(`Horror movie app is running on port ${port}.`);
// });
