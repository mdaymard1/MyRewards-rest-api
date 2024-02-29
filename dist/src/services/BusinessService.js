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
const appDataSource_1 = require("../../appDataSource");
function getBusinessIdFromAuthToken(request) {
    if (request.headers.authorization) {
        const authValues = request.headers.authorization.split(' ');
        if (authValues.length == 2) {
            const encryptedBusinessIdToken = authValues[1];
            return (0, EncryptionService_1.decryptToken)(encryptedBusinessIdToken);
        }
    }
    return undefined;
}
exports.getBusinessIdFromAuthToken = getBusinessIdFromAuthToken;
const createNewBusinessWithLoyalty = (name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('creating new business');
    try {
        (0, exports.createBusinessFromMerchantInfo)(name, merchantId, accessToken, refreshToken, expirationDate, function (newBusiness) {
            if (newBusiness) {
                var token = '';
                token = (0, EncryptionService_1.decryptToken)(newBusiness.merchantAccessToken);
                if (token) {
                    (0, MerchantService_1.getMainLoyaltyProgramFromMerchant)(token, function (loyaltyProgram, promotions, accrualType, catalogItemNameMap) {
                        console.log('got back program: ' +
                            (loyaltyProgram === null || loyaltyProgram === void 0 ? void 0 : loyaltyProgram.id) +
                            ', promo count: ' +
                            (promotions === null || promotions === void 0 ? void 0 : promotions.length) +
                            ', accrualType: ' +
                            accrualType +
                            ', catalogItemNameMap count: ' +
                            (catalogItemNameMap === null || catalogItemNameMap === void 0 ? void 0 : catalogItemNameMap.size));
                        if (loyaltyProgram) {
                            (0, LoyaltyService_1.createAppLoyaltyFromLoyaltyProgram)(newBusiness.businessId, loyaltyProgram, promotions, catalogItemNameMap, function (newLoyalty) {
                                if (!newLoyalty) {
                                    console.log('Failed to create app loyalty');
                                }
                                callback(newBusiness);
                            });
                        }
                        else {
                            // If no merchant loyalty is found, we should probably check app loyalty and remove it
                            console.log('No loyalty program found');
                            callback(newBusiness);
                        }
                    });
                }
                else {
                    //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
                    console.log('No valid token found in newBusiness');
                    callback(newBusiness);
                }
            }
            else {
                console.log('Failed to create new business 2');
                callback(undefined);
            }
        });
    }
    catch (err) {
        console.log('createNewBusinessWithLoyalty encountered an error: ' + err);
        callback(undefined);
    }
});
exports.createNewBusinessWithLoyalty = createNewBusinessWithLoyalty;
const createBusinessFromMerchantInfo = (name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside createBusinessFromMerchantInfo');
    // First, we need to make sure the tokens are valid, so we'll get the latest merchant info first
    (0, MerchantService_1.getMerchantInfo)(merchantId, accessToken, function (merchant) {
        var _a;
        if (merchant) {
            console.log('got merchant, calling createBusinessEntity');
            var merchantName = (_a = merchant.businessName) !== null && _a !== void 0 ? _a : undefined;
            createBusinessEntity(merchantId, merchantName, accessToken, refreshToken, expirationDate, function (business) {
                console.log('returned from createBusinessEntity with business: ' + business);
                callback(business);
                return;
            });
        }
        else {
            console.log('returing empty business');
            callback(undefined);
        }
    });
});
exports.createBusinessFromMerchantInfo = createBusinessFromMerchantInfo;
const createBusinessEntity = (merchantId, merchantName, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    const business = appDataSource_1.AppDataSource.manager.create(Business_1.Business, {
        name: merchantName !== null && merchantName !== void 0 ? merchantName : 'unknown',
        businessName: merchantName !== null && merchantName !== void 0 ? merchantName : 'unknown',
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
    console.log('just created business with id: ' + business.businessId);
    callback(business);
    // updateBusinessWithBusinessIdToken(businessRepository, business.businessId, merchantId, function(wasSuccessful: boolean) {
    //   callback(wasSuccessful ? business : undefined);
    // })
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
    console.log('just updated business with id: ' + business.businessId);
    callback(business);
});
exports.updateBusinessEntity = updateBusinessEntity;
const updateBusinessDetails = (businessId, lastUpdateDate, businessName, addressLine1, addressLine2, city, state, zipCode, phone, hoursOfOperation, businessDescription, websiteUrl, appStoreUrl, googlePlayStoreUrl, reviewsUrl, firstImageUrl, secondImageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateBusinessDetails');
    try {
        // First make sure the business does exist
        const business = yield Business_1.Business.createQueryBuilder('business')
            .where('business.businessId = :businessId', { businessId: businessId })
            .getOne();
        if (!business) {
            return false;
        }
        const lastUpdate = new Date(lastUpdateDate);
        console.log('firstImageUrl:' + firstImageUrl + ', secondImageUrl:' + secondImageUrl);
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
        console.log('Error returned while getting business by id: ' + err);
        return false;
    }
});
exports.updateBusinessDetails = updateBusinessDetails;
const findBusinessByMerchantId = (merchantId, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside findBusinessByMerchantId');
    try {
        const business = yield Business_1.Business.createQueryBuilder('business')
            .where('business.merchantId = :merchantId', { merchantId: merchantId })
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
