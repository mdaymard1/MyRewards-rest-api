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
exports.verifyCodeIsValid = exports.sendSMSVerification = exports.updateUserWithDetails = exports.getUserLoyaltyDetails = exports.getAllLoyaltyAccounts = void 0;
const Utility_1 = require("../utility/Utility");
const appDataSource_1 = require("../../appDataSource");
const AppUser_1 = require("../entity/AppUser");
const Loyalty_1 = require("../entity/Loyalty");
const MerchantService_1 = require("./MerchantService");
const LoyaltyRewardTier_1 = require("../entity/LoyaltyRewardTier");
const getAllLoyaltyAccounts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getAllLoyaltyAccounts");
    try {
        const customerAccounts = yield AppUser_1.AppUser.createQueryBuilder("appUser")
            .innerJoinAndSelect("appUser.customer", "customer")
            .where("appUser.id = :id", { id: userId })
            .getMany();
        return customerAccounts;
    }
    catch (error) {
        console.log("Error thrown in getAllLoyaltyAccounts: " + error);
    }
});
exports.getAllLoyaltyAccounts = getAllLoyaltyAccounts;
const getUserLoyaltyDetails = (businessId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getUserLoyaltyDetails");
    try {
        const loyalty = yield Loyalty_1.Loyalty.createQueryBuilder("loyalty")
            .where("loyalty.businessId = :businessId", { businessId: businessId })
            .getOne();
        if (!loyalty) {
            console.log("loyalty not found");
            return null;
        }
        const loyaltyRewardTiers = yield LoyaltyRewardTier_1.LoyaltyRewardTier.createQueryBuilder("loyaltyRewardTier")
            .where("loyaltyRewardTier.loyaltyId = :loyaltyId", {
            loyaltyId: loyalty.id,
        })
            .getMany();
        const appUser = yield AppUser_1.AppUser.createQueryBuilder("appUser")
            .innerJoinAndSelect("appUser.customer", "customer")
            .where("appUser.id = :id", { id: userId })
            .andWhere("customer.businessId = :businessId", { businessId: businessId })
            .getOne();
        if (appUser) {
            const rewardDetails = (0, MerchantService_1.getAvailableRewardsForLoyaltyBalance)(appUser.customer.balance, loyaltyRewardTiers);
            const userLoyalty = {
                id: appUser.id,
                balance: appUser.customer.balance,
                lifetimePoints: appUser.customer.lifetimePoints,
                enrolledAt: appUser.customer.enrolledAt,
                terminologyOne: loyalty.terminologyOne,
                terminologyMany: loyalty.terminologyMany,
                businessId: appUser.customer.business,
                locationId: appUser.customer.locationId,
                rewardDetails: rewardDetails,
            };
            return userLoyalty;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log("Error thrown in getUserLoyaltyDetails: " + error);
    }
});
exports.getUserLoyaltyDetails = getUserLoyaltyDetails;
const updateUserWithDetails = (ref, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateUserWithDetails");
    return yield updateUser(ref, firstName, lastName, email);
});
exports.updateUserWithDetails = updateUserWithDetails;
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
        if (verifyCheck.status == "approved") {
            console.log("verifyCheck status was approved, upserting user");
            const ref = (0, Utility_1.obsfucatePhoneNumber)(countryCode + phoneNumber);
            return yield upsertUser(ref);
        }
        else {
            console.log("verifyCheck.status was " + verifyCheck.status + ", not upserting user");
            return null;
        }
    }
    catch (error) {
        console.log("Error thrown by verificationChecks.create: " + error);
        return null;
    }
});
exports.verifyCodeIsValid = verifyCodeIsValid;
const upsertUser = (ref) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside upsertUser");
    const currentDate = new Date();
    try {
        const appUser = yield getAppUserByRef(ref);
        if (appUser) {
            console.log("user already exists, updating last updated date");
            yield appDataSource_1.AppDataSource.manager.update(AppUser_1.AppUser, {
                ref: ref,
            }, {
                lastUpdateDate: currentDate,
            });
            return appUser;
        }
        // AppUser not found, so create one
        const newAppUser = appDataSource_1.AppDataSource.manager.create(AppUser_1.AppUser, {
            ref: ref,
            createDate: currentDate,
            lastUpdateDate: currentDate,
        });
        yield appDataSource_1.AppDataSource.manager.save(newAppUser);
        console.log("user was inserted");
        return newAppUser;
    }
    catch (error) {
        console.log("got error when inserting user:" + error);
        return null;
    }
});
const getAppUserByRef = (ref) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getAppUserByRef");
    try {
        const appUser = yield AppUser_1.AppUser.createQueryBuilder("appUser")
            .where("appUser.ref = :ref", {
            ref: ref,
        })
            .getOne();
        console.log("appUser was found");
        return appUser;
    }
    catch (error) {
        console.log("got error when looking up appUser by ref:" + error);
        return null;
    }
});
const updateUser = (ref, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateUser");
    const details = {
        firstName: firstName,
        lastName: lastName,
        email: email,
    };
    const currentDate = new Date();
    try {
        yield appDataSource_1.AppDataSource.manager.update(AppUser_1.AppUser, {
            ref: ref,
        }, {
            userDetails: details,
            lastUpdateDate: currentDate,
        });
        console.log("AppUser details were updated successfully");
        return "success";
    }
    catch (error) {
        console.log("got error when updating user:" + error);
        return null;
    }
});
module.exports = {
    getAllLoyaltyAccounts: exports.getAllLoyaltyAccounts,
    getUserLoyaltyDetails: exports.getUserLoyaltyDetails,
    sendSMSVerification: exports.sendSMSVerification,
    verifyCodeIsValid: exports.verifyCodeIsValid,
    updateUserWithDetails: exports.updateUserWithDetails,
    upsertUser,
};
