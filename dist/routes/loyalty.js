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
exports.deleteEnrollmentRequest = exports.enrollRequest = exports.getCustomers = exports.getEnrollmentRequests = void 0;
const appDataSource_1 = require("../appDataSource");
const Business_1 = require("../src/entity/Business");
const Loyalty_1 = require("../src/entity/Loyalty");
const MerchantService_1 = require("../src/services/MerchantService");
const BusinessService_1 = require("../src/services/BusinessService");
const EncryptionService_1 = require("../src/services/EncryptionService");
const LoyaltyService_1 = require("../src/services/LoyaltyService");
const getEnrollmentRequests = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getEnrollmentRequests");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { pageNumber, pageSize } = request.query;
    const page = Number(pageNumber);
    const size = Number(pageSize);
    console.log("pageNumber: " + pageNumber + ", page: " + page);
    console.log("pageSize: " + pageSize + ", size: " + size);
    const results = yield (0, LoyaltyService_1.getPaginatedEnrollmentRequests)(businessId, page, size);
    // console.log('results: ' + results);
    response.send(results);
});
exports.getEnrollmentRequests = getEnrollmentRequests;
const getCustomers = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getCustomers");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { pageNumber, pageSize } = request.query;
    const page = Number(pageNumber);
    const size = Number(pageSize);
    console.log("pageNumber: " + pageNumber + ", page: " + page);
    console.log("pageSize: " + pageSize + ", size: " + size);
    const results = yield (0, LoyaltyService_1.getPaginatedCustomers)(businessId, page, size);
    response.send(results);
});
exports.getCustomers = getCustomers;
const enrollRequest = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside enrollRequest ");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const business = yield appDataSource_1.AppDataSource.manager.findOne(Business_1.Business, {
        where: {
            businessId: businessId,
        },
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    const { enrollmentRequestId } = request.params;
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (token) {
        const wasSuccessful = yield (0, LoyaltyService_1.enrollRequestIntoLoyalty)(businessId, token, enrollmentRequestId);
        response.status(wasSuccessful ? 200 : 400);
        response.end();
    }
    else {
        response.status(400);
        response.end();
    }
});
exports.enrollRequest = enrollRequest;
const deleteEnrollmentRequest = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside deleteEnrollmentRequest");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { enrollmentRequestId } = request.params;
    let wasDeleteSuccessful = yield (0, LoyaltyService_1.deleteRequestedEnrollment)(enrollmentRequestId);
    response.status(wasDeleteSuccessful ? 200 : 400);
    response.end();
});
exports.deleteEnrollmentRequest = deleteEnrollmentRequest;
const requestEnrollment = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside requestEnrollment");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const business = yield appDataSource_1.AppDataSource.manager.findOne(Business_1.Business, {
        where: {
            businessId: businessId,
        },
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    const { firstName, lastName, phone, email } = request.body;
    if (!firstName || !lastName || !phone) {
        console.log("missing fields");
        response.status(401);
        response.end();
        return;
    }
    // let digitRegExp = /^\d+$/;
    console.log("received input of " +
        firstName +
        " " +
        lastName +
        " " +
        phone +
        ", " +
        email);
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    const newEnrollmentId = yield (0, LoyaltyService_1.createEnrollmentRequest)(businessId, firstName, lastName, phone, email);
    response.status(newEnrollmentId ? 200 : 400);
    response.end();
});
const enrollCustomer = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside enrollCustomer");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const business = yield appDataSource_1.AppDataSource.manager.findOne(Business_1.Business, {
        where: {
            businessId: businessId,
        },
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    const { firstName, lastName, phone, email } = request.body;
    if (!firstName || !lastName || !phone) {
        console.log("missing fields");
        response.status(401);
        response.end();
        return;
    }
    // let digitRegExp = /^\d+$/;
    console.log("received input of " +
        firstName +
        " " +
        lastName +
        " +" +
        phone +
        ", " +
        email);
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (token) {
        yield (0, LoyaltyService_1.enrollCustomerInLoyalty)(businessId, token, firstName, lastName, phone, LoyaltyService_1.EnrollmentSourceType.RewardsApp, email);
        response.status(201);
        response.end();
    }
});
const getLoyalty = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getLoyalty");
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    // First, we'll get the Business so we can grab the access token and merchantId
    const business = yield appDataSource_1.AppDataSource.manager.findOne(Business_1.Business, {
        where: {
            businessId: businessId,
        },
    });
    if (!business) {
        response.status(404);
        response.end();
        return;
    }
    const loyalty = yield appDataSource_1.AppDataSource.manager.findOne(Loyalty_1.Loyalty, {
        where: {
            businessId: businessId,
        },
    });
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (token) {
        (0, MerchantService_1.getMainLoyaltyProgramFromMerchant)(token, function (loyaltyProgram, promotions, accrualType, catalogItemNameMap) {
            console.log("got back program: " +
                (loyaltyProgram === null || loyaltyProgram === void 0 ? void 0 : loyaltyProgram.id) +
                ", promo count: " +
                (promotions === null || promotions === void 0 ? void 0 : promotions.length) +
                ", accrualType: " +
                accrualType +
                ", categoryIdMap count: " +
                (catalogItemNameMap === null || catalogItemNameMap === void 0 ? void 0 : catalogItemNameMap.size));
            if (loyaltyProgram) {
                if (loyalty) {
                    if ((0, LoyaltyService_1.isLoyaltyOrPromotionsOutOfDate)(loyalty, loyaltyProgram, promotions)) {
                        console.log("loyalty is out of date");
                        (0, LoyaltyService_1.updateAppLoyaltyFromMerchant)(loyalty, loyaltyProgram, promotions, catalogItemNameMap, function (updatedloyalty) {
                            console.log("done updating loyalty");
                            if (updatedloyalty) {
                                //Get a refreshed loyalty
                                console.log("loyalty updated, now getting refreshed version");
                                getCurrentLoyaltyById(updatedloyalty.id, function (refreshedLoyalty) {
                                    if (refreshedLoyalty) {
                                        response.send(refreshedLoyalty);
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
                        console.log("loyalty is not out of date");
                        response.send(loyalty);
                    }
                }
                else {
                    (0, LoyaltyService_1.createAppLoyaltyFromLoyaltyProgram)(business.businessId, loyaltyProgram, promotions, catalogItemNameMap, function (newLoyalty) {
                        if (newLoyalty) {
                            getCurrentLoyaltyById(newLoyalty.id, function (loyalty) {
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
                        else {
                            response.status(500);
                            response.end();
                            return;
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
    // if (!loyalty) {
    //       response.status(404);
    //       response.end();
    //       return;
    //   }
    // return loaded post
    // response.send(loyalty);
});
const updateLoyalty = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { loyaltyId } = request.params;
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    console.log("businessId: " + businessId + ", + loyaltyId " + loyaltyId);
    if (!businessId || !loyaltyId) {
        console.log("missing input");
        response.status(400);
        response.end();
        return;
    }
    const { loyaltyAccruals, promotions, loyaltyRewardTiers } = request.body;
    if (!loyaltyAccruals && !promotions && !loyaltyRewardTiers) {
        response.status(400);
        response.end();
        return;
    }
    (0, LoyaltyService_1.updateLoyaltyItems)(businessId, loyaltyId, loyaltyAccruals, promotions, loyaltyRewardTiers, function (wasSuccessful) {
        response.status(wasSuccessful ? 204 : 404);
        response.end();
    });
});
const updateLoyaltyStatus = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { loyaltyId } = request.params;
    // console.log("showLoyaltyInApp: " + showLoyaltyInApp);
    const businessId = (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    console.log("businessId: " + businessId + ", + loyaltyId" + loyaltyId);
    const { showLoyaltyInApp, showPromotionsInApp, automaticallyUpdateChangesFromMerchant, loyaltyStatus, } = request.body;
    if (!businessId || !loyaltyStatus) {
        console.log("missing input");
        response.status(400);
        response.end();
        return;
    }
    if (typeof showLoyaltyInApp != "boolean" ||
        typeof showPromotionsInApp != "boolean" ||
        typeof automaticallyUpdateChangesFromMerchant != "boolean") {
        console.log("input fields not boolean");
        response.status(400);
        response.end();
        return;
    }
    if (!isValidLoyaltyStatus(loyaltyStatus)) {
        response.status(400);
        response.end();
        return;
    }
    (0, LoyaltyService_1.updateLoyaltyStatuses)(businessId, loyaltyId, showLoyaltyInApp, showPromotionsInApp, automaticallyUpdateChangesFromMerchant, loyaltyStatus, function (wasSuccessful) {
        response.status(wasSuccessful ? 204 : 500);
        response.end();
    });
});
function isValidLoyaltyStatus(value) {
    return Object.values(LoyaltyService_1.LoyaltyStatusType).includes(value);
}
const getCurrentLoyaltyById = (loyaltyId, callback) => __awaiter(void 0, void 0, void 0, function* () {
    const loyalty = yield appDataSource_1.AppDataSource.manager.findOne(Loyalty_1.Loyalty, {
        where: {
            id: loyaltyId,
        },
    });
    callback(loyalty);
});
module.exports = {
    deleteEnrollmentRequest: exports.deleteEnrollmentRequest,
    enrollCustomer,
    enrollRequest: exports.enrollRequest,
    getEnrollmentRequests: exports.getEnrollmentRequests,
    getCustomers: exports.getCustomers,
    getLoyalty,
    requestEnrollment,
    updateLoyalty,
    updateLoyaltyStatus,
};
