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
exports.findBusinessByMerchantId = exports.updateBusinessDetails = exports.updateBusinessEntity = exports.createBusinessFromMerchantInfo = exports.createNewBusinessWithLoyalty = exports.getBusinessIdFromAuthToken = void 0;
const LoyaltyService_1 = require("./LoyaltyService");
const EncryptionService_1 = require("./EncryptionService");
const MerchantService_1 = require("./MerchantService");
const Business_1 = require("../entity/Business");
const Location_1 = require("../entity/Location");
const appDataSource_1 = require("../../appDataSource");
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
const createBusinessLocations = (businessId, merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f, _g, _h;
    const merchantLocations = yield (0, MerchantService_1.getMerchantLocations)(merchantId, accessToken);
    if (!merchantLocations || merchantLocations.length == 0) {
        return false;
    }
    for (var merchantLocation of merchantLocations) {
        var hours;
        if ((_b = merchantLocation.businessHours) === null || _b === void 0 ? void 0 : _b.periods) {
            var jsonPeriods = [];
            for (var period of merchantLocation.businessHours.periods) {
                if (period.dayOfWeek && period.startLocalTime && period.endLocalTime) {
                    var periodJson = {
                        dayOfWeek: period.dayOfWeek,
                        startLocalTime: period.startLocalTime,
                        endLocalTime: period.endLocalTime,
                    };
                    jsonPeriods.push(periodJson);
                }
            }
            hours = jsonPeriods;
        }
        else {
            hours = undefined;
        }
        insertBusinessLocation(businessId, merchantLocation.id, merchantLocation.status, merchantLocation.name, merchantLocation.businessName, merchantLocation.description, (_c = merchantLocation.address) === null || _c === void 0 ? void 0 : _c.addressLine1, (_d = merchantLocation.address) === null || _d === void 0 ? void 0 : _d.addressLine2, (_e = merchantLocation.address) === null || _e === void 0 ? void 0 : _e.locality, (_f = merchantLocation.address) === null || _f === void 0 ? void 0 : _f.administrativeDistrictLevel1, (_g = merchantLocation.address) === null || _g === void 0 ? void 0 : _g.postalCode, (_h = merchantLocation.address) === null || _h === void 0 ? void 0 : _h.country, merchantLocation.phoneNumber, hours, merchantLocation.businessEmail);
    }
});
const insertBusinessLocation = (businessId, merchantLocationId, status, name, businessName, description, addressLine1, addressLine2, city, state, zipCode, country, phoneNumber, hoursOfOperation, businessEmail) => __awaiter(void 0, void 0, void 0, function* () {
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
            showThisLocationInApp: false,
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
    updateBusinessDetails: exports.updateBusinessDetails,
    updateBusinessEntity: exports.updateBusinessEntity,
    findBusinessByMerchantId: exports.findBusinessByMerchantId,
};
