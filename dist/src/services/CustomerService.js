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
exports.verifyCodeIsValid = exports.sendSMSVerification = void 0;
const sendSMSVerification = (countryCode, phoneNumber, businessId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside sendSMSVerification");
    const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
        const verify = yield client.verify.v2
            .services(process.env.VERIFY_SERVICE_SID)
            .verifications.create({
            to: `${countryCode}${phoneNumber}`,
            channel: "sms",
        });
        return verify.status;
    }
    catch (error) {
        console.log("Error thrown by verifications.create: " + error);
        return null;
    }
});
exports.sendSMSVerification = sendSMSVerification;
const verifyCodeIsValid = (countryCode, phoneNumber, businessId, code) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside verifyCodeIsValid");
    const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
        const verifyCheck = yield client.verify.v2
            .services(process.env.VERIFY_SERVICE_SID)
            .verificationChecks.create({
            to: `${countryCode}${phoneNumber}`,
            code: `${code}`,
        });
        return verifyCheck.status;
    }
    catch (error) {
        console.log("Error thrown by verificationChecks.create: " + error);
        return null;
    }
});
exports.verifyCodeIsValid = verifyCodeIsValid;
module.exports = {
    sendSMSVerification: exports.sendSMSVerification,
    verifyCodeIsValid: exports.verifyCodeIsValid,
};
