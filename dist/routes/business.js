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
const appDataSource_1 = require("../appDataSource");
const Business_1 = require("../src/entity/Business");
const Location_1 = require("../src/entity/Location");
const BusinessService_1 = require("../src/services/BusinessService");
const LoyaltyService_1 = require("../src/services/LoyaltyService");
const SpecialService_1 = require("../src/services/SpecialService");
const getLocationDetails = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLocationDetails");
    const { locationId } = request.params;
    if (!locationId) {
        console.log("missing locationid");
        response.status(404);
        response.end();
        return;
    }
    const location = yield Location_1.Location.createQueryBuilder("location")
        .where("location.id = :locationId", { locationId: locationId })
        .getOne();
    if (!location) {
        console.log("Can't find location for id: " + locationId);
        return false;
    }
    var loyalty;
    if (location.showLoyaltyInApp || location.showPromotionsInApp) {
        loyalty = yield (0, LoyaltyService_1.getLoyaltyForLocation)(location.businessId);
    }
    var specials = yield (0, SpecialService_1.getSpecialsForLocation)(location.businessId);
    var result = {
        loyalty: loyalty,
        specials: specials,
    };
    response.send(result);
    // if (loyalty) {
    //   response.send(loyalty);
    // }
    response.end();
});
const search = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLocations");
    const { searchTerm, latitude, longitude, pageNumber, pageSize } = request.query;
    console.log("latitude:" + latitude + ", longitude: " + longitude);
    if (!latitude || !longitude) {
        console.log("missing coordinates");
        response.status(400);
        response.end();
        return;
    }
    if (!isLatitude(latitude)) {
        console.log("invalid latitude");
        response.status(400);
        response.end();
    }
    if (!isLongitude(longitude)) {
        console.log("invalid longitude");
        response.status(400);
        response.end();
    }
    const page = Number(pageNumber);
    const size = Number(pageSize);
    const lat = Number(latitude);
    const long = Number(longitude);
    const searchPhrase = searchTerm;
    console.log("searchTerm: " + searchTerm + ", searchPhrase: " + searchPhrase);
    const results = yield (0, BusinessService_1.searchBusiness)(lat, long, page, size, searchPhrase);
    if (results) {
        console.log("results:" + results);
        response.send(results);
    }
    else {
        response.status(400);
    }
    response.end();
});
function isLatitude(lat) {
    return isFinite(lat) && Math.abs(lat) <= 90;
}
function isLongitude(lng) {
    return isFinite(lng) && Math.abs(lng) <= 180;
}
const getLocations = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLocations");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        return;
    }
    const { pageNumber, pageSize } = request.query;
    const page = Number(pageNumber);
    const size = Number(pageSize);
    console.log("pageNumber: " + pageNumber + ", page: " + page);
    console.log("pageSize: " + pageSize + ", size: " + size);
    const locations = yield (0, BusinessService_1.getActiveLocationsForBusinessId)(businessId, page, size);
    if (locations) {
        response.send(locations);
    }
    else {
        response.status(400);
        response.end();
    }
});
const updateLocation = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateLocation");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        response.end();
        return;
    }
    const { locationId } = request.params;
    if (!locationId) {
        console.log("missing locationid");
        response.status(404);
        response.end();
        return;
    }
    const { showThisLocationInApp, showLoyaltyInApp, showPromotionsInApp, firstImageUrl, secondImageUrl, } = request.body;
    // var isBoolean = require("node-boolify").isBoolean;
    // const isBoolean = val => typeof val === 'boolean';
    if (!isBoolean(showLoyaltyInApp) ||
        !isBoolean(showThisLocationInApp) ||
        !isBoolean(showPromotionsInApp)) {
        console.log("missing fields");
        response.status(401);
        response.end();
        return;
    }
    const wasUpdated = yield (0, BusinessService_1.updateLocationSettingsAndImages)(locationId, showThisLocationInApp, showLoyaltyInApp, showPromotionsInApp, firstImageUrl, secondImageUrl);
    response.status(wasUpdated ? 200 : 400);
    response.end();
});
function isBoolean(val) {
    return val === false || val === true || val instanceof Boolean;
}
const getBusiness = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    // const key = 'f7fbba6e0636f890e56fbbf3283e524c';
    // const encryptionIV = 'd82c4eb5261cb9c8';
    // const algorithm = 'aes-256-cbc';
    // const cipher = crypto.createCipheriv(
    //   algorithm,
    //   Buffer.from(key),
    //   encryptionIV,
    // );
    // let encrypted = cipher.update(
    //   '2b39f4e9-6ce9-4acf-bc4f-70a8b4ad9e3f',
    //   'utf8',
    //   'base64',
    // );
    // encrypted += cipher.final('base64');
    // console.log('encrypted: ' + encrypted.toString('hex'));
    // // return encrypted.toString("hex");
    // const encoded: string = Buffer.from(
    //   'EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_',
    //   'utf8',
    // ).toString('base64');
    // const encryptedKey = encryptToken(
    //   'EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_',
    // );
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(400);
        return;
    }
    // const business = await AppDataSource.manager.findOne(Business, {
    //   select: { businessId, },
    //   where: {
    //     businessId: businessId,
    //   },
    // });
    const business = yield Business_1.Business.createQueryBuilder("business")
        .select([
        "business.businessId",
        "business.lastUpdateDate",
        "business.businessName",
        "business.addressLine1",
        "business.addressLine2",
        "business.city",
        "business.state",
        "business.zipCode",
        "business.phone",
        "business.hoursOfOperation",
        "business.businessDescription",
        "business.websiteUrl",
        "business.appStoreUrl",
        "business.googlePlayStoreUrl",
        "business.reviewsUrl",
        "business.firstImageUrl",
        "business.secondImageUrl",
    ])
        .where("business.businessId = :businessId", { businessId: businessId })
        .getOne();
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    response.send(business);
});
const createBusiness = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside createBusiness");
    const { merchantId, accessToken, refreshToken, expirationDate } = request.body;
    var businessId = undefined;
    var encryptedBusinessIdToken;
    businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    console.log("businessId: " + businessId);
    console.log("accessToken: " + accessToken);
    console.log("refreshToken: " + refreshToken);
    var date;
    console.log("expirationDate: " + expirationDate);
    if (expirationDate) {
        date = new Date(expirationDate);
    }
    if (businessId) {
        const business = yield appDataSource_1.AppDataSource.manager.findOne(Business_1.Business, {
            where: {
                businessId: businessId,
            },
        });
        if (business) {
            console.log("found business");
            // Business found, so update it with the latest tokens and exp date
            (0, BusinessService_1.updateBusinessEntity)(businessId, merchantId, accessToken, refreshToken, expirationDate, business, function (updatedBusiness) {
                if (updatedBusiness === null || updatedBusiness === void 0 ? void 0 : updatedBusiness.businessId) {
                    var businessResponse = Object();
                    businessResponse.id = updatedBusiness.businessId;
                    response.send(businessResponse);
                    return;
                }
                else {
                    response.sendStatus(500);
                    return;
                }
            });
        }
        else {
            // This should never happen where an auth token is passed with business id, but no corresponding business is found
            // If it does, the client should remove their businessId and resubmit
            response.sendStatus(404);
            return;
        }
    }
    else if (merchantId) {
        // lookup business by merchantId. If it's already been created, update it with the latest tokens and exp date
        (0, BusinessService_1.findBusinessByMerchantId)(merchantId, function (business) {
            if (business) {
                console.log("Found business for merchantId");
                (0, BusinessService_1.updateBusinessEntity)(business.businessId, merchantId, accessToken, refreshToken, expirationDate, business, function (updatedBusiness) {
                    if (updatedBusiness === null || updatedBusiness === void 0 ? void 0 : updatedBusiness.businessId) {
                        var businessResponse = Object();
                        businessResponse.id = updatedBusiness.businessId;
                        response.send(businessResponse);
                        return;
                    }
                    else {
                        response.sendStatus(500);
                        return;
                    }
                });
            }
            else {
                (0, BusinessService_1.createNewBusinessWithLoyalty)(undefined, merchantId, accessToken, refreshToken, expirationDate, function (newBusiness) {
                    if (newBusiness === null || newBusiness === void 0 ? void 0 : newBusiness.businessId) {
                        var businessResponse = Object();
                        businessResponse.id = newBusiness.businessId;
                        response.send(businessResponse);
                        // return;
                    }
                    else {
                        response.sendStatus(500);
                        // return;
                    }
                });
            }
        });
    }
    else {
        // No businessId or merchantId passed, so we can't look anything up to create or update a business
        response.sendStatus(404);
    }
});
const updateBusiness = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateBusiness");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.sendStatus(404);
        return;
    }
    const { id, lastUpdateDate, businessName, addressLine1, addressLine2, city, state, zipCode, phone, hoursOfOperation, businessDescription, websiteUrl, appStoreUrl, googlePlayStoreUrl, reviewsUrl, firstImageUrl, secondImageUrl, } = request.body;
    if (!businessName || !lastUpdateDate) {
        response.sendStatus(400);
        return;
    }
    console.log("businessId: " + businessId);
    console.log("firstImageUrl:" + firstImageUrl + ", secondImageUrl:" + secondImageUrl);
    const wasUpdated = yield (0, BusinessService_1.updateBusinessDetails)(businessId, lastUpdateDate, businessName, addressLine1, addressLine2, city, state, zipCode, phone, hoursOfOperation, businessDescription, websiteUrl, appStoreUrl, googlePlayStoreUrl, reviewsUrl, firstImageUrl, secondImageUrl);
    response.status(wasUpdated ? 203 : 500);
    response.end();
});
module.exports = {
    createBusiness,
    getBusiness,
    getLocationDetails,
    getLocations,
    updateBusiness,
    updateLocation,
    search,
};
