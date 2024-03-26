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
exports.getCatalogItemIdMapFromAccurals = exports.getMainLoyaltyProgramFromMerchant = exports.getMerchantLocation = exports.getMerchantLocations = exports.getMerchantInfo = exports.upsertMerchantCustomerAccount = exports.lookupCustomerIdByPhoneNumber = exports.createLoyaltyAccount = exports.getAvailableRewardsForLoyaltyBalance = exports.verifyMerchantToken = void 0;
const square_1 = require("square");
const EncryptionService_1 = require("./EncryptionService");
const Utility_1 = require("../utility/Utility");
const dotenv_1 = __importDefault(require("dotenv"));
const RewardDetails_1 = require("./entity/RewardDetails");
const verifyMerchantToken = (merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("inside verifyMerchantToken");
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const { merchantsApi } = client;
    try {
        const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
        if ((_a = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _a === void 0 ? void 0 : _a.merchant) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        console.log("merchantsApi.retrieveMerchant returned an error: " + err);
        return false;
    }
});
exports.verifyMerchantToken = verifyMerchantToken;
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
    var _b, _c, _d;
    console.log("inside createLoyaltyAccount with loyaltyProgramId: " +
        loyaltyProgramId +
        ", phoneNumber: " +
        phoneNumber);
    const env = (0, Utility_1.getMerchantEnvironment)();
    const client = new square_1.Client({
        squareVersion: "2024-01-18",
        accessToken: accessToken,
        environment: env,
    });
    const crypto = require("crypto");
    let idempotencyKey = crypto.randomUUID();
    console.log("idempotencyKey: " + idempotencyKey);
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
    try {
        let createLoyaltyAccountResponse = yield loyaltyApi.createLoyaltyAccount(createLoyaltyBody);
        if (createLoyaltyAccountResponse) {
            console.log("just created loyalty account in square. Loyalty account id: " +
                ((_b = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _b === void 0 ? void 0 : _b.id) +
                ", customerId: " +
                ((_c = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _c === void 0 ? void 0 : _c.customerId));
        }
        return (_d = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _d === void 0 ? void 0 : _d.customerId;
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
const lookupCustomerIdByPhoneNumber = (accessToken, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
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
            console.log("found customer with id of " +
                searchCustomerResponse.result.customers[0].id);
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
exports.lookupCustomerIdByPhoneNumber = lookupCustomerIdByPhoneNumber;
const upsertMerchantCustomerAccount = (accessToken, merchantCustomerId, appCustomerId, phone, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g;
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
                givenName: (_e = existingCustomer.givenName) !== null && _e !== void 0 ? _e : firstName,
                familyName: (_f = existingCustomer.familyName) !== null && _f !== void 0 ? _f : lastName,
                emailAddress: (_g = existingCustomer.emailAddress) !== null && _g !== void 0 ? _g : email,
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
    }
});
exports.upsertMerchantCustomerAccount = upsertMerchantCustomerAccount;
const getMerchantInfo = (merchantId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k;
    console.log("inside getMerchantInfo");
    var token = "";
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    console.log("converted encrypted token: " + accessToken + " to " + token);
    console.log("merchantId: " + merchantId);
    console.log("process.env.NODE_ENV: " + process.env.NODE_ENV);
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
        if ((_h = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _h === void 0 ? void 0 : _h.merchant) {
            console.log("returning merchant for id: " + ((_k = (_j = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _j === void 0 ? void 0 : _j.merchant) === null || _k === void 0 ? void 0 : _k.id));
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
    var _l;
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
        console.log("Returning location with id: " + ((_l = listLocationsResponse.result.location) === null || _l === void 0 ? void 0 : _l.id));
        return listLocationsResponse.result.location;
    }
    catch (error) {
        console.log("locationsApi.retrieveLocation returned an error: " + error);
        return undefined;
    }
});
exports.getMerchantLocation = getMerchantLocation;
const getMerchantsMainLoyaltyProgram = (token) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
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
        console.log("response: " + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        return (_m = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _m === void 0 ? void 0 : _m.program;
    }
    catch (error) {
        console.log("Error thrown in getMerchantsMainLoyaltyProgram: " + error);
        return null;
    }
});
const getMainLoyaltyProgramFromMerchant = (token) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q;
    console.log("token: " + token);
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
        console.log("response: " + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        const program = (_o = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _o === void 0 ? void 0 : _o.program;
        if (!program) {
            return undefined;
        }
        console.log("program id: " + program.id);
        var promotions = [];
        let promotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "ACTIVE");
        console.log("response: " + (promotionsResponse === null || promotionsResponse === void 0 ? void 0 : promotionsResponse.result));
        if (!promotionsResponse) {
            return undefined;
        }
        if ((_p = promotionsResponse.result) === null || _p === void 0 ? void 0 : _p.loyaltyPromotions) {
            promotions = promotionsResponse.result.loyaltyPromotions;
        }
        let scheduledPromotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, "SCHEDULED");
        console.log("scheduledPromotionsResponse: " + (scheduledPromotionsResponse === null || scheduledPromotionsResponse === void 0 ? void 0 : scheduledPromotionsResponse.result));
        if ((_q = scheduledPromotionsResponse.result) === null || _q === void 0 ? void 0 : _q.loyaltyPromotions) {
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
    var _r, _s, _t, _u, _v, _w;
    console.log("inside getCatalogItemIdMapFromAccurals");
    var catalogItemIds = [];
    var itemNameMap = new Map();
    var variantItemMap = new Map();
    console.log("accrualRules size: " + accrualRules.length);
    // Loop through each accrual rule to determine its type
    for (var accrualRule of accrualRules) {
        console.log(accrualRule.accrualType +
            ", categoryId: " +
            ((_r = accrualRule.categoryData) === null || _r === void 0 ? void 0 : _r.categoryId));
        if (accrualRule.accrualType == "CATEGORY" &&
            ((_s = accrualRule.categoryData) === null || _s === void 0 ? void 0 : _s.categoryId)) {
            catalogItemIds.push(accrualRule.categoryData.categoryId);
            console.log("adding categoryId: " +
                accrualRule.categoryData.categoryId +
                " to lookup list");
        }
        else if (accrualRule.accrualType == "ITEM_VARIATION" &&
            ((_t = accrualRule.itemVariationData) === null || _t === void 0 ? void 0 : _t.itemVariationId)) {
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
        if ((_u = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _u === void 0 ? void 0 : _u.objects) {
            (_v = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _v === void 0 ? void 0 : _v.objects.forEach(function (catalogObject) {
                var _a;
                if (catalogObject.type == "CATEGORY" &&
                    ((_a = catalogObject.categoryData) === null || _a === void 0 ? void 0 : _a.name)) {
                    console.log("received a category back: " + catalogObject.categoryData.name);
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
                    ((_w = relatedObject.itemData) === null || _w === void 0 ? void 0 : _w.variations)) {
                    for (var variant of relatedObject.itemData.variations) {
                        const variantFromMap = variantItemMap.get(variant.id);
                        if (variantFromMap) {
                            if (relatedObject.itemData.name) {
                                console.log("received an item back: " + relatedObject.itemData.name);
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
    lookupCustomerIdByPhoneNumber: exports.lookupCustomerIdByPhoneNumber,
    upsertMerchantCustomerAccount: exports.upsertMerchantCustomerAccount,
    verifyMerchantToken: exports.verifyMerchantToken,
};
