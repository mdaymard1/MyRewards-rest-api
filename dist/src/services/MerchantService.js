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
exports.getCatalogItemIdMapFromAccurals = exports.getMainLoyaltyProgramFromMerchant = exports.getMerchantInfo = exports.createMerchantCustomerAccount = exports.upsertMerchantCustomerAccount = exports.lookupCustomerIdByPhoneNumber = exports.createLoyaltyAccount = void 0;
const square_1 = require("square");
// import { UUID } from 'crypto';
const EncryptionService_1 = require("./EncryptionService");
const dotenv_1 = __importDefault(require("dotenv"));
const createLoyaltyAccount = (accessToken, loyaltyProgramId, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log('inside createLoyaltyAccount with loyaltyProgramId: ' +
        loyaltyProgramId +
        ', phoneNumber: ' +
        phoneNumber);
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        squareVersion: '2024-01-18',
        accessToken: accessToken,
        environment: env,
    });
    const crypto = require('crypto');
    let idempotencyKey = crypto.randomUUID();
    console.log('idempotencyKey: ' + idempotencyKey);
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
            console.log('just created loyalty account in square. Loyalty account id: ' +
                ((_a = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _a === void 0 ? void 0 : _a.id) +
                ', customerId: ' +
                ((_b = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _b === void 0 ? void 0 : _b.customerId));
        }
        return (_c = createLoyaltyAccountResponse.result.loyaltyAccount) === null || _c === void 0 ? void 0 : _c.customerId;
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            // @ts-expect-error: unused variables
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const errors = error.result;
            const { statusCode, headers } = error;
            console.log('Got an error while creating loyalty account: ' + statusCode);
            if (error.errors && error.errors.length > 0) {
                console.log('error: ' + error.errors[0].detail);
            }
        }
        return null;
    }
});
exports.createLoyaltyAccount = createLoyaltyAccount;
const lookupCustomerIdByPhoneNumber = (accessToken, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside lookupCustomerByPhoneNumber');
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        squareVersion: '2024-01-18',
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
            console.log('found customer with id of ' +
                searchCustomerResponse.result.customers[0].id);
            return searchCustomerResponse.result.customers[0].id;
        }
        console.log('customer not found');
        return null;
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            // @ts-expect-error: unused variables
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const errors = error.result;
            const { statusCode, headers } = error;
            console.log('Got an error while creating square customer: ' + statusCode);
            if (error.errors && error.errors.length > 0) {
                console.log('error: ' + error.errors[0].detail);
            }
        }
        return null;
    }
});
exports.lookupCustomerIdByPhoneNumber = lookupCustomerIdByPhoneNumber;
const upsertMerchantCustomerAccount = (accessToken, merchantCustomerId, appCustomerId, firstName, lastName, phone, email) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    console.log('inside createMerchantCustomerAccount');
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        squareVersion: '2024-01-18',
        accessToken: accessToken,
        environment: env,
    });
    const { customersApi } = client;
    try {
        let retrieveCustomerResponse = yield customersApi.retrieveCustomer(merchantCustomerId);
        let existingCustomer = retrieveCustomerResponse.result.customer;
        // Only update fields that are missing
        if (existingCustomer) {
            console.log('found customer account. updating...');
            const body = {
                givenName: (_d = existingCustomer.givenName) !== null && _d !== void 0 ? _d : firstName,
                familyName: (_e = existingCustomer.familyName) !== null && _e !== void 0 ? _e : lastName,
                emailAddress: (_f = existingCustomer.emailAddress) !== null && _f !== void 0 ? _f : email,
                referenceId: appCustomerId,
            };
            let updateCustomerResponse = yield customersApi.updateCustomer(merchantCustomerId, body);
            return existingCustomer.id;
        }
        else {
            console.log('customer not returned in response');
        }
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            if (error.errors && error.errors.length > 0) {
                console.log('error: ' + error.errors[0].detail);
            }
        }
        else {
            console.log('some unexpected error: ' + error);
        }
    }
});
exports.upsertMerchantCustomerAccount = upsertMerchantCustomerAccount;
const createMerchantCustomerAccount = (accessToken, 
// merchantCustomerId: string,
// appCustomerId: string,
firstName, lastName, phone, email) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    console.log('inside createMerchantCustomerAccount');
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        squareVersion: '2024-01-18',
        accessToken: accessToken,
        environment: env,
    });
    const createCustomerBody = {
        givenName: firstName,
        familyName: lastName,
        emailAddress: email,
        // referenceId: appCustomerId,
        phoneNumber: phone,
    };
    const { customersApi } = client;
    try {
        let createCustomerResponse = yield customersApi.createCustomer(createCustomerBody);
        return (_g = createCustomerResponse.result.customer) === null || _g === void 0 ? void 0 : _g.id;
    }
    catch (error) {
        if (error instanceof square_1.ApiError) {
            // @ts-expect-error: unused variables
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const errors = error.result;
            const { statusCode, headers } = error;
            console.log('Got an error while creating square customer: ' + statusCode);
            if (error.errors && error.errors.length > 0) {
                console.log('error: ' + error.errors[0].detail);
            }
        }
        return null;
    }
});
exports.createMerchantCustomerAccount = createMerchantCustomerAccount;
const getMerchantInfo = (merchantId, accessToken, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k, _l;
    console.log('inside getMerchantInfo');
    var token = '';
    token = (0, EncryptionService_1.decryptToken)(accessToken);
    console.log('converted encrypted token: ' + accessToken + ' to ' + token);
    console.log('merchantId: ' + merchantId);
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        accessToken: token,
        environment: env,
    });
    const { merchantsApi } = client;
    try {
        const merchantResponse = yield merchantsApi.retrieveMerchant(merchantId);
        if ((_h = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _h === void 0 ? void 0 : _h.merchant) {
            console.log('returning merchant for id: ' + ((_k = (_j = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _j === void 0 ? void 0 : _j.merchant) === null || _k === void 0 ? void 0 : _k.id));
            callback((_l = merchantResponse === null || merchantResponse === void 0 ? void 0 : merchantResponse.result) === null || _l === void 0 ? void 0 : _l.merchant);
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
    var _m, _o, _p;
    console.log('token: ' + token);
    dotenv_1.default.config();
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    console.log('looking up ProgramLoyalty in env: ' + env);
    const client = new square_1.Client({
        squareVersion: '2024-01-18',
        accessToken: token,
        environment: env,
    });
    const { catalogApi, loyaltyApi } = client;
    try {
        let loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram('main');
        console.log('response: ' + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        const program = (_m = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _m === void 0 ? void 0 : _m.program;
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
        if ((_o = promotionsResponse.result) === null || _o === void 0 ? void 0 : _o.loyaltyPromotions) {
            promotions = promotionsResponse.result.loyaltyPromotions;
        }
        let scheduledPromotionsResponse = yield loyaltyApi.listLoyaltyPromotions(program.id, 'SCHEDULED');
        console.log('scheduledPromotionsResponse: ' + (scheduledPromotionsResponse === null || scheduledPromotionsResponse === void 0 ? void 0 : scheduledPromotionsResponse.result));
        if ((_p = scheduledPromotionsResponse.result) === null || _p === void 0 ? void 0 : _p.loyaltyPromotions) {
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
    var _q, _r, _s, _t, _u, _v;
    console.log('inside getCatalogItemIdMapFromAccurals');
    var catalogItemIds = [];
    var itemNameMap = new Map();
    var variantItemMap = new Map();
    console.log('accrualRules size: ' + accrualRules.length);
    // Loop through each accrual rule to determine its type
    for (var accrualRule of accrualRules) {
        console.log(accrualRule.accrualType +
            ', categoryId: ' +
            ((_q = accrualRule.categoryData) === null || _q === void 0 ? void 0 : _q.categoryId));
        if (accrualRule.accrualType == 'CATEGORY' &&
            ((_r = accrualRule.categoryData) === null || _r === void 0 ? void 0 : _r.categoryId)) {
            catalogItemIds.push(accrualRule.categoryData.categoryId);
            console.log('adding categoryId: ' +
                accrualRule.categoryData.categoryId +
                ' to lookup list');
        }
        else if (accrualRule.accrualType == 'ITEM_VARIATION' &&
            ((_s = accrualRule.itemVariationData) === null || _s === void 0 ? void 0 : _s.itemVariationId)) {
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
        if ((_t = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _t === void 0 ? void 0 : _t.objects) {
            (_u = categoryResults === null || categoryResults === void 0 ? void 0 : categoryResults.result) === null || _u === void 0 ? void 0 : _u.objects.forEach(function (catalogObject) {
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
                    ((_v = relatedObject.itemData) === null || _v === void 0 ? void 0 : _v.variations)) {
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
    createLoyaltyAccount: exports.createLoyaltyAccount,
    createMerchantCustomerAccount: exports.createMerchantCustomerAccount,
    getCatalogItemIdMapFromAccurals: exports.getCatalogItemIdMapFromAccurals,
    getMerchantInfo: exports.getMerchantInfo,
    getMainLoyaltyProgramFromMerchant: exports.getMainLoyaltyProgramFromMerchant,
    lookupCustomerIdByPhoneNumber: exports.lookupCustomerIdByPhoneNumber,
    upsertMerchantCustomerAccount: exports.upsertMerchantCustomerAccount,
};
