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
const checkJwt_1 = require("./src/middleware/checkJwt");
const asyncHandler_1 = require("./src/middleware/asyncHandler");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
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
/* Business */
// app.post("/business/sendTestPush", businessRoute.testPush);
app.get("/business", [checkJwt_1.checkJwt, (0, asyncHandler_1.asyncHandler)(businessRoute.getBusiness)]);
app.post("/business/refreshToken", (0, asyncHandler_1.asyncHandler)(businessRoute.refreshToken));
app.post("/business", (0, asyncHandler_1.asyncHandler)(businessRoute.createBusiness));
app.post("/business/test", businessRoute.createTestBusiness);
app.post("/business/availability", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(businessRoute.updateAvailability),
]);
app.put("/business", businessRoute.updateBusiness);
app.get("/business/search", (0, asyncHandler_1.asyncHandler)(businessRoute.search));
/* User - called by app */
app.get("/user/:userId/loyalty", (0, asyncHandler_1.asyncHandler)(userRoute.getLoyalty));
app.get("/user/:userId/notificationSettings", (0, asyncHandler_1.asyncHandler)(userRoute.getNotificationSettings));
app.post("/user/:userId/notificationSettings", (0, asyncHandler_1.asyncHandler)(userRoute.updateNotificationSettings));
app.post("/user/:userId/businessNotificationSettings", (0, asyncHandler_1.asyncHandler)(userRoute.updateBusinessNotificationSettings));
app.get("/user/:userId/details", (0, asyncHandler_1.asyncHandler)(userRoute.getDetails));
app.post("/user/:userId/details", (0, asyncHandler_1.asyncHandler)(userRoute.updateDetails));
app.get("/user/:userId/enrolledAndPending", (0, asyncHandler_1.asyncHandler)(userRoute.getEnrolledAndPendingLoyalty));
app.post("/user/requestVerification", (0, asyncHandler_1.asyncHandler)(userRoute.requestUserPhoneNumberVerification));
app.post("/user/verifyCode", (0, asyncHandler_1.asyncHandler)(userRoute.verifyUserCode));
app.get("/user/:userId/favorites", (0, asyncHandler_1.asyncHandler)(userRoute.getFavorites));
app.post("/user/:userId/favorite", (0, asyncHandler_1.asyncHandler)(userRoute.addFavorite));
app.delete("/user/:userId/favorite", (0, asyncHandler_1.asyncHandler)(userRoute.deleteFavorite));
/* Locations */
app.get("/locations", [checkJwt_1.checkJwt, (0, asyncHandler_1.asyncHandler)(businessRoute.getLocations)]);
app.get("/location/:locationId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(businessRoute.getLocation),
]);
app.post("/location/:locationId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(businessRoute.updateLocation),
]);
/* Loyalty and Specials for a Location - called by app */
app.get("/location/:locationId/details", businessRoute.getLocationDetails);
/* Loyalty */
app.get("/loyalty", [checkJwt_1.checkJwt, (0, asyncHandler_1.asyncHandler)(loyaltyRoute.getLoyalty)]);
app.delete("/loyalty/requestEnrollment/:enrollmentRequestId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.deleteEnrollmentRequest),
]);
app.get("/loyalty/enrollmentRequests", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.getEnrollmentRequests),
]);
app.get("/loyalty/customers", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.getCustomers),
]);
app.post("/loyalty/enrollRequest/:enrollmentRequestId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.enrollRequest),
]);
app.post("/loyalty/:loyaltyId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.updateLoyalty),
]);
app.put("/loyalty/:loyaltyId/status", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.updateLoyaltyStatus),
]);
app.get("/loyalty/enrollment/availability", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.getEnrollmentAvailability),
]);
app.post("/loyalty/enrollment/availability", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(loyaltyRoute.updateEnrollmentAvailability),
]);
/* User Enrollment - called by app  */
app.post("/loyalty/enroll", loyaltyRoute.enrollCustomer);
app.post("/loyalty/requestEnrollment", loyaltyRoute.requestEnrollment);
/* Webhook */
app.post("/webhook", webhookRoute.handleSquareWebhook);
/* Specials */
app.get("/special/:specialId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(specialRoute.getSpecial),
]);
app.get("/specials", [checkJwt_1.checkJwt, (0, asyncHandler_1.asyncHandler)(specialRoute.getSpecials)]);
app.post("/special", [checkJwt_1.checkJwt, (0, asyncHandler_1.asyncHandler)(specialRoute.createNewSpecial)]);
app.post("/special/:specialId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(specialRoute.updateSpecial),
]);
app.delete("/special/:specialId", [
    checkJwt_1.checkJwt,
    (0, asyncHandler_1.asyncHandler)(specialRoute.deleteSpecial),
]);
app.listen(port, () => {
    console.log(`My Rewards app is running on port ${port}.`);
});
// app.listen({ port: port, host: host }, () => {
//   console.log(`Horror movie app is running on port ${port}.`);
// });
