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
exports.getEnrolledAndPendingLoyalty = void 0;
const BusinessService_1 = require("../src/services/BusinessService");
const UserService_1 = require("../src/services/UserService");
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
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
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
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        response.end();
        return;
    }
    const { countryCode, phoneNumber } = request.body;
    console.log("countryCode: " + countryCode + ", phoneNumber: " + phoneNumber);
    //   await sendSMSVerification(countryCode, phoneNumber, businessId);
    const status = yield (0, UserService_1.sendSMSVerification)(countryCode, phoneNumber, businessId);
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
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        response.end();
        return;
    }
    const { countryCode, phoneNumber, code } = request.body;
    console.log("countryCode: " +
        countryCode +
        ", phoneNumber: " +
        phoneNumber +
        ", code: " +
        code);
    const appUser = yield (0, UserService_1.verifyCodeIsValid)(countryCode, phoneNumber, businessId, code);
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
    getEnrolledAndPendingLoyalty: exports.getEnrolledAndPendingLoyalty,
    getLoyalty,
    requestUserPhoneNumberVerification,
    verifyUserCode,
};
