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
exports.getCatalogItemIdMapFromAccurals = exports.getMainLoyaltyProgramFromMerchant = exports.getMerchantInfo = void 0;
const square_1 = require("square");
const EncryptionService_1 = require("./EncryptionService");
const getMerchantInfo = (merchantId, accessToken, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log('inside getMerchantInfo');
    var token = '';
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    console.log('converted encrypted token: ' + accessToken + ' to ' + token);
    console.log('merchantId: ' + merchantId);
    const client = new square_1.Client({
        accessToken: token,
        environment: square_1.Environment.Sandbox,
    });
    const { merchantsApi } = client;
    try {
        const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
        if ((_a = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _a === void 0 ? void 0 : _a.merchant) {
            console.log('returning merchant for id: ' + ((_c = (_b = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _b === void 0 ? void 0 : _b.merchant) === null || _c === void 0 ? void 0 : _c.id));
            callback((_d = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _d === void 0 ? void 0 : _d.merchant);
        }
        else {
            callback(undefined);
        }
    }
    catch (err) {
        console.log('merchantsApi.retrieveMerchant returned an error: ' + err);
        callback(undefined);
    }
});
exports.getMerchantInfo = getMerchantInfo;
const getMainLoyaltyProgramFromMerchant = (token, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g;
    console.log('token: ' + token);
    const client = new square_1.Client({
        accessToken: token,
        environment: square_1.Environment.Sandbox,
    });
    const { catalogApi, loyaltyApi } = client;
    try {
        let loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram('main');
        console.log('response: ' + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        const program = (_e = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _e === void 0 ? void 0 : _e.program;
        if (!program) {
            callback(undefined);
            return;
        }
        console.log('program id: ' + program.id);
        var promotions = [];
        let promotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, 'ACTIVE');
        console.log('response: ' + (promotionsResponse === null || promotionsResponse === void 0 ? void 0 : promotionsResponse.result));
        if (!promotionsResponse) {
            callback(undefined);
            return;
        }
        if ((_f = promotionsResponse.result) === null || _f === void 0 ? void 0 : _f.loyaltyPromotions) {
            promotions = promotionsResponse.result.loyaltyPromotions;
        }
        let scheduledPromotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, 'SCHEDULED');
        console.log('scheduledPromotionsResponse: ' + (scheduledPromotionsResponse === null || scheduledPromotionsResponse === void 0 ? void 0 : scheduledPromotionsResponse.result));
        if ((_g = scheduledPromotionsResponse.result) === null || _g === void 0 ? void 0 : _g.loyaltyPromotions) {
            scheduledPromotionsResponse.result.loyaltyPromotions.forEach(function (promo) {
                promotions.push(promo);
            });
        }
        var categoryIds = [];
        // var categoryNameMap = new Map<string, string>();
        var accrualType = '';
        // Loop through each tier to determine its type
        if (program.accrualRules) {
            (0, exports.getCatalogItemIdMapFromAccurals)(token, program.accrualRules, function (catalogItemNameMap) {
                callback(program, promotions, accrualType, catalogItemNameMap);
                return;
            });
        }
        else {
            callback(program, promotions, accrualType, new Map());
        }
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
            console.log('Unexpected error occurred while getting loyalty program: ', error);
        }
        callback(undefined);
    }
});
exports.getMainLoyaltyProgramFromMerchant = getMainLoyaltyProgramFromMerchant;
const getCatalogItemIdMapFromAccurals = (token, accrualRules, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k, _l, _m;
    console.log('inside getCatalogItemIdMapFromAccurals');
    var catalogItemIds = [];
    var itemNameMap = new Map();
    var variantItemMap = new Map();
    // Loop through each accrual rule to determine its type
    for (var accrualRule of accrualRules) {
        console.log(accrualRule.accrualType);
        if (accrualRule.accrualType == 'CATEGORY' &&
            ((_h = accrualRule.categoryData) === null || _h === void 0 ? void 0 : _h.categoryId)) {
            catalogItemIds.push(accrualRule.categoryData.categoryId);
            console.log('adding categoryId: ' +
                accrualRule.categoryData.categoryId +
                ' to lookup list');
        }
        else if (accrualRule.accrualType == 'ITEM_VARIATION' &&
            ((_j = accrualRule.itemVariationData) === null || _j === void 0 ? void 0 : _j.itemVariationId)) {
            catalogItemIds.push(accrualRule.itemVariationData.itemVariationId);
            variantItemMap.set(accrualRule.itemVariationData.itemVariationId, accrualRule.itemVariationData.itemVariationId);
            console.log('adding itemId: ' +
                accrualRule.itemVariationData.itemVariationId +
                ' to lookup list');
        }
    }
    if (catalogItemIds.length > 0) {
        console.log('Fetching items from catalog to get item names');
        const client = new square_1.Client({
            accessToken: token,
            environment: square_1.Environment.Sandbox,
        });
        const { catalogApi } = client;
        var itemIds = [];
        catalogItemIds.forEach(function (itemId) {
            itemIds.push(itemId.toString());
        });
        const body = {
            objectIds: itemIds,
            includeRelatedObjects: true,
            includeDeletedObjects: false,
        };
        var categoryResults = yield catalogApi.batchRetrieveCatalogObjects(body);
        if ((_k = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _k === void 0 ? void 0 : _k.objects) {
            (_l = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _l === void 0 ? void 0 : _l.objects.forEach(function (catalogObject) {
                var _a;
                if (catalogObject.type == 'CATEGORY' &&
                    ((_a = catalogObject.categoryData) === null || _a === void 0 ? void 0 : _a.name)) {
                    console.log('received a category back: ' + catalogObject.categoryData.name);
                    itemNameMap.set(catalogObject.id, catalogObject.categoryData.name);
                }
            });
        }
        console.log('searching related objects for variantIds');
        // Items are returned in relatedObjects, so we must loop thru its variants
        // to look for a match on variant id and then take it's parent (item) name
        if (categoryResults.result.relatedObjects) {
            for (var relatedObject of categoryResults.result.relatedObjects) {
                if (relatedObject.type == 'ITEM' &&
                    ((_m = relatedObject.itemData) === null || _m === void 0 ? void 0 : _m.variations)) {
                    for (var variant of relatedObject.itemData.variations) {
                        const variantFromMap = variantItemMap.get(variant.id);
                        if (variantFromMap) {
                            if (relatedObject.itemData.name) {
                                console.log('received an item back: ' + relatedObject.itemData.name);
                                itemNameMap.set(variant.id, relatedObject.itemData.name);
                            }
                        }
                    }
                }
            }
        }
        callback(itemNameMap);
    }
    else {
        callback(itemNameMap);
    }
});
exports.getCatalogItemIdMapFromAccurals = getCatalogItemIdMapFromAccurals;
module.exports = {
    getCatalogItemIdMapFromAccurals: exports.getCatalogItemIdMapFromAccurals,
    getMerchantInfo: exports.getMerchantInfo,
    getMainLoyaltyProgramFromMerchant: exports.getMainLoyaltyProgramFromMerchant,
};
