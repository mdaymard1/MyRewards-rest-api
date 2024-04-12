"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrolledAndPendingLoyalty = exports.getNotificationSettings = exports.updateNotificationSettings = exports.updateDetails = exports.getDetails = exports.updateBusinessNotificationSettings = exports.addFavorite = exports.deleteFavorite = exports.getFavorites = void 0;
const UserService_1 = require("../src/services/UserService");
const Utility_1 = require("../src/utility/Utility");
const getFavorites = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getFavorites");
    const { userId } = request.params;
    const { idsOnly } = request.query;
    console.log("idsOnly: " + idsOnly);
    if (!userId || !idsOnly) {
        response.status(400);
        response.end();
        return;
    }
    var onlyReturnIds = false;
    if (idsOnly == "true") {
        onlyReturnIds = true;
    }
    response.send(yield (0, UserService_1.getUserFavorites)(userId, onlyReturnIds));
});
exports.getFavorites = getFavorites;
const deleteFavorite = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside deleteFavorite");
    const { userId } = request.params;
    const { locationId } = request.body;
    if (!userId || !locationId) {
        response.status(404);
        response.end();
        return;
    }
    yield (0, UserService_1.deleteUserFavorite)(userId, locationId);
    response.status(200);
    response.end();
});
exports.deleteFavorite = deleteFavorite;
const addFavorite = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside addFavorite");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        response.end();
        return;
    }
    const { locationId } = request.body;
    if (!locationId) {
        response.status(400);
        response.end();
        return;
    }
    const wasSuccessful = yield (0, UserService_1.addUserFavorite)(userId, locationId);
    response.sendStatus(wasSuccessful ? 200 : 404);
    response.end();
});
exports.addFavorite = addFavorite;
const updateBusinessNotificationSettings = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateBusinessNotificationSettings");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        return;
    }
    const { businessId, customerId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges, } = request.body;
    console.log("checking for valid input");
    if (!businessId ||
        !customerId ||
        !(0, Utility_1.isBoolean)(notifyOfRewardChanges) ||
        !(0, Utility_1.isBoolean)(notifyOfPromotionChanges) ||
        !(0, Utility_1.isBoolean)(notifyOfSpecialsChanges)) {
        response.status(400);
        response.end();
        return;
    }
    console.log("calling updateUserBusinessNotificationSettings");
    const notificationPref = yield (0, UserService_1.updateUserBusinessNotificationSettings)(userId, businessId, customerId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges);
    response.sendStatus(200);
    response.end();
});
exports.updateBusinessNotificationSettings = updateBusinessNotificationSettings;
const getDetails = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getDetails");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        return;
    }
    const userDetails = yield (0, UserService_1.getUserDetails)(userId);
    if (userDetails) {
        response.send(userDetails);
    }
    else {
        response.sendStatus(404);
    }
});
exports.getDetails = getDetails;
const updateDetails = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateNotificationSettings");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        return;
    }
    const { firstName, lastName, email } = request.body;
    if (!firstName) {
        response.status(400);
        return;
    }
    const status = yield (0, UserService_1.updateUserDetails)(userId, firstName, lastName, email);
    if (status && status == "success") {
        response.sendStatus(200);
    }
    else {
        response.sendStatus(400);
    }
});
exports.updateDetails = updateDetails;
const updateNotificationSettings = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateNotificationSettings");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        response.end();
        return;
    }
    const { coordinateLatitude, coordinateLongitude, zipCode, notifyOfNewBusinesses, notifyOfMyRewardChanges, notifyOfPointChanges, } = request.body;
    if (!(0, Utility_1.isBoolean)(notifyOfNewBusinesses) ||
        !(0, Utility_1.isBoolean)(notifyOfMyRewardChanges) ||
        !(0, Utility_1.isBoolean)(notifyOfPointChanges)) {
        response.sendStatus(400);
        return;
    }
    const updatedUser = yield (0, UserService_1.updateUserNotificationSettings)(userId, notifyOfNewBusinesses, notifyOfMyRewardChanges, notifyOfPointChanges, coordinateLatitude, coordinateLongitude, zipCode);
    response.sendStatus(201);
});
exports.updateNotificationSettings = updateNotificationSettings;
const getNotificationSettings = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getNotificationSettings");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        response.end();
        return;
    }
    const appUser = yield (0, UserService_1.getUserNotificationSettings)(userId);
    if (appUser) {
        response.send(appUser);
    }
    else {
        response.sendStatus(400);
    }
});
exports.getNotificationSettings = getNotificationSettings;
const getEnrolledAndPendingLoyalty = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getEnrolledAndPendingLoyalty");
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        response.end();
        return;
    }
    const allLoyaltyAccounts = yield (0, UserService_1.getAllLoyaltyAccounts)(userId);
    if (allLoyaltyAccounts) {
        response.send(allLoyaltyAccounts);
    }
    else {
        response.status(400);
    }
    response.end();
});
exports.getEnrolledAndPendingLoyalty = getEnrolledAndPendingLoyalty;
const getLoyalty = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLoyalty");
    const { businessId } = request.query;
    if (!businessId) {
        response.status(400);
        response.end();
        return;
    }
    const { userId } = request.params;
    if (!userId) {
        response.status(400);
        response.end();
        return;
    }
    const userLoyalty = yield (0, UserService_1.getUserLoyaltyDetails)(businessId, userId);
    if (userLoyalty) {
        response.send(userLoyalty);
    }
    else {
        response.status(400);
    }
    response.end();
});
const requestUserPhoneNumberVerification = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside requestCustomerPhoneNumberVerification");
    const { countryCode, phoneNumber } = request.body;
    console.log("countryCode: " + countryCode + ", phoneNumber: " + phoneNumber);
    if (!countryCode || !phoneNumber) {
        response.status(400);
        return;
    }
    //   await sendSMSVerification(countryCode, phoneNumber, businessId);
    const status = yield (0, UserService_1.sendSMSVerification)(countryCode, phoneNumber);
    if (status && status == "pending") {
        response.status(200);
    }
    else {
        response.status(400);
    }
    response.end();
});
const verifyUserCode = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside verifyCode");
    const { countryCode, phoneNumber, code } = request.body;
    if (!countryCode || !phoneNumber || !code) {
        response.status(400);
        response.end();
        return;
    }
    console.log("countryCode: " +
        countryCode +
        ", phoneNumber: " +
        phoneNumber +
        ", code: " +
        code);
    const appUser = yield (0, UserService_1.verifyCodeIsValid)(countryCode, phoneNumber, code);
    if (appUser) {
        const appUserIdResponse = {
            appuserId: appUser.id,
        };
        response.send(appUserIdResponse);
    }
    else {
        response.status(400);
    }
    response.end();
});
module.exports = {
    addFavorite: exports.addFavorite,
    deleteFavorite: exports.deleteFavorite,
    getDetails: exports.getDetails,
    getEnrolledAndPendingLoyalty: exports.getEnrolledAndPendingLoyalty,
    getFavorites: exports.getFavorites,
    getLoyalty,
    getNotificationSettings: exports.getNotificationSettings,
    requestUserPhoneNumberVerification,
    updateBusinessNotificationSettings: exports.updateBusinessNotificationSettings,
    updateDetails: exports.updateDetails,
    updateNotificationSettings: exports.updateNotificationSettings,
    verifyUserCode,
};
