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
const typeorm_1 = require("typeorm");
const Business_1 = require("../src/entity/Business");
const EncryptionService_1 = require("../src/services/EncryptionService");
const BusinessService_1 = require("../src/services/BusinessService");
const getBusiness = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    // const key = "f7fbba6e0636f890e56fbbf3283e524c";
    // const encryptionIV = "d82c4eb5261cb9c8";
    // const algorithm = "aes-256-cbc";
    // const cipher = crypto.createCipheriv(
    //   algorithm, Buffer.from(key), encryptionIV);
    // let encrypted = cipher.update("98da4a73-d817-45d4-ac17-8727bab88cbf", "utf8", "base64");
    // encrypted += cipher.final("base64");
    // console.log("encrypted: " + encrypted.toString("hex"))
    // return encrypted.toString("hex");
    const encoded = Buffer.from("EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_", 'utf8').toString('base64');
    const encryptedKey = (0, EncryptionService_1.encryptToken)("EAAAEYQN7Eyq8Zx5TKdvij2iMg1wx7IqZWbwjPwzMIrFjcTeKSLTMWU0KmC2aTN_");
    const { id } = request.params;
    if (!id) {
        response.status(400);
        return;
    }
    const businessRepository = (0, typeorm_1.getManager)().getRepository(Business_1.Business);
    const business = yield businessRepository.findOne({
        where: {
            businessId: id
        }
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    response.send(business);
});
const createBusiness = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { merchantId, accessToken, refreshToken, expirationDate, } = request.body;
    var businessId = undefined;
    var encryptedBusinessIdToken;
    businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    console.log("businessId: " + businessId);
    var date;
    console.log("expirationDate: " + expirationDate);
    if (expirationDate) {
        date = new Date(expirationDate);
    }
    const businessRepository = (0, typeorm_1.getManager)().getRepository(Business_1.Business);
    if (businessId) {
        const business = yield businessRepository.findOne({
            where: {
                businessId: businessId
            }
        });
        if (business) {
            console.log("found business");
            // Business found, so update it with the latest tokens and exp date
            (0, BusinessService_1.updateBusinessEntity)(businessRepository, businessId, merchantId, accessToken, refreshToken, expirationDate, business, function (updatedBusiness) {
                if (updatedBusiness === null || updatedBusiness === void 0 ? void 0 : updatedBusiness.businessId) {
                    var businessResponse = Object();
                    businessResponse.id = updatedBusiness.businessId;
                    response.send(businessResponse);
                }
                else {
                    response.status(500);
                    response.end();
                    return;
                }
            });
        }
        else {
            // This should never happen where an auth token is passed with business id, but no corresponding business is found
            // If it does, the client should remove their businessId and resubmit
            response.status(404);
            response.end();
            return;
        }
    }
    else if (merchantId) {
        // lookup business by merchantId. If it's already been created, update it with the latest tokens and exp date
        (0, BusinessService_1.findBusinessByMerchantId)(merchantId, function (business) {
            if (business) {
                console.log("Found business for merchantId");
                (0, BusinessService_1.updateBusinessEntity)(businessRepository, business.businessId, merchantId, accessToken, refreshToken, expirationDate, business, function (updatedBusiness) {
                    if (updatedBusiness === null || updatedBusiness === void 0 ? void 0 : updatedBusiness.businessId) {
                        var businessResponse = Object();
                        businessResponse.id = updatedBusiness.businessId;
                        response.send(businessResponse);
                    }
                    else {
                        response.status(500);
                        response.end();
                        return;
                    }
                });
            }
            else {
                (0, BusinessService_1.createNewBusinessWithLoyalty)(businessRepository, undefined, merchantId, accessToken, refreshToken, expirationDate, function (newBusiness) {
                    if (newBusiness === null || newBusiness === void 0 ? void 0 : newBusiness.businessId) {
                        var businessResponse = Object();
                        businessResponse.id = newBusiness.businessId;
                        response.send(businessResponse);
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
    else {
        // No businessId or merchantId passed, so we can't look anything up to create or update a business
        response.status(404);
        response.end();
        return;
    }
});
module.exports = {
    getBusiness,
    createBusiness,
};
