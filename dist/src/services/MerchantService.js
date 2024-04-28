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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogItemIdMapFromAccurals = exports.getMainLoyaltyProgramFromMerchant = exports.getMerchantLocation = exports.getMerchantLocations = exports.getMerchantInfo = exports.upsertMerchantCustomerAccount = exports.lookupMerchantCustomerIdByPhoneNumber = exports.createLoyaltyAccount = exports.getAvailableRewardsForLoyaltyBalance = exports.getMerchantForToken = void 0;
const square_1 = require("square");
const EncryptionService_1 = require("./EncryptionService");
const Utility_1 = require("../utility/Utility");
const dotenv_1 = __importDefault(require("dotenv"));
const RewardDetails_1 = require("./entity/RewardDetails");
const getMerchantForToken = (merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("inside verifyMerchantToken");
    const decryptedToken = (0, EncryptionService_1.decryptToken)(accessToken);
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: decryptedToken,
        environment: env,
    });
    const { merchantsApi } = client;
    const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
    if ((_a = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _a === void 0 ? void 0 : _a.merchant) {
        return merchantResponse.result.merchant;
    }
    else {
        return null;
    }
});
exports.getMerchantForToken = getMerchantForToken;
const getAvailableRewardsForLoyaltyBalance = (customerBalance, rewardTiers) => {
    var _a;
    console.log("inside getAvailableRewardsForLoyaltyBalance");
    var rewardDetails = [];
    if (customerBalance < 1) {
        return rewardDetails;
    }
    for (var rewardTier of rewardTiers) {
        const descSplit = rewardTier.merchantReward.split(" ");
        if (descSplit.length == 2) {
            const numberOfPointsRequired = parseInt(descSplit[0]);
            var rewardDescription = (_a = rewardTier.displayRewardDescription) !== null && _a !== void 0 ? _a : rewardTier.merchantRewardDescription;
            if (customerBalance >= numberOfPointsRequired) {
                rewardDetails.push(new RewardDetails_1.RewardDetails("earned", rewardDescription));
            }
            else {
                const percentToRequiredPoints = customerBalance / numberOfPointsRequired;
                // If balance is 80% of required points, add a message that they're close to earning the reward
                if (percentToRequiredPoints >= 0.8) {
                    rewardDetails.push(new RewardDetails_1.RewardDetails("near", rewardDescription, numberOfPointsRequired - customerBalance));
                }
            }
        }
    }
    return rewardDetails;
};
exports.getAvailableRewardsForLoyaltyBalance = getAvailableRewardsForLoyaltyBalance;
const createLoyaltyAccount = (accessToken, loyaltyProgramId, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    console.log("inside createLoyaltyAccount with");
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const crypto = require("crypto");
    let idempotencyKey = crypto.randomUUID();
    const createLoyaltyBody = {
        loyaltyAccount: {
            programId: loyaltyProgramId,
            mapping: {
                phoneNumber: phoneNumber,
            },
        },
        idempotencyKey: idempotencyKey,
    };
    const { loyaltyApi } = client;
    console.log("calling createLoyaltyAccount");
    try {
        let createLoyaltyAccountResponse = yield loyaltyApi.createLoyaltyAccount(createLoyaltyBody);
        if (createLoyaltyAccountResponse) {
            console.log("just created loyalty account in square");
        }
        return (_b = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _b === void 0 ? void 0 : _b.customerId;
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            const errors = error.result;
            const { statusCode, headers } = error;
            console.log("Got an error while creating loyalty account: " + statusCode);
            if (error.errors && error.errors.length > 0) {
                console.log("error: " + error.errors[0].detail);
            }
        }
        return null;
    }
});
exports.createLoyaltyAccount = createLoyaltyAccount;
const lookupMerchantCustomerIdByPhoneNumber = (accessToken, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside lookupCustomerByPhoneNumber");
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const body = {
        query: {
            filter: {
                phoneNumber: {
                    exact: phoneNumber,
                },
            },
        },
    };
    const { customersApi } = client;
    try {
        let searchCustomerResponse = yield customersApi.searchCustomers(body);
        if (searchCustomerResponse.result.customers &&
            searchCustomerResponse.result.customers.length > 0) {
            console.log("found customer");
            return searchCustomerResponse.result.customers[0].id;
        }
        console.log("customer not found");
        return null;
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            const errors = error.result;
            const { statusCode, headers } = error;
            console.log("Got an error while creating square customer: " + statusCode);
            if (error.errors && error.errors.length > 0) {
                console.log("error: " + error.errors[0].detail);
            }
        }
        return null;
    }
});
exports.lookupMerchantCustomerIdByPhoneNumber = lookupMerchantCustomerIdByPhoneNumber;
const upsertMerchantCustomerAccount = (accessToken, merchantCustomerId, appCustomerId, phone, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    console.log("inside upsertMerchantCustomerAccount");
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const { customersApi } = client;
    try {
        let retrieveCustomerResponse = yield customersApi.retrieveCustomer(merchantCustomerId);
        let existingCustomer = retrieveCustomerResponse.result.customer;
        // Only update fields that are missing
        if (existingCustomer) {
            console.log("found customer account. updating...");
            const body = {
                givenName: (_c = existingCustomer.givenName) !== null && _c !== void 0 ? _c : firstName,
                familyName: (_d = existingCustomer.familyName) !== null && _d !== void 0 ? _d : lastName,
                emailAddress: (_e = existingCustomer.emailAddress) !== null && _e !== void 0 ? _e : email,
                referenceId: appCustomerId,
            };
            let updateCustomerResponse = yield customersApi.updateCustomer(merchantCustomerId, body);
            return existingCustomer.id;
        }
        else {
            console.log("customer not returned in response");
        }
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            if (error.errors && error.errors.length > 0) {
                console.log("error: " + error.errors[0].detail);
            }
        }
        else {
            console.log("some unexpected error: " + error);
        }
        return null;
    }
});
exports.upsertMerchantCustomerAccount = upsertMerchantCustomerAccount;
const getMerchantInfo = (merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    console.log("inside getMerchantInfo");
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    const env = (0, Utility_1.getMerchantEnvironment)();
    console.log("env: " + env);
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: token,
        environment: env,
    });
    const { merchantsApi } = client;
    try {
        const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
        if ((_f = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _f === void 0 ? void 0 : _f.merchant) {
            console.log("returning merchant");
            return merchantResponse.result.merchant;
        }
        else {
            return undefined;
        }
    }
    catch (err) {
        console.log("merchantsApi.retrieveMerchant returned an error: " + err);
        return undefined;
    }
});
exports.getMerchantInfo = getMerchantInfo;
const getMerchantLocations = (merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getMerchantLocations");
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    const env = (0, Utility_1.getMerchantEnvironment)();
    console.log("env: " + env);
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: token,
        environment: env,
    });
    const { locationsApi } = client;
    try {
        const listLocationsResponse = yield locationsApi.listLocations();
        return listLocationsResponse.result.locations;
    }
    catch (error) {
        console.log("locationsApi.listLocations returned an error: " + error);
        return undefined;
    }
});
exports.getMerchantLocations = getMerchantLocations;
const getMerchantLocation = (merchantLocationId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside getMerchantLocation");
    const env = (0, Utility_1.getMerchantEnvironment)();
    console.log("env: " + env);
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const { locationsApi } = client;
    try {
        const listLocationsResponse = yield locationsApi.retrieveLocation(merchantLocationId);
        console.log("Returning location");
        return listLocationsResponse.result.location;
    }
    catch (error) {
        console.log("locationsApi.retrieveLocation returned an error: " + error);
        return undefined;
    }
});
exports.getMerchantLocation = getMerchantLocation;
const getMerchantsMainLoyaltyProgram = (token) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    console.log("inside getMerchantsMainLoyaltyProgram");
    dotenv_1.default.config();
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: token,
        environment: env,
    });
    const { catalogApi, loyaltyApi } = client;
    try {
        const loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram("main");
        console.log("returning loyalty");
        return (_g = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _g === void 0 ? void 0 : _g.program;
    }
    catch (error) {
        console.log("Error thrown in getMerchantsMainLoyaltyProgram: " + error);
        return null;
    }
});
const getMainLoyaltyProgramFromMerchant = (token) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k;
    console.log("inside getMainLoyaltyProgramFromMerchant");
    dotenv_1.default.config();
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: token,
        environment: env,
    });
    const { catalogApi, loyaltyApi } = client;
    try {
        const loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram("main");
        const program = (_h = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _h === void 0 ? void 0 : _h.program;
        if (!program) {
            return undefined;
        }
        var promotions = [];
        let promotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "ACTIVE");
        if (!promotionsResponse) {
            return undefined;
        }
        if ((_j = promotionsResponse.result) === null || _j === void 0 ? void 0 : _j.loyaltyPromotions) {
            promotions = promotionsResponse.result.loyaltyPromotions;
        }
        let scheduledPromotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "SCHEDULED");
        console.log("scheduledPromotionsResponse");
        if ((_k = scheduledPromotionsResponse.result) === null || _k === void 0 ? void 0 : _k.loyaltyPromotions) {
            scheduledPromotionsResponse.result.loyaltyPromotions.forEach(function (promo) {
                promotions.push(promo);
            });
        }
        var categoryIds = [];
        // var categoryNameMap = new Map<string, string>();
        var accrualType = "";
        // Loop through each tier to determine its type
        if (program.accrualRules) {
            const catalogItemNameMap = yield (0, exports.getCatalogItemIdMapFromAccurals)(token, program.accrualRules
            // function (catalogItemNameMap: Map<string, string>) {
            );
            return {
                program: program,
                promotions: promotions,
                accrualType: accrualType,
                catalogItemNameMap: catalogItemNameMap,
            };
        }
        else {
            return {
                program: program,
                promotions: promotions,
                accrualType: accrualType,
                catalogItemNameMap: new Map(),
            };
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
            console.log("Unexpected error occurred while getting loyalty program: ", error);
        }
        return undefined;
    }
});
exports.getMainLoyaltyProgramFromMerchant = getMainLoyaltyProgramFromMerchant;
const getCatalogItemIdMapFromAccurals = (token, accrualRules) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p, _q;
    console.log("inside getCatalogItemIdMapFromAccurals");
    var catalogItemIds = [];
    var itemNameMap = new Map();
    var variantItemMap = new Map();
    console.log("accrualRules size: " + accrualRules.length);
    // Loop through each accrual rule to determine its type
    for (var accrualRule of accrualRules) {
        if (accrualRule.accrualType == "CATEGORY" &&
            ((_l = accrualRule.categoryData) === null || _l === void 0 ? void 0 : _l.categoryId)) {
            catalogItemIds.push(accrualRule.categoryData.categoryId);
        }
        else if (accrualRule.accrualType == "ITEM_VARIATION" &&
            ((_m = accrualRule.itemVariationData) === null || _m === void 0 ? void 0 : _m.itemVariationId)) {
            catalogItemIds.push(accrualRule.itemVariationData.itemVariationId);
            variantItemMap.set(accrualRule.itemVariationData.itemVariationId, accrualRule.itemVariationData.itemVariationId);
            console.log("adding itemId: " +
                accrualRule.itemVariationData.itemVariationId +
                " to lookup list");
        }
    }
    if (catalogItemIds.length > 0) {
        console.log("Fetching items from catalog to get item names");
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
        if ((_o = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _o === void 0 ? void 0 : _o.objects) {
            (_p = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _p === void 0 ? void 0 : _p.objects.forEach(function (catalogObject) {
                var _a;
                if (catalogObject.type == "CATEGORY" &&
                    ((_a = catalogObject.categoryData) === null || _a === void 0 ? void 0 : _a.name)) {
                    console.log("received a category back");
                    itemNameMap.set(catalogObject.id, catalogObject.categoryData.name);
                }
            });
        }
        console.log("searching related objects for variantIds");
        // Items are returned in relatedObjects, so we must loop thru its variants
        // to look for a match on variant id and then take it's parent (item) name
        if (categoryResults.result.relatedObjects) {
            for (var relatedObject of categoryResults.result.relatedObjects) {
                if (relatedObject.type == "ITEM" &&
                    ((_q = relatedObject.itemData) === null || _q === void 0 ? void 0 : _q.variations)) {
                    for (var variant of relatedObject.itemData.variations) {
                        const variantFromMap = variantItemMap.get(variant.id);
                        if (variantFromMap) {
                            if (relatedObject.itemData.name) {
                                console.log("received an item back");
                                itemNameMap.set(variant.id, relatedObject.itemData.name);
                            }
                        }
                    }
                }
            }
        }
        return itemNameMap;
    }
    else {
        return itemNameMap;
    }
});
exports.getCatalogItemIdMapFromAccurals = getCatalogItemIdMapFromAccurals;
module.exports = {
    createLoyaltyAccount: exports.createLoyaltyAccount,
    getAvailableRewardsForLoyaltyBalance: exports.getAvailableRewardsForLoyaltyBalance,
    getCatalogItemIdMapFromAccurals: exports.getCatalogItemIdMapFromAccurals,
    getMerchantInfo: exports.getMerchantInfo,
    getMerchantLocation: exports.getMerchantLocation,
    getMerchantLocations: exports.getMerchantLocations,
    getMainLoyaltyProgramFromMerchant: exports.getMainLoyaltyProgramFromMerchant,
    lookupMerchantCustomerIdByPhoneNumber: exports.lookupMerchantCustomerIdByPhoneNumber,
    upsertMerchantCustomerAccount: exports.upsertMerchantCustomerAccount,
    getMerchantForToken: exports.getMerchantForToken,
};
