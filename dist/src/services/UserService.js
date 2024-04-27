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
exports.verifyCodeIsValid = exports.sendSMSVerification = exports.updateUserWithDetails = exports.getUserLoyaltyDetails = exports.getAllLoyaltyAccounts = exports.getUserNotificationSettings = exports.updateUserNotificationSettings = exports.updateUserDetails = exports.getUserDetails = exports.insertCustomerNotificationPreference = exports.updateUserBusinessNotificationSettings = exports.addUserFavorite = exports.deleteUserFavorite = exports.getUserFavorites = void 0;
const Utility_1 = require("../utility/Utility");
const appDataSource_1 = require("../../appDataSource");
const User_1 = require("../entity/User");
const Customer_1 = require("../entity/Customer");
const Favorite_1 = require("../entity/Favorite");
const Loyalty_1 = require("../entity/Loyalty");
const Location_1 = require("../entity/Location");
const MerchantService_1 = require("./MerchantService");
const LoyaltyRewardTier_1 = require("../entity/LoyaltyRewardTier");
const EnrollmentRequest_1 = require("../entity/EnrollmentRequest");
const CustomerNotificationPreference_1 = require("../entity/CustomerNotificationPreference");
const typeorm_1 = require("typeorm");
const getUserFavorites = (userId, idsOnly) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getUserFavorite with idsonly: " + idsOnly);
    if (idsOnly) {
        const favoriteIds = yield Favorite_1.Favorite.createQueryBuilder("favorite")
            .where("favorite.appUserId = :userId", { userId: userId })
            .getMany();
        return favoriteIds;
    }
    else {
        const query = `SELECT "favorite"."id" AS "favoriteId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."timezone" AS "timezone", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", "location"."businessId" AS "businessId", "location"."id" AS "locationId", ST_ASTEXT("locationPoint") as "locationpoint" FROM "favorite" "favorite" INNER JOIN "location" "location" ON "location"."id"="favorite"."locationId" WHERE "favorite"."appUserId" = '${userId}'`;
        const favorites = yield Location_1.Location.query(query);
        console.log("favorites: " + favorites);
        return favorites;
    }
});
exports.getUserFavorites = getUserFavorites;
const deleteUserFavorite = (userId, locationId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside deleteUserFavorite");
    yield appDataSource_1.AppDataSource.manager.delete(Favorite_1.Favorite, {
        appUserId: userId,
        locationId: locationId,
    });
    return;
});
exports.deleteUserFavorite = deleteUserFavorite;
const addUserFavorite = (userId, locationId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateUserBusinessNotificationSettings");
    // Make sure userId is valid
    const user = yield User_1.User.createQueryBuilder("user")
        .where("user.id = :userId", { userId: userId })
        .getOne();
    if (!user) {
        return false;
    }
    try {
        const favorite = appDataSource_1.AppDataSource.manager.create(Favorite_1.Favorite, {
            appUserId: userId,
            locationId: locationId,
        });
        yield appDataSource_1.AppDataSource.manager.save(favorite);
        if (favorite) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        if (error instanceof typeorm_1.QueryFailedError &&
            error.message.includes("appUser_locationId_id_UNIQUE")) {
            console.log("Ignoring duplicate favorite error");
            return true;
        }
        return false;
    }
});
exports.addUserFavorite = addUserFavorite;
const updateUserBusinessNotificationSettings = (userId, businessId, customerId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateUserBusinessNotificationSettings");
    const notificationPref = yield CustomerNotificationPreference_1.CustomerNotificationPreference.createQueryBuilder("notificationPref")
        .where("notificationPref.appUserId = :userId", { userId: userId })
        .andWhere("notificationPref.businessId = :businessId", {
        businessId: businessId,
    })
        .getOne();
    if (notificationPref) {
        return updateCustomerNotificationPreference(notificationPref.id, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges);
    }
    else {
        return (0, exports.insertCustomerNotificationPreference)(userId, businessId, customerId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges);
    }
});
exports.updateUserBusinessNotificationSettings = updateUserBusinessNotificationSettings;
const insertCustomerNotificationPreference = (userId, businessId, customerId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside insertCustomerNotificationPreference");
    try {
        const notificationPref = appDataSource_1.AppDataSource.manager.create(CustomerNotificationPreference_1.CustomerNotificationPreference, {
            appUserId: userId,
            businessId: businessId,
            customerId: customerId,
            notifyOfRewardChanges: notifyOfRewardChanges,
            notifyOfPromotionChanges: notifyOfPromotionChanges,
            notifyOfSpecialsChanges: notifyOfSpecialsChanges,
        });
        yield appDataSource_1.AppDataSource.manager.save(notificationPref);
        console.log("notificationPref created");
        return notificationPref;
    }
    catch (error) {
        // customer pref already exists, so we can ignore this error
        return null;
    }
});
exports.insertCustomerNotificationPreference = insertCustomerNotificationPreference;
const updateCustomerNotificationPreference = (notificationPrefId, notifyOfRewardChanges, notifyOfPromotionChanges, notifyOfSpecialsChanges) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateCustomerNotificationPreference");
    const updatedPref = yield appDataSource_1.AppDataSource.manager.update(CustomerNotificationPreference_1.CustomerNotificationPreference, {
        id: notificationPrefId,
    }, {
        notifyOfRewardChanges: notifyOfRewardChanges,
        notifyOfPromotionChanges: notifyOfPromotionChanges,
        notifyOfSpecialsChanges: notifyOfSpecialsChanges,
    });
    return updatedPref;
});
const getUserDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getUserDetails");
    const user = yield User_1.User.createQueryBuilder("appUser")
        .where("appUser.id = :id", { id: userId })
        .getOne();
    var userDetails;
    if (user === null || user === void 0 ? void 0 : user.userDetails) {
        userDetails = JSON.parse(JSON.stringify(user.userDetails));
        console.log("userDetails: " + userDetails);
    }
    if (userDetails) {
        const details = {
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            email: userDetails.email,
            notifyOfMyRewardChanges: user === null || user === void 0 ? void 0 : user.notifyOfMyRewardChanges,
        };
        return details;
    }
    else {
        return null;
    }
});
exports.getUserDetails = getUserDetails;
const updateUserDetails = (userId, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateUserDetails");
    const user = yield User_1.User.createQueryBuilder("appUser")
        .where("appUser.id = :id", { id: userId })
        .getOne();
    if (user) {
        return yield (0, exports.updateUserWithDetails)(user.ref, firstName, lastName, email);
    }
    else {
        return null;
    }
});
exports.updateUserDetails = updateUserDetails;
const updateUserNotificationSettings = (appUserId, notifyOfNewBusinesses, notifyOfMyRewardChanges, notifyOfPointChanges, coordinateLatitude, coordinateLongitude, zipCode) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getUserNotificationSettings");
    var locationPoint;
    if (coordinateLatitude && coordinateLongitude) {
        locationPoint = {
            type: "Point",
            coordinates: [coordinateLongitude, coordinateLatitude],
        };
    }
    const updatedUser = yield appDataSource_1.AppDataSource.manager.update(User_1.User, {
        id: appUserId,
    }, {
        notifyOfNewBusinesses: notifyOfNewBusinesses,
        notifyOfMyRewardChanges: notifyOfMyRewardChanges,
        notifyOfPointChanges: notifyOfPointChanges,
        locationPoint: locationPoint,
        zipCode: zipCode,
    });
    return;
});
exports.updateUserNotificationSettings = updateUserNotificationSettings;
const getUserNotificationSettings = (appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("inside getUserNotificationSettings");
    const appUser = yield User_1.User.createQueryBuilder("appUser")
        .where("appUser.id = :id", { id: appUserId })
        .getOne();
    var latitude;
    var longitude;
    if (appUser === null || appUser === void 0 ? void 0 : appUser.locationPoint) {
        var locationPoint;
        locationPoint = JSON.parse(JSON.stringify(appUser.locationPoint));
        console.log("locationPoint: " + locationPoint);
        if (locationPoint && locationPoint.coordinates.length == 2) {
            latitude = locationPoint.coordinates[1];
            longitude = locationPoint.coordinates[0];
        }
    }
    if (appUser) {
        const settings = {
            latitude: latitude,
            longitude: longitude,
            notifyOfNewBusinesses: (_a = appUser.notifyOfNewBusinesses) !== null && _a !== void 0 ? _a : false,
            notifyOfMyRewardChanges: (_b = appUser.notifyOfMyRewardChanges) !== null && _b !== void 0 ? _b : false,
            notifyOfPointChanges: (_c = appUser.notifyOfPointChanges) !== null && _c !== void 0 ? _c : false,
            zipCode: appUser.zipCode,
        };
        return settings;
    }
    return null;
});
exports.getUserNotificationSettings = getUserNotificationSettings;
const getAllLoyaltyAccounts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getAllLoyaltyAccounts");
    try {
        const enrolledLocations = yield Location_1.Location.query(`SELECT "customer"."balance" AS "balance", "customer"."lifetimePoints" AS "lifetimePoints", "customer"."enrolledAt" AS "enrolledAt", "customer"."id" AS "customerId", "location"."businessId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "location"."timezone" AS "timezone", "location"."timezone" AS "timezone", "location"."id" AS "locationId", "loyalty"."terminologyOne" as "terminologyOne", "loyalty"."terminologyMany" as "terminologyMany", "customerNotificationPreference"."notifyOfRewardChanges", "customerNotificationPreference"."notifyOfPromotionChanges", "customerNotificationPreference"."notifyOfSpecialsChanges" FROM "customer" "customer" INNER JOIN "location" "location" ON "customer"."locationId" = "location"."id" LEFT OUTER JOIN "loyalty" "loyalty" ON "loyalty"."businessId"
      = "location"."businessId" LEFT OUTER JOIN "customer_notification_preference" "customerNotificationPreference" ON "customerNotificationPreference"."businessId"
      = "location"."businessId" AND "customerNotificationPreference"."customerId" = "customer".id WHERE "customer"."appUserId" = '${userId}'`);
        const pendingLocations = yield EnrollmentRequest_1.EnrollmentRequest.query(`SELECT "enrollmentRequest"."enrollRequestedAt" AS "enrollRequestedAt", "enrollmentRequest"."id" AS "enrollmentRequestId", "location"."businessId", "location"."name" AS "locationName", "location"."businessName" AS "businessName", "location"."description" AS "description", "location"."addressLine1" AS "addressLine1", "location"."addressLine2" AS "addressLine2", "location"."city" AS "city", "location"."state" AS "state", "location"."zipCode" AS "zipCode", "location"."phoneNumber" AS "phoneNumber", "location"."hoursOfOperation" AS "hoursOfOperation", "location"."businessEmail" AS "businessEmail", "location"."isLoyaltyActive" AS "isLoyaltyActive", "location"."showLoyaltyInApp" AS "showLoyaltyInApp", "location"."showPromotionsInApp" AS "showPromotionsInApp", "location"."firstImageUrl" AS "firstImageUrl", "location"."secondImageUrl" AS "secondImageUrl", "location"."logoUrl" AS "logoUrl", "location"."fullFormatLogoUrl" AS "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "location"."timezone" AS "timezone", "location"."timezone" AS "timezone", "location"."id" AS "locationId" FROM "enrollment_request" "enrollmentRequest" INNER JOIN "location" "location" ON "enrollmentRequest"."locationId" = "location"."id" WHERE "enrollmentRequest"."appUserid" = '${userId}'`);
        return {
            enrolledLocations: enrolledLocations,
            pendingLocations: pendingLocations,
        };
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
        const customer = yield Customer_1.Customer.createQueryBuilder("customer")
            .where("customer.appUserId = :id", { id: userId })
            .andWhere("customer.businessId = :businessId", { businessId: businessId })
            .getOne();
        if (customer) {
            const rewardDetails = (0, MerchantService_1.getAvailableRewardsForLoyaltyBalance)(customer.balance, loyaltyRewardTiers);
            const userLoyalty = {
                id: customer.appUserId,
                balance: customer.balance,
                lifetimePoints: customer.lifetimePoints,
                enrolledAt: customer.enrolledAt,
                terminologyOne: loyalty.terminologyOne,
                terminologyMany: loyalty.terminologyMany,
                businessId: customer.business,
                locationId: customer.locationId,
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
const sendSMSVerification = (countryCode, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
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
const verifyCodeIsValid = (countryCode, phoneNumber, code) => __awaiter(void 0, void 0, void 0, function* () {
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
            yield appDataSource_1.AppDataSource.manager.update(User_1.User, {
                ref: ref,
            }, {
                lastUpdateDate: currentDate,
            });
            return appUser;
        }
        // AppUser not found, so create one
        const newAppUser = appDataSource_1.AppDataSource.manager.create(User_1.User, {
            ref: ref,
            createDate: currentDate,
            lastUpdateDate: currentDate,
            notifyOfMyRewardChanges: true,
            notifyOfNewBusinesses: true,
            notifyOfPointChanges: true,
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
        const appUser = yield User_1.User.createQueryBuilder("appUser")
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
    yield appDataSource_1.AppDataSource.manager.update(User_1.User, {
        ref: ref,
    }, {
        userDetails: details,
        lastUpdateDate: currentDate,
    });
    console.log("AppUser details were updated successfully");
    return "success";
});
module.exports = {
    addUserFavorite: exports.addUserFavorite,
    deleteUserFavorite: exports.deleteUserFavorite,
    getAllLoyaltyAccounts: exports.getAllLoyaltyAccounts,
    getUserDetails: exports.getUserDetails,
    getUserFavorites: exports.getUserFavorites,
    getUserLoyaltyDetails: exports.getUserLoyaltyDetails,
    getUserNotificationSettings: exports.getUserNotificationSettings,
    insertCustomerNotificationPreference: exports.insertCustomerNotificationPreference,
    sendSMSVerification: exports.sendSMSVerification,
    verifyCodeIsValid: exports.verifyCodeIsValid,
    updateUserBusinessNotificationSettings: exports.updateUserBusinessNotificationSettings,
    updateUserNotificationSettings: exports.updateUserNotificationSettings,
    updateUserDetails: exports.updateUserDetails,
    updateUserWithDetails: exports.updateUserWithDetails,
    upsertUser,
};
