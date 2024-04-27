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
exports.findBusinessByMerchantId = exports.updateBusinessDetails = exports.updateBusinessEntity = exports.updateBusinessLocationFromWebhook = exports.createBusinessFromMerchantInfo = exports.createNewBusinessWithLoyalty = exports.updateLocationsWithLoyaltySettings = exports.updateLocationSettingsAndImages = exports.getImageOrLogoForBusinessId = exports.getActiveLocationsForBusinessId = exports.getLocationById = exports.searchBusiness = exports.updateBusinessSettings = exports.getBusinessIdFromAuthToken = void 0;
const LoyaltyService_1 = require("./LoyaltyService");
const EncryptionService_1 = require("./EncryptionService");
const MerchantService_1 = require("./MerchantService");
const Business_1 = require("../entity/Business");
const Location_1 = require("../entity/Location");
const User_1 = require("../entity/User");
const appDataSource_1 = require("../../appDataSource");
const Utility_1 = require("../utility/Utility");
const typeorm_1 = require("typeorm");
const NotificationService_1 = require("./NotificationService");
const getBusinessIdFromAuthToken = (request) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const merchantId = (_b = (_a = request === null || request === void 0 ? void 0 : request.token) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.merchantId;
    if (merchantId) {
        const business = yield Business_1.Business.createQueryBuilder("business")
            .select(["business.businessId"])
            .where("business.merchantId = :merchantId", {
            merchantId: merchantId,
        })
            .getOne();
        if (business) {
            return business === null || business === void 0 ? void 0 : business.businessId;
        }
    }
    return undefined;
});
exports.getBusinessIdFromAuthToken = getBusinessIdFromAuthToken;
const updateBusinessSettings = (businessId, showInApp, showSpecials, notifyWhenCustomerEnrolls, notifyWhenCustomerRequestsEnrollment, notifyWhenRewardsChange, notifyWhenPromotionsChange, notifyWhenSpecialsChange) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside searchBusiness");
    const updatedBusiness = yield appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
        businessId: businessId,
    }, {
        showInApp: showInApp,
        showSpecials: showSpecials,
        notifyWhenCustomerEnrolls: notifyWhenCustomerEnrolls,
        notifyWhenCustomerRequestsEnrollment: notifyWhenCustomerRequestsEnrollment,
        notifyWhenRewardsChange: notifyWhenRewardsChange,
        notifyWhenPromotionsChange: notifyWhenPromotionsChange,
        notifyWhenSpecialsChange: notifyWhenSpecialsChange,
    });
    console.log("Updated business with settings");
    return exports.updateBusinessDetails;
});
exports.updateBusinessSettings = updateBusinessSettings;
const searchBusiness = (latitude, longitude, pageNumber, pageSize, searchTerm, appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside searchBusiness");
    const limit = pageSize || 10;
    const page = pageNumber || 1;
    const offset = (page - 1) * limit;
    const customerJoinClause = appUserId
        ? `INNER JOIN business ON location."businessId" = business."businessId" AND business."showInApp" = true LEFT OUTER JOIN customer ON location."businessId" = customer."businessId" and customer."ref" = (select ref from "user" where id = '${appUserId}') LEFT OUTER JOIN enrollment_request ON location."businessId" = enrollment_request."businessId" and enrollment_request."ref" = (select ref from "user" where id = '${appUserId}')`
        : `INNER JOIN business ON location."businessId" = business."businessId" AND business."showInApp" = true`;
    const customerSelectClause = appUserId
        ? `, customer."balance", customer."lifetimePoints", customer."enrolledAt", customer."locationId" as enrolledLocationId, enrollment_request."enrollRequestedAt"`
        : "";
    var selectClause = `SELECT business."showInApp", business."showSpecials", location."id" as "locationId", location."name", location."businessName", "description", location."phoneNumber", "addressLine1", "addressLine2", "city", "state", "zipCode", "phoneNumber", "hoursOfOperation", "businessEmail", location."businessId", "merchantLocationId", "isLoyaltyActive", "showLoyaltyInApp", "showPromotionsInApp", "firstImageUrl", "secondImageUrl", "logoUrl", "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "timezone", ST_Distance(ST_MakePoint(${longitude}, ${latitude} )::geography, "locationPoint"::geography) / 1600 AS distance ${customerSelectClause} FROM location ${customerJoinClause} WHERE "status" = \'ACTIVE\' AND "showThisLocationInApp" = true `;
    if (searchTerm) {
        selectClause +=
            ' AND location."businessName" ILIKE \'%' + searchTerm + "%'";
    }
    selectClause += " ORDER BY distance LIMIT ";
    // try {
    const data = yield Location_1.Location.query(selectClause + limit + " offset " + offset + ";");
    // return data;
    return (0, Utility_1.paginateResponseWithoutTotal)(data, page, limit);
    // return paginateResponse(data, page, limit);
    // } catch {
    //   console.log("Error thrown while getting nearby businesses: " + error);
    //   return null;
    // }
});
exports.searchBusiness = searchBusiness;
const getLocationById = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getActiveLocationsForBusinessId");
    const location = yield appDataSource_1.AppDataSource.manager.findOne(Location_1.Location, {
        where: {
            id: locationId,
        },
    });
    return location;
});
exports.getLocationById = getLocationById;
const getActiveLocationsForBusinessId = (businessId, pageNumber, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getActiveLocationsForBusinessId");
    try {
        const take = pageSize || 10;
        const page = pageNumber || 1;
        const skip = (page - 1) * take;
        const data = yield Location_1.Location.findAndCount({
            where: { businessId: (0, typeorm_1.Equal)(businessId), status: (0, typeorm_1.Equal)("ACTIVE") },
            // .andWhere("business.status = :status", { status: "ACTIVE" })
            order: { name: "ASC" },
            take: take,
            skip: skip,
        });
        return (0, Utility_1.paginateResponse)(data, page, take);
    }
    catch (error) {
        console.log("Error thrown while getting locations");
        return null;
    }
});
exports.getActiveLocationsForBusinessId = getActiveLocationsForBusinessId;
const getImageOrLogoForBusinessId = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getImageOrLogoForBusinessId");
    try {
        const locations = yield Location_1.Location.createQueryBuilder("location")
            .select(["location.firstImageUrl", "location.logoUrl"])
            .where("location.businessId = :businessId", {
            businessId: businessId,
        })
            .getMany();
        // Get firstImageUrl, if available
        if (locations && locations.length > 0) {
            for (var location of locations) {
                if (location.firstImageUrl) {
                    console.log("found firstImageUrl for location");
                    return location.firstImageUrl;
                }
            }
            // Get logo, if available
            for (var location of locations) {
                if (location.logoUrl) {
                    console.log("found firstImageUrl for location");
                    return location.logoUrl;
                }
            }
        }
        return undefined;
    }
    catch (error) {
        console.log("Error thrown while getting locations");
        return undefined;
    }
});
exports.getImageOrLogoForBusinessId = getImageOrLogoForBusinessId;
const updateLocationSettingsAndImages = (locationId, showThisLocationInApp, showLoyaltyInApp, showPromotionsInApp, firstImageUrl, secondImageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateLocation");
    try {
        const location = yield Location_1.Location.createQueryBuilder("location")
            .where("location.id = :locationId", { locationId: locationId })
            .getOne();
        if (!location) {
            return false;
        }
        console.log("firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl);
        yield appDataSource_1.AppDataSource.manager.update(Location_1.Location, {
            id: locationId,
        }, {
            showThisLocationInApp: showThisLocationInApp,
            showLoyaltyInApp: showLoyaltyInApp,
            showPromotionsInApp: showPromotionsInApp,
            firstImageUrl: firstImageUrl !== null && firstImageUrl !== void 0 ? firstImageUrl : null,
            secondImageUrl: secondImageUrl !== null && secondImageUrl !== void 0 ? secondImageUrl : null,
        });
        console.log("location sucessfully updated");
        return true;
    }
    catch (error) {
        console.log("Error thrown while updating location: " + error);
        return false;
    }
});
exports.updateLocationSettingsAndImages = updateLocationSettingsAndImages;
const updateLocationsWithLoyaltySettings = (businessId, merchantLocationIds) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateLocationsWithLoyaltySettings");
    try {
        const locations = yield Location_1.Location.createQueryBuilder("location")
            .where("location.businessId = :businessId", { businessId: businessId })
            .getMany();
        if (!locations) {
            return false;
        }
        for (var location of locations) {
            var isLoyaltyActive = false;
            for (var merchantLocationId of merchantLocationIds) {
                if (merchantLocationId == location.merchantLocationId) {
                    // no change, so skip update
                    isLoyaltyActive = true;
                }
            }
            // Hide loyalty when inactive, otherwise keep existing setting. If loyalty is active and show in app
            // not set yet, default it to true
            const showLoyaltyInApp = isLoyaltyActive == false
                ? false
                : location.showLoyaltyInApp == undefined
                    ? true
                    : location.showLoyaltyInApp;
            // Defaulting showPromotionsInApp to same as show loyalty for now
            const showPromotionsInApp = showLoyaltyInApp;
            yield appDataSource_1.AppDataSource.manager.update(Location_1.Location, {
                businessId: businessId,
                merchantLocationId: location.merchantLocationId,
            }, {
                showLoyaltyInApp: showLoyaltyInApp,
                isLoyaltyActive: isLoyaltyActive,
                showPromotionsInApp: showPromotionsInApp,
            });
        }
        return true;
    }
    catch (error) {
        console.log("Error thrown while updating location: " + error);
        return false;
    }
});
exports.updateLocationsWithLoyaltySettings = updateLocationsWithLoyaltySettings;
const createNewBusinessWithLoyalty = (name, merchantId, accessToken, refreshToken, expirationDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    console.log("creating new business");
    try {
        const newBusiness = yield (0, exports.createBusinessFromMerchantInfo)(name, merchantId, accessToken, refreshToken, expirationDate);
        if (newBusiness) {
            var token = "";
            token = (0, EncryptionService_1.decryptToken)(newBusiness.merchantAccessToken);
            if (token) {
                const loyaltyResponse = yield (0, MerchantService_1.getMainLoyaltyProgramFromMerchant)(token);
                // function (
                console.log("got back program: " +
                    (loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.program.id) +
                    ", promo count: " +
                    ((_c = loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.promotions) === null || _c === void 0 ? void 0 : _c.length) +
                    ", accrualType: " +
                    (loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.accrualType) +
                    ", catalogItemNameMap count: " +
                    (loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.catalogItemNameMap.size));
                if (loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.program) {
                    const newLoyalty = yield (0, LoyaltyService_1.createAppLoyaltyFromLoyaltyProgram)(newBusiness.businessId, loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.program, loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.promotions, loyaltyResponse === null || loyaltyResponse === void 0 ? void 0 : loyaltyResponse.catalogItemNameMap);
                    if (!newLoyalty) {
                        console.log("Failed to create app loyalty");
                    }
                    else {
                        // Get all users subscribed to new business notification
                        const users = yield User_1.User.createQueryBuilder("user")
                            .select(["user.id"])
                            .where("user.notifyOfNewBusinesses = true")
                            .getMany();
                        console.log("count: " + users.length);
                        if (users && users.length > 0) {
                            var userIds = [];
                            for (var user of users) {
                                userIds.push(user.id);
                            }
                            if (userIds.length > 0) {
                                // Send notification of new business to subscribers
                                const notificationContents = "Check out rewards and promotions at this new business: " +
                                    newBusiness.businessName;
                                const businessImage = yield (0, exports.getImageOrLogoForBusinessId)(newBusiness.businessId);
                                (0, NotificationService_1.sendNotifications)(notificationContents, userIds, businessImage);
                            }
                        }
                    }
                    return newBusiness;
                }
                else {
                    // If no merchant loyalty is found, we should probably check app loyalty and remove it
                    console.log("No loyalty program found");
                    return newBusiness;
                }
            }
            else {
                //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
                console.log("No valid token found in newBusiness");
                return newBusiness;
            }
        }
        else {
            console.log("Failed to create new business");
            return undefined;
        }
    }
    catch (err) {
        console.log("createNewBusinessWithLoyalty encountered an error: " + err);
        return undefined;
    }
});
exports.createNewBusinessWithLoyalty = createNewBusinessWithLoyalty;
const createBusinessFromMerchantInfo = (name, merchantId, accessToken, refreshToken, expirationDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    console.log("inside createBusinessFromMerchantInfo");
    // First, we need to make sure the tokens are valid, so we'll get the latest merchant info first
    const merchant = yield (0, MerchantService_1.getMerchantInfo)(merchantId, accessToken);
    if (merchant) {
        console.log("got merchant, calling createBusinessEntity");
        var merchantName = (_d = merchant.businessName) !== null && _d !== void 0 ? _d : undefined;
        const business = yield createBusinessEntity(merchantId, merchantName, accessToken, refreshToken, expirationDate);
        console.log("returned from createBusinessEntity with business: " + business);
        if (business) {
            const wereLocationsCreated = yield createBusinessLocations(business.businessId, merchantId, accessToken);
            console.log("creation of business locations result: " + wereLocationsCreated);
        }
        return business;
        return;
    }
    else {
        console.log("returing empty business");
        return undefined;
    }
});
exports.createBusinessFromMerchantInfo = createBusinessFromMerchantInfo;
const createBusinessEntity = (merchantId, merchantName, accessToken, refreshToken, expirationDate) => __awaiter(void 0, void 0, void 0, function* () {
    const business = appDataSource_1.AppDataSource.manager.create(Business_1.Business, {
        name: merchantName !== null && merchantName !== void 0 ? merchantName : "unknown",
        businessName: merchantName !== null && merchantName !== void 0 ? merchantName : "unknown",
        merchantId: merchantId,
        merchantAccessToken: accessToken,
        merchantRefreshToken: refreshToken,
        accessTokenExpirationDate: expirationDate,
        loyaltyUsesCatalogItems: false,
        specialsUseCatalogItems: false,
        showInApp: true,
        showSpecials: true,
        notifyWhenCustomerEnrolls: true,
        notifyWhenCustomerRequestsEnrollment: true,
        notifyWhenRewardsChange: true,
        notifyWhenPromotionsChange: true,
        notifyWhenSpecialsChange: true,
        createDate: new Date(),
        lastUpdateDate: new Date(),
    });
    yield appDataSource_1.AppDataSource.manager.save(business);
    console.log("just created business with id: " + business.businessId);
    return business;
});
const createLocationHours = (businessHourPeriods) => {
    console.log("inside createLocationHours");
    var hours;
    var jsonPeriods = [];
    for (var period of businessHourPeriods) {
        if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
            var periodJson = {
                dayOfWeek: period.dayOfWeek,
                startLocalTime: period.startLocalTime,
                endLocalTime: period.endLocalTime,
            };
            jsonPeriods.push(periodJson);
        }
    }
    return jsonPeriods;
};
const createBusinessLocations = (businessId, merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const merchantLocations = yield (0, MerchantService_1.getMerchantLocations)(merchantId, accessToken);
    if (!merchantLocations || merchantLocations.length == 0) {
        return false;
    }
    for (var merchantLocation of merchantLocations) {
        // var hours:
        //   | {
        //       dayOfWeek: string;
        //       startLocalTime: string;
        //       endLocalTime: string;
        //     }[]
        //   | undefined;
        let hours;
        if ((_e = merchantLocation.businessHours) === null || _e === void 0 ? void 0 : _e.periods) {
            hours = createLocationHours(merchantLocation.businessHours.periods);
        }
        else {
            hours = undefined;
        }
        // if (merchantLocation.businessHours?.periods) {
        //   var jsonPeriods = [];
        //   for (var period of merchantLocation.businessHours.periods) {
        //     if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
        //       var periodJson = {
        //         dayOfWeek: period.dayOfWeek,
        //         startLocalTime: period.startLocalTime,
        //         endLocalTime: period.endLocalTime,
        //       };
        //       jsonPeriods.push(periodJson);
        //     }
        //   }
        //   hours = jsonPeriods;
        // } else {
        //   hours = undefined;
        // }
        let locationPoint;
        if (((_f = merchantLocation.coordinates) === null || _f === void 0 ? void 0 : _f.longitude) &&
            merchantLocation.coordinates.latitude) {
            locationPoint = {
                type: "Point",
                coordinates: [
                    (_g = merchantLocation.coordinates) === null || _g === void 0 ? void 0 : _g.longitude,
                    (_h = merchantLocation.coordinates) === null || _h === void 0 ? void 0 : _h.latitude,
                ],
            };
        }
        else {
            locationPoint = {
                type: "Point",
                coordinates: [
                    -122.465683, 37.7407,
                    // 37.7407, -122.465683,
                    // -122.47649, 37.72638,
                    // merchantLocation.coordinates?.longitude,
                    // merchantLocation.coordinates?.latitude,
                ],
            };
        }
        yield insertBusinessLocation(businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_j = merchantLocation.address) === null || _j === void 0 ? void 0 : _j.addressLine1, (_k = merchantLocation.address) === null || _k === void 0 ? void 0 : _k.addressLine2, (_l = merchantLocation.address) === null || _l === void 0 ? void 0 : _l.locality, (_m = merchantLocation.address) === null || _m === void 0 ? void 0 : _m.administrativeDistrictLevel1, (_o = merchantLocation.address) === null || _o === void 0 ? void 0 : _o.postalCode, (_p = merchantLocation.address) === null || _p === void 0 ? void 0 : _p.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_q = merchantLocation.timezone) !== null && _q !== void 0 ? _q : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
    }
});
const updateBusinessLocationFromWebhook = (merchantId, merchantLocationId, updateType) => __awaiter(void 0, void 0, void 0, function* () {
    var _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
    console.log("inside updateBusinessLocationFromWebhook");
    const business = yield Business_1.Business.createQueryBuilder("business")
        .where("business.merchantId = :merchantId", { merchantId: merchantId })
        .getOne();
    if (!business) {
        console.log("Can't find Business for merchantId: " + merchantId);
        return false;
    }
    const token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (!token) {
        console.log("Can't get token");
        return false;
    }
    const merchantLocation = yield (0, MerchantService_1.getMerchantLocation)(merchantLocationId, token);
    if (!merchantLocation) {
        console.log("Could not find merchant location");
        return;
    }
    let hours;
    if ((_r = merchantLocation.businessHours) === null || _r === void 0 ? void 0 : _r.periods) {
        hours = createLocationHours(merchantLocation.businessHours.periods);
    }
    let locationPoint;
    if (((_s = merchantLocation.coordinates) === null || _s === void 0 ? void 0 : _s.longitude) &&
        merchantLocation.coordinates.latitude) {
        locationPoint = {
            type: "Point",
            coordinates: [
                (_t = merchantLocation.coordinates) === null || _t === void 0 ? void 0 : _t.longitude,
                (_u = merchantLocation.coordinates) === null || _u === void 0 ? void 0 : _u.latitude,
            ],
        };
    }
    else {
        locationPoint = {
            type: "Point",
            coordinates: [-122.465683, 37.7407],
        };
    }
    if (updateType == "create") {
        const newLocation = yield insertBusinessLocation(business.businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_v = merchantLocation.address) === null || _v === void 0 ? void 0 : _v.addressLine1, (_w = merchantLocation.address) === null || _w === void 0 ? void 0 : _w.addressLine2, (_x = merchantLocation.address) === null || _x === void 0 ? void 0 : _x.locality, (_y = merchantLocation.address) === null || _y === void 0 ? void 0 : _y.administrativeDistrictLevel1, (_z = merchantLocation.address) === null || _z === void 0 ? void 0 : _z.postalCode, (_0 = merchantLocation.address) === null || _0 === void 0 ? void 0 : _0.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_1 = merchantLocation.timezone) !== null && _1 !== void 0 ? _1 : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
        if (newLocation) {
            return true;
        }
    }
    // Either it's an update for insert failed. Either way we'll try to update it
    const status = yield updateBusinessLocation(business.businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_2 = merchantLocation.address) === null || _2 === void 0 ? void 0 : _2.addressLine1, (_3 = merchantLocation.address) === null || _3 === void 0 ? void 0 : _3.addressLine2, (_4 = merchantLocation.address) === null || _4 === void 0 ? void 0 : _4.locality, (_5 = merchantLocation.address) === null || _5 === void 0 ? void 0 : _5.administrativeDistrictLevel1, (_6 = merchantLocation.address) === null || _6 === void 0 ? void 0 : _6.postalCode, (_7 = merchantLocation.address) === null || _7 === void 0 ? void 0 : _7.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_8 = merchantLocation.timezone) !== null && _8 !== void 0 ? _8 : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
    console.log("");
    return status;
});
exports.updateBusinessLocationFromWebhook = updateBusinessLocationFromWebhook;
const updateBusinessLocation = (businessId, merchantLocationId, status, name, businessName, description, addressLine1, addressLine2, city, state, zipCode, country, phoneNumber, hoursOfOperation, businessEmail, locationPoint, timezone, logUrl, fullFormatLogoUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateBusinessLocation with merchantLocationId: " +
        merchantLocationId +
        ", businessId: " +
        businessId +
        ", locationPoint: " +
        (locationPoint === null || locationPoint === void 0 ? void 0 : locationPoint.coordinates));
    try {
        const result = yield appDataSource_1.AppDataSource.manager.update(Location_1.Location, {
            businessId: businessId,
            merchantLocationId: merchantLocationId,
        }, {
            status: status,
            name: name !== null && name !== void 0 ? name : undefined,
            businessName: businessName !== null && businessName !== void 0 ? businessName : undefined,
            description: description !== null && description !== void 0 ? description : undefined,
            addressLine1: addressLine1 !== null && addressLine1 !== void 0 ? addressLine1 : undefined,
            addressLine2: addressLine2 !== null && addressLine2 !== void 0 ? addressLine2 : undefined,
            city: city !== null && city !== void 0 ? city : undefined,
            state: state !== null && state !== void 0 ? state : undefined,
            zipCode: zipCode !== null && zipCode !== void 0 ? zipCode : undefined,
            country: country !== null && country !== void 0 ? country : undefined,
            phoneNumber: phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : undefined,
            hoursOfOperation: hoursOfOperation,
            businessEmail: businessEmail !== null && businessEmail !== void 0 ? businessEmail : undefined,
            locationPoint: locationPoint,
            timezone: timezone !== null && timezone !== void 0 ? timezone : "America/Los_Angeles",
            logoUrl: logUrl,
            fullFormatLogoUrl: fullFormatLogoUrl,
        });
        if (result.affected == 0) {
            // Location not found for some reason, so insert it
            const newLoc = yield insertBusinessLocation(businessId, merchantLocationId, status, name, businessName, description, addressLine1, addressLine2, city, state, zipCode, country, phoneNumber, hoursOfOperation, businessEmail, locationPoint, timezone !== null && timezone !== void 0 ? timezone : "America/Los_Angeles", logUrl, fullFormatLogoUrl);
            console.log("location was created");
            return newLoc != null;
        }
        else {
            console.log("location update was successful");
            return true;
        }
        return true;
    }
    catch (error) {
        console.log("Error was thrown while updating location: " + error);
        return false;
    }
});
const insertBusinessLocation = (businessId, merchantLocationId, status, name, businessName, description, addressLine1, addressLine2, city, state, zipCode, country, phoneNumber, hoursOfOperation, businessEmail, locationPoint, timezone, logUrl, fullFormatLogoUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside insertBusinessLocation");
    try {
        const location = appDataSource_1.AppDataSource.manager.create(Location_1.Location, {
            businessId: businessId,
            merchantLocationId: merchantLocationId,
            status: status,
            name: name !== null && name !== void 0 ? name : undefined,
            businessName: businessName !== null && businessName !== void 0 ? businessName : undefined,
            description: description !== null && description !== void 0 ? description : undefined,
            addressLine1: addressLine1 !== null && addressLine1 !== void 0 ? addressLine1 : undefined,
            addressLine2: addressLine2 !== null && addressLine2 !== void 0 ? addressLine2 : undefined,
            city: city !== null && city !== void 0 ? city : undefined,
            state: state !== null && state !== void 0 ? state : undefined,
            zipCode: zipCode !== null && zipCode !== void 0 ? zipCode : undefined,
            country: country !== null && country !== void 0 ? country : undefined,
            phoneNumber: phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : undefined,
            hoursOfOperation: hoursOfOperation,
            businessEmail: businessEmail !== null && businessEmail !== void 0 ? businessEmail : undefined,
            showThisLocationInApp: status == "ACTIVE",
            locationPoint: locationPoint,
            timezone: timezone,
            logoUrl: logUrl,
            fullFormatLogoUrl: fullFormatLogoUrl,
        });
        yield appDataSource_1.AppDataSource.manager.save(location);
        console.log("just created business location with id: " + location.merchantLocationId);
        return location;
    }
    catch (error) {
        console.log("Errow thrown while creating business location: " + error);
        return null;
    }
});
const updateBusinessEntity = (businessId, merchantId, accessToken, refreshToken, expirationDate, business) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
        merchantId: merchantId,
    }, {
        merchantAccessToken: accessToken,
        merchantRefreshToken: refreshToken,
        accessTokenExpirationDate: expirationDate,
    });
    console.log("just updated business with id: " + business.businessId);
    return business;
});
exports.updateBusinessEntity = updateBusinessEntity;
const updateBusinessDetails = (businessId, lastUpdateDate, businessName, addressLine1, addressLine2, city, state, zipCode, phone, hoursOfOperation, businessDescription, websiteUrl, appStoreUrl, googlePlayStoreUrl, reviewsUrl, firstImageUrl, secondImageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateBusinessDetails");
    try {
        // First make sure the business does exist
        const business = yield Business_1.Business.createQueryBuilder("business")
            .where("business.businessId = :businessId", { businessId: businessId })
            .getOne();
        if (!business) {
            return false;
        }
        const lastUpdate = new Date(lastUpdateDate);
        console.log("firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl);
        // Now update its values
        appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
            businessId: businessId,
        }, {
            lastUpdateDate: lastUpdate,
            businessName: businessName,
            appStoreUrl: appStoreUrl,
            googlePlayStoreUrl: googlePlayStoreUrl,
            reviewsUrl: reviewsUrl,
        });
        return true;
    }
    catch (err) {
        console.log("Error returned while getting business by id: " + err);
        return false;
    }
});
exports.updateBusinessDetails = updateBusinessDetails;
const findBusinessByMerchantId = (merchantId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside findBusinessByMerchantId");
    try {
        const business = yield Business_1.Business.createQueryBuilder("business")
            .where("business.merchantId = :merchantId", { merchantId: merchantId })
            .getOne();
        return business;
    }
    catch (err) {
        return undefined;
    }
});
exports.findBusinessByMerchantId = findBusinessByMerchantId;
module.exports = {
    createBusinessFromMerchantInfo: exports.createBusinessFromMerchantInfo,
    createNewBusinessWithLoyalty: exports.createNewBusinessWithLoyalty,
    getBusinessIdFromAuthToken: exports.getBusinessIdFromAuthToken,
    getActiveLocationsForBusinessId: exports.getActiveLocationsForBusinessId,
    getImageOrLogoForBusinessId: exports.getImageOrLogoForBusinessId,
    getLocationById: exports.getLocationById,
    updateBusinessDetails: exports.updateBusinessDetails,
    updateBusinessEntity: exports.updateBusinessEntity,
    updateBusinessLocationFromWebhook: exports.updateBusinessLocationFromWebhook,
    updateBusinessSettings: exports.updateBusinessSettings,
    updateLocationSettingsAndImages: exports.updateLocationSettingsAndImages,
    updateLocationsWithLoyaltySettings: exports.updateLocationsWithLoyaltySettings,
    findBusinessByMerchantId: exports.findBusinessByMerchantId,
    searchBusiness: exports.searchBusiness,
};
