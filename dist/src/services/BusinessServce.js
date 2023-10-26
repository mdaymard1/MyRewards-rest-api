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
const createNewBusiness = (businessRepository, name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("creating new business");
    createBusinessEntity(businessRepository, name, merchantId, accessToken, refreshToken, expirationDate, function (newBusiness) {
        if (newBusiness) {
            var token = "";
            token = decryptToken(business.accessToken);
            if (token) {
                getMainLoyaltyProgramFromMerchant(token, function (loyaltyProgram, promotions, accrualType, categoryIdMap) {
                    console.log("got back program: " + loyaltyProgram.id + ", promo count: " + promotions.length + ", accrualType: " + accrualType + ", categoryIdMap count: " + categoryIdMap.size);
                    if (loyaltyProgram) {
                        if (loyalty) {
                            response.send(loyalty);
                        }
                        else {
                            createAppLoyaltyFromLoyaltyProgram(business.businessId, loyaltyProgram, promotions, categoryIdMap, function (newLoyalty) {
                                if (newLoyalty) {
                                    getCurrentLoyaltyById(newLoyalty.id, loyaltyRepository, function (loyalty) {
                                        if (loyalty) {
                                            response.send(loyalty);
                                        }
                                        else {
                                            response.status(500);
                                            response.end();
                                            return;
                                        }
                                    });
                                }
                            });
                        }
                    }
                    else {
                        // If no merchant loyalty is found, we should probably check app loyalty and remove it
                        response.status(404);
                        response.end();
                    }
                });
            }
            else {
                //TODO: How do we handle an invalid encrypted token? Need to notifiy someone
            }
        }
    });
});
const createBusinessEntity = (businessRepository, name, merchantId, accessToken, refreshToken, expirationDate, callback) => __awaiter(void 0, void 0, void 0, function* () {
    const business = businessRepository.create({
        name: name,
        merchantId: merchantId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        accessTokenExpirationDate: expirationDate,
    });
    yield businessRepository.save(business);
    console.log("just created business with id: " + business.businessId);
    callback(business);
});
module.exports = {
    createNewBusiness,
};
