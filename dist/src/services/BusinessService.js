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
exports.findBusinessByMerchantId = exports.updateBusinessDetails = exports.updateBusinessEntity = exports.updateBusinessLocationFromWebhook = exports.createBusinessFromMerchantInfo = exports.createNewBusinessWithLoyalty = exports.updateLocationsWithLoyaltySettings = exports.updateLocationSettingsAndImages = exports.getActiveLocationsForBusinessId = exports.searchBusiness = exports.getBusinessIdFromAuthToken = void 0;
const LoyaltyService_1 = require("./LoyaltyService");
const EncryptionService_1 = require("./EncryptionService");
const MerchantService_1 = require("./MerchantService");
const Business_1 = require("../entity/Business");
const Location_1 = require("../entity/Location");
const appDataSource_1 = require("../../appDataSource");
const Utility_1 = require("../utility/Utility");
const typeorm_1 = require("typeorm");
function getBusinessIdFromAuthToken(request) {
    if (request.headers.authorization) {
        const authValues = request.headers.authorization.split(" ");
        if (authValues.length == 2) {
            const encryptedBusinessIdToken = authValues[1];
            return (0, EncryptionService_1.decryptToken)(encryptedBusinessIdToken);
        }
    }
    return undefined;
}
exports.getBusinessIdFromAuthToken = getBusinessIdFromAuthToken;
const searchBusiness = (latitude, longitude, pageNumber, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside searchBusiness");
    const limit = pageSize || 10;
    const page = pageNumber || 1;
    const offset = (page - 1) * limit;
    // try {
    const data = yield Location_1.Location.query(`SELECT "id", "name", "businessName", "description", "addressLine1", "addressLine2", "city", "state", "zipCode", "phoneNumber", "hoursOfOperation", "businessEmail", "businessId", "merchantLocationId", "isLoyaltyActive", "showLoyaltyInApp", "showPromotionsInApp", "firstImageUrl", "secondImageUrl", "logoUrl", "fullFormatLogoUrl", ST_ASTEXT("locationPoint") AS locationPoint, "timezone", ST_Distance(ST_MakePoint(${latitude}, ${longitude} )::geography, "locationPoint"::geography) / 1600 AS distance FROM location WHERE "status" = 'ACTIVE' AND "showThisLocationInApp" = true ORDER BY distance LIMIT ` +
        limit +
        " offset " +
        offset +
        ";");
    // return data;
    return (0, Utility_1.paginateResponseWithoutTotal)(data, page, limit);
    // return paginateResponse(data, page, limit);
    // } catch {
    //   console.log("Error thrown while getting nearby businesses: " + error);
    //   return null;
    // }
});
exports.searchBusiness = searchBusiness;
const getActiveLocationsForBusinessId = (businessId, pageNumber, pageSize) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLocationsForBusinessId");
    try {
        const business = yield Business_1.Business.createQueryBuilder("business")
            .where("business.businessId = :businessId", { businessId: businessId })
            .getOne();
        if (!business) {
            console.log("Can't find Business for businessId: " + businessId);
            return false;
        }
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
    console.log("creating new business");
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
            yield appDataSource_1.AppDataSource.manager.update(Location_1.Location, {
                businessId: businessId,
                merchantLocationId: location.merchantLocationId,
            }, {
                showLoyaltyInApp: showLoyaltyInApp,
                isLoyaltyActive: isLoyaltyActive,
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
const createNewBusinessWithLoyalty = (name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("creating new business");
    try {
        (0, exports.createBusinessFromMerchantInfo)(name, merchantId, accessToken, refreshToken, expirationDate, function (newBusiness) {
            if (newBusiness) {
                var token = "";
                token = (0, EncryptionService_1.decryptToken)(newBusiness.merchantAccessToken);
                if (token) {
                    (0, MerchantService_1.getMainLoyaltyProgramFromMerchant)(token, function (loyaltyProgram, promotions, accrualType, catalogItemNameMap) {
                        console.log("got back program: " +
                            (loyaltyProgram === null || loyaltyProgram === void 0 ? void 0 : loyaltyProgram.id) +
                            ", promo count: " +
                            (promotions === null || promotions === void 0 ? void 0 : promotions.length) +
                            ", accrualType: " +
                            accrualType +
                            ", catalogItemNameMap count: " +
                            (catalogItemNameMap === null || catalogItemNameMap === void 0 ? void 0 : catalogItemNameMap.size));
                        if (loyaltyProgram) {
                            (0, LoyaltyService_1.createAppLoyaltyFromLoyaltyProgram)(newBusiness.businessId, loyaltyProgram, promotions, catalogItemNameMap, function (newLoyalty) {
                                if (!newLoyalty) {
                                    console.log("Failed to create app loyalty");
                                }
                                callback(newBusiness);
                            });
                        }
                        else {
                            // If no merchant loyalty is found, we should probably check app loyalty and remove it
                            console.log("No loyalty program found");
                            callback(newBusiness);
                        }
                    });
                }
                else {
                    //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
                    console.log("No valid token found in newBusiness");
                    callback(newBusiness);
                }
            }
            else {
                console.log("Failed to create new business 2");
                callback(undefined);
            }
        });
    }
    catch (err) {
        console.log("createNewBusinessWithLoyalty encountered an error: " + err);
        callback(undefined);
    }
});
exports.createNewBusinessWithLoyalty = createNewBusinessWithLoyalty;
const createBusinessFromMerchantInfo = (name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("inside createBusinessFromMerchantInfo");
    // First, we need to make sure the tokens are valid, so we'll get the latest merchant info first
    const merchant = yield (0, MerchantService_1.getMerchantInfo)(merchantId, accessToken);
    if (merchant) {
        console.log("got merchant, calling createBusinessEntity");
        var merchantName = (_a = merchant.businessName) !== null && _a !== void 0 ? _a : undefined;
        const business = yield createBusinessEntity(merchantId, merchantName, accessToken, refreshToken, expirationDate);
        console.log("returned from createBusinessEntity with business: " + business);
        if (business) {
            const wereLocationsCreated = yield createBusinessLocations(business.businessId, merchantId, accessToken);
            console.log("creation of business locations result: " + wereLocationsCreated);
        }
        callback(business);
        return;
    }
    else {
        console.log("returing empty business");
        callback(undefined);
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
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
        if ((_b = merchantLocation.businessHours) === null || _b === void 0 ? void 0 : _b.periods) {
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
        if (((_c = merchantLocation.coordinates) === null || _c === void 0 ? void 0 : _c.longitude) &&
            merchantLocation.coordinates.latitude) {
            locationPoint = {
                type: "Point",
                coordinates: [
                    (_d = merchantLocation.coordinates) === null || _d === void 0 ? void 0 : _d.longitude,
                    (_e = merchantLocation.coordinates) === null || _e === void 0 ? void 0 : _e.latitude,
                ],
            };
        }
        yield insertBusinessLocation(businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_f = merchantLocation.address) === null || _f === void 0 ? void 0 : _f.addressLine1, (_g = merchantLocation.address) === null || _g === void 0 ? void 0 : _g.addressLine2, (_h = merchantLocation.address) === null || _h === void 0 ? void 0 : _h.locality, (_j = merchantLocation.address) === null || _j === void 0 ? void 0 : _j.administrativeDistrictLevel1, (_k = merchantLocation.address) === null || _k === void 0 ? void 0 : _k.postalCode, (_l = merchantLocation.address) === null || _l === void 0 ? void 0 : _l.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_m = merchantLocation.timezone) !== null && _m !== void 0 ? _m : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
    }
});
const updateBusinessLocationFromWebhook = (merchantId, merchantLocationId, updateType) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
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
    // let xx = merchantLocation.locationPoint.coordinates
    let hours;
    if ((_o = merchantLocation.businessHours) === null || _o === void 0 ? void 0 : _o.periods) {
        hours = createLocationHours(merchantLocation.businessHours.periods);
    }
    let locationPoint;
    // if (
    //   merchantLocation.coordinates?.longitude &&
    //   merchantLocation.coordinates.latitude
    // ) {
    locationPoint = {
        type: "Point",
        coordinates: [
            37.72638, -122.47649,
            // -122.47649, 37.72638,
            // merchantLocation.coordinates?.longitude,
            // merchantLocation.coordinates?.latitude,
        ],
    };
    // }
    if (updateType == "create") {
        const newLocation = yield insertBusinessLocation(business.businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_p = merchantLocation.address) === null || _p === void 0 ? void 0 : _p.addressLine1, (_q = merchantLocation.address) === null || _q === void 0 ? void 0 : _q.addressLine2, (_r = merchantLocation.address) === null || _r === void 0 ? void 0 : _r.locality, (_s = merchantLocation.address) === null || _s === void 0 ? void 0 : _s.administrativeDistrictLevel1, (_t = merchantLocation.address) === null || _t === void 0 ? void 0 : _t.postalCode, (_u = merchantLocation.address) === null || _u === void 0 ? void 0 : _u.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_v = merchantLocation.timezone) !== null && _v !== void 0 ? _v : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
        if (newLocation) {
            return true;
        }
    }
    // Either it's an update for insert failed. Either way we'll try to update it
    const status = yield updateBusinessLocation(business.businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_w = merchantLocation.address) === null || _w === void 0 ? void 0 : _w.addressLine1, (_x = merchantLocation.address) === null || _x === void 0 ? void 0 : _x.addressLine2, (_y = merchantLocation.address) === null || _y === void 0 ? void 0 : _y.locality, (_z = merchantLocation.address) === null || _z === void 0 ? void 0 : _z.administrativeDistrictLevel1, (_0 = merchantLocation.address) === null || _0 === void 0 ? void 0 : _0.postalCode, (_1 = merchantLocation.address) === null || _1 === void 0 ? void 0 : _1.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail, locationPoint, (_2 = merchantLocation.timezone) !== null && _2 !== void 0 ? _2 : "America/Los_Angeles", merchantLocation.logoUrl, merchantLocation.fullFormatLogoUrl);
    console.log("");
    return status;
});
exports.updateBusinessLocationFromWebhook = updateBusinessLocationFromWebhook;
const updateBusinessLocation = (businessId, merchantLocationId, status, name, businessName, description, addressLine1, addressLine2, city, state, zipCode, country, phoneNumber, hoursOfOperation, businessEmail, locationPoint, timezone, logUrl, fullFormatLogoUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateBusinessLocation with merchantLocationId: " +
        merchantLocationId +
        ", businessId: " +
        businessId);
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
// const updateBusinessWithBusinessIdToken = async (businessRepository: Repository<Business>, businessId: string, merchantId: string, callback: any) => {
//   // Create business token
//   const businessKey = businessId + "::" + merchantId;
//   const encryptedKey = encryptToken(businessKey);
//   console.log("businessKey: " + businessKey + " encrypted to: " + encryptedKey);
//   if (encryptedKey) {
//     await businessRepository.update(businessId, {
//       businessToken: encryptedKey,
//     })
//     callback(true);
//   } else {
//     // If we can't create a business token, return empty business cause we can't provide a client token
//     callback(false);
//   }
// }
const updateBusinessEntity = (businessId, merchantId, accessToken, refreshToken, expirationDate, business, callback) => __awaiter(void 0, void 0, void 0, function* () {
    appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
        merchantId: merchantId,
    }, {
        merchantAccessToken: accessToken,
        merchantRefreshToken: refreshToken,
        accessTokenExpirationDate: expirationDate,
    });
    console.log("just updated business with id: " + business.businessId);
    callback(business);
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
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            city: city,
            state: state,
            zipCode: zipCode,
            phone: phone,
            hoursOfOperation: hoursOfOperation,
            businessDescription: businessDescription,
            websiteUrl: websiteUrl,
            appStoreUrl: appStoreUrl,
            googlePlayStoreUrl: googlePlayStoreUrl,
            reviewsUrl: reviewsUrl,
            firstImageUrl: firstImageUrl !== null && firstImageUrl !== void 0 ? firstImageUrl : null,
            secondImageUrl: secondImageUrl !== null && secondImageUrl !== void 0 ? secondImageUrl : null,
        });
        return true;
    }
    catch (err) {
        console.log("Error returned while getting business by id: " + err);
        return false;
    }
});
exports.updateBusinessDetails = updateBusinessDetails;
const findBusinessByMerchantId = (merchantId, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside findBusinessByMerchantId");
    try {
        const business = yield Business_1.Business.createQueryBuilder("business")
            .where("business.merchantId = :merchantId", { merchantId: merchantId })
            .getOne();
        callback(business);
    }
    catch (err) {
        callback(undefined);
    }
});
exports.findBusinessByMerchantId = findBusinessByMerchantId;
module.exports = {
    createBusinessFromMerchantInfo: exports.createBusinessFromMerchantInfo,
    createNewBusinessWithLoyalty: exports.createNewBusinessWithLoyalty,
    getBusinessIdFromAuthToken,
    getActiveLocationsForBusinessId: exports.getActiveLocationsForBusinessId,
    updateBusinessDetails: exports.updateBusinessDetails,
    updateBusinessEntity: exports.updateBusinessEntity,
    updateBusinessLocationFromWebhook: exports.updateBusinessLocationFromWebhook,
    updateLocationSettingsAndImages: exports.updateLocationSettingsAndImages,
    updateLocationsWithLoyaltySettings: exports.updateLocationsWithLoyaltySettings,
    findBusinessByMerchantId: exports.findBusinessByMerchantId,
    searchBusiness: exports.searchBusiness,
};
