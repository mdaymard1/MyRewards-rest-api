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
exports.getMainLoyaltyProgramFromMerchant = exports.getMerchantInfo = void 0;
const square_1 = require("square");
const EncryptionService_1 = require("./EncryptionService");
const getMerchantInfo = (merchantId, accessToken, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log("inside getMerchantInfo");
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    console.log("converted encrypted token: " + accessToken + " to " + token);
    console.log("merchantId: " + merchantId);
    const client = new square_1.Client({
        accessToken: token,
        environment: square_1.Environment.Sandbox,
    });
    const { merchantsApi } = client;
    try {
        const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
        if ((_a = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _a === void 0 ? void 0 : _a.merchant) {
            console.log("returning merchant for id: " + ((_c = (_b = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _b === void 0 ? void 0 : _b.merchant) === null || _c === void 0 ? void 0 : _c.id));
            callback((_d = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _d === void 0 ? void 0 : _d.merchant);
        }
        else {
            callback(undefined);
        }
    }
    catch (err) {
        console.log("merchantsApi.retrieveMerchant returned an error: " + err);
        callback(undefined);
    }
});
exports.getMerchantInfo = getMerchantInfo;
const getMainLoyaltyProgramFromMerchant = (token, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j;
    console.log("token: " + token);
    const client = new square_1.Client({
        accessToken: token,
        environment: square_1.Environment.Sandbox,
    });
    const { catalogApi, loyaltyApi } = client;
    try {
        let loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram("main");
        console.log("response: " + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        const program = (_e = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _e === void 0 ? void 0 : _e.program;
        if (!program) {
            callback(undefined);
            return;
        }
        console.log("program id: " + program.id);
        var promotions = [];
        let promotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "ACTIVE");
        console.log("response: " + (promotionsResponse === null || promotionsResponse === void 0 ? void 0 : promotionsResponse.result));
        if (!promotionsResponse) {
            callback(undefined);
        }
        if ((_f = promotionsResponse.result) === null || _f === void 0 ? void 0 : _f.loyaltyPromotions) {
            promotions = promotionsResponse.result.loyaltyPromotions;
        }
        let scheduledPromotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "SCHEDULED");
        console.log("scheduledPromotionsResponse: " + (scheduledPromotionsResponse === null || scheduledPromotionsResponse === void 0 ? void 0 : scheduledPromotionsResponse.result));
        if ((_g = scheduledPromotionsResponse.result) === null || _g === void 0 ? void 0 : _g.loyaltyPromotions) {
            scheduledPromotionsResponse.result.loyaltyPromotions.forEach(function (promo) {
                promotions.push(promo);
            });
        }
        var categoryIds = [];
        var categoryNameMap = new Map();
        var accrualType = "";
        // Loop through each tier to determine its type
        if (program.accrualRules) {
            program.accrualRules.forEach(function (accrualRule) {
                var _a;
                console.log(accrualRule.accrualType);
                if (accrualRule.accrualType == "CATEGORY" && ((_a = accrualRule.categoryData) === null || _a === void 0 ? void 0 : _a.categoryId)) {
                    accrualType = "CATEGORY";
                    categoryIds.push(accrualRule.categoryData.categoryId);
                }
                else if (accrualRule.accrualType == "VISIT") {
                    accrualType = "VISIT";
                }
                else if (accrualRule.accrualType == "SPEND") {
                    accrualType = "SPEND";
                }
                else if (accrualRule.accrualType == "ITEM") {
                    accrualType = "ITEM";
                }
            });
            if (categoryIds.length > 0) {
                var catIds = [];
                categoryIds.forEach(function (categoryId) {
                    catIds.push(categoryId.toString());
                });
                const body = {
                    objectIds: catIds,
                    includeRelatedObjects: true,
                    includeDeletedObjects: false,
                };
                var categoryResults = yield catalogApi.batchRetrieveCatalogObjects(body);
                if ((_h = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _h === void 0 ? void 0 : _h.objects) {
                    (_j = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _j === void 0 ? void 0 : _j.objects.forEach(function (catalogObject) {
                        var _a;
                        if (catalogObject.type == "CATEGORY" && ((_a = catalogObject.categoryData) === null || _a === void 0 ? void 0 : _a.name)) {
                            console.log("received a category back");
                            categoryNameMap.set(catalogObject.id, catalogObject.categoryData.name);
                        }
                    });
                }
            }
        }
        callback(program, promotions, accrualType, categoryNameMap);
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            error.result.errors.forEach(function (e) {
                console.log(e.category);
                console.log(e.code);
                console.log(e.detail);
            });
        }
        else {
            console.log("Unexpected error occurred while getting loyalty program: ", error);
        }
    }
});
exports.getMainLoyaltyProgramFromMerchant = getMainLoyaltyProgramFromMerchant;
module.exports = {
    getMerchantInfo: exports.getMerchantInfo,
    getMainLoyaltyProgramFromMerchant: exports.getMainLoyaltyProgramFromMerchant,
};
