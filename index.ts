import express, { json, Express, Request, Response } from "express";
import { AppDataSource } from "./appDataSource";
import dotenv from "dotenv";
import { checkJwt } from "./src/middleware/checkJwt";
import { asyncHandler } from "./src/middleware/asyncHandler";

const cookieParser = require("cookie-parser");
const logger = require("morgan");

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

/* User - called by app */
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
app.post(
  "/user/requestVerification",
  asyncHandler(userRoute.requestUserPhoneNumberVerification)
);
app.post("/user/verifyCode", asyncHandler(userRoute.verifyUserCode));

/* Locations */
app.get("/locations", [checkJwt, asyncHandler(businessRoute.getLocations)]);
app.get("/location/:locationId", [
  checkJwt,
  asyncHandler(businessRoute.getLocation),
]);
app.post("/location/:locationId", [
  checkJwt,
  asyncHandler(businessRoute.updateLocation),
]);

/* Loyalty and Specials for a Location - called by app */
app.get("/location/:locationId/details", businessRoute.getLocationDetails);

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
app.post("/loyalty/:loyaltyId", [
  checkJwt,
  asyncHandler(loyaltyRoute.updateLoyalty),
]);
app.put("/loyalty/:loyaltyId/status", [
  checkJwt,
  asyncHandler(loyaltyRoute.updateLoyaltyStatus),
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
app.post("/loyalty/enroll", loyaltyRoute.enrollCustomer);
app.post("/loyalty/requestEnrollment", loyaltyRoute.requestEnrollment);

/* Webhook */
app.post("/webhook", webhookRoute.handleSquareWebhook);

/* Specials */
app.get("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.getSpecial),
]);
app.get("/specials", [checkJwt, asyncHandler(specialRoute.getSpecials)]);
app.post("/special", [checkJwt, asyncHandler(specialRoute.createNewSpecial)]);
app.post("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.updateSpecial),
]);
app.delete("/special/:specialId", [
  checkJwt,
  asyncHandler(specialRoute.deleteSpecial),
]);

app.listen(port, () => {
  console.log(`My Rewards app is running on port ${port}.`);
});
// app.listen({ port: port, host: host }, () => {
//   console.log(`Horror movie app is running on port ${port}.`);
// });
