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
const BusinessService_1 = require("../src/services/BusinessService");
const CustomerService_1 = require("../src/services/CustomerService");
const requestVerification = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside requestCustomerVerification");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        response.end();
        return;
    }
    const { countryCode, phoneNumber } = request.body;
    console.log("countryCode: " + countryCode + ", phoneNumber: " + phoneNumber);
    //   await sendSMSVerification(countryCode, phoneNumber, businessId);
    const status = yield (0, CustomerService_1.sendSMSVerification)(countryCode, phoneNumber, businessId);
    if (status && status == "pending") {
        response.status(200);
    }
    else {
        response.status(400);
    }
    response.end();
});
const verifyCode = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside verifyCode");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
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
    const status = yield (0, CustomerService_1.verifyCodeIsValid)(countryCode, phoneNumber, businessId, code);
    if (status && status == "approved") {
        response.status(200);
    }
    else {
        response.status(400);
    }
    response.end();
});
module.exports = {
    requestVerification,
    verifyCode,
};
