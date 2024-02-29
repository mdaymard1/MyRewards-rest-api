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
exports.updateSpecialsFromWebhook = exports.deleteExistingSpecial = exports.updateExistingSpecial = exports.createSpecial = exports.getAllSpecials = void 0;
const appDataSource_1 = require("../../appDataSource");
const EncryptionService_1 = require("./EncryptionService");
const Loyalty_1 = require("../entity/Loyalty");
const Special_1 = require("../entity/Special");
const SpecialItem_1 = require("../entity/SpecialItem");
const Business_1 = require("../entity/Business");
const square_1 = require("square");
const LoyaltyAccrual_1 = require("../entity/LoyaltyAccrual");
const LoyaltyService_1 = require("./LoyaltyService");
const MerchantService_1 = require("./MerchantService");
// import superAgent from 'superagent';
const getAllSpecials = (businessId, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside getAllSpecials');
    const specials = yield appDataSource_1.AppDataSource.manager.find(Special_1.Special, {
        where: {
            businessId: businessId,
        },
    });
    callback(specials);
});
exports.getAllSpecials = getAllSpecials;
const createSpecial = (businessId, special, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log('inside createSpecial');
    const startDate = special.startDate
        ? new Date(special.startDate)
        : new Date();
    const endDate = special.endDate ? new Date(special.endDate) : null;
    const newSpecial = yield appDataSource_1.AppDataSource.manager.create(Special_1.Special, {
        title: special.title,
        description: special.description,
        showItemDetails: (_a = special.showItemDetails) !== null && _a !== void 0 ? _a : true,
        showItemPhotos: (_b = special.showItemPhotos) !== null && _b !== void 0 ? _b : true,
        showItemPrices: (_c = special.showItemPrices) !== null && _c !== void 0 ? _c : true,
        startDate: startDate,
        endDate: endDate,
        businessId: businessId,
    });
    yield appDataSource_1.AppDataSource.manager.save(newSpecial);
    console.log('just created new special with id: ' + newSpecial.id);
    let sortOrder = 1;
    if (special.items) {
        createSpecialItems(newSpecial, special.items, function (wasSuccessful) {
            updateBusinessSpecialCatalogIndicator(businessId);
            callback(newSpecial.id);
        });
    }
    else {
        callback(undefined);
    }
});
exports.createSpecial = createSpecial;
const updateBusinessSpecialCatalogIndicator = (businessId) => __awaiter(void 0, void 0, void 0, function* () {
    const totalCatalogReferences = yield SpecialItem_1.SpecialItem.createQueryBuilder('specialItem')
        .leftJoinAndSelect('specialItem.special', 'special')
        .where('special.businessId = :id', { id: businessId })
        .andWhere('specialItem.isManuallyEntered = false')
        .getCount();
    console.log('updateBusinessSpecialCatalogIndicator got count of ' +
        totalCatalogReferences);
    yield appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
        businessId: businessId,
    }, {
        specialsUseCatalogItems: totalCatalogReferences > 0,
        lastUpdateDate: new Date(),
    });
});
const updateExistingSpecial = (specialId, special, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateExistingSpecial');
    const existingSpecial = yield appDataSource_1.AppDataSource.manager.findOne(Special_1.Special, {
        where: {
            id: specialId,
        },
    });
    if (!existingSpecial) {
        console.log('special not found');
        callback(false);
        return;
    }
    existingSpecial.title = special.title;
    existingSpecial.description = special.description;
    existingSpecial.showItemDetails = special.showItemDetails;
    existingSpecial.showItemPhotos = special.showItemPhotos;
    existingSpecial.showItemPrices = special.showItemPrices;
    const startDate = special.startDate
        ? new Date(special.startDate)
        : new Date();
    const endDate = special.endDate ? new Date(special.endDate) : null;
    existingSpecial.startDate = startDate;
    existingSpecial.endDate = endDate;
    yield appDataSource_1.AppDataSource.manager.save(existingSpecial);
    var specialIndex = 0;
    // Replace each item base on matching index
    for (var i = 0; i < existingSpecial.items.length; i++) {
        if (i < special.items.length) {
            console.log('updating existing item from input special, index: ' + i);
            yield appDataSource_1.AppDataSource.manager.update(SpecialItem_1.SpecialItem, {
                id: existingSpecial.items[i].id,
            }, {
                sortOrder: i + 1,
                name: special.items[i].name,
                itemId: special.items[i].itemId,
                itemDescription: special.items[i].itemDescription,
                isManuallyEntered: special.items[i].isManuallyEntered,
                itemPriceRange: special.items[i].itemPriceRange,
                priceCurrency: special.items[i].priceCurrency,
                imageUrl: special.items[i].imageUrl,
            });
        }
    }
    if (special.items.length > existingSpecial.items.length) {
        // Create any additional items
        for (var i = existingSpecial.items.length; i < special.items.length; i++) {
            console.log('creating item from input special, index: ' + i);
            const newSpecialItem = yield appDataSource_1.AppDataSource.manager.create(SpecialItem_1.SpecialItem, {
                specialId: existingSpecial.id,
                sortOrder: i + 1,
                name: special.items[i].name,
                itemId: special.items[i].itemId,
                itemDescription: special.items[i].itemDescription,
                isManuallyEntered: special.items[i].isManuallyEntered,
                itemPriceRange: special.items[i].itemPriceRange,
                priceCurrency: special.items[i].priceCurrency,
                imageUrl: special.items[i].imageUrl,
            });
            yield appDataSource_1.AppDataSource.manager.save(newSpecialItem);
        }
    }
    else if (special.items.length < existingSpecial.items.length) {
        // Remove remaining items
        for (var i = special.items.length; i < existingSpecial.items.length; i++) {
            console.log('deleting existing item, index: ' + i);
            yield appDataSource_1.AppDataSource.manager.delete(SpecialItem_1.SpecialItem, existingSpecial.items[i].id);
        }
    }
    updateBusinessSpecialCatalogIndicator(existingSpecial.businessId);
    callback(true);
});
exports.updateExistingSpecial = updateExistingSpecial;
const deleteExistingSpecial = (specialId, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside deleteExistingSpecial');
    yield appDataSource_1.AppDataSource.manager.delete(Special_1.Special, {
        id: specialId,
    });
    callback(true);
});
exports.deleteExistingSpecial = deleteExistingSpecial;
const createSpecialItems = (special, specialItems, callback) => __awaiter(void 0, void 0, void 0, function* () {
    let sortOrder = 1;
    for (var item of specialItems) {
        const newSpecialItem = yield appDataSource_1.AppDataSource.manager.create(SpecialItem_1.SpecialItem, {
            specialId: special.id,
            sortOrder: sortOrder,
            name: item.name,
            itemId: item.itemId,
            itemDescription: item.itemDescription,
            isManuallyEntered: item.isManuallyEntered,
            itemPriceRange: item.itemPriceRange,
            priceCurrency: item.priceCurrency,
            imageUrl: item.imageUrl,
        });
        yield appDataSource_1.AppDataSource.manager.save(newSpecialItem);
        sortOrder += 1;
    }
    callback(true);
});
const updateSpecialsFromWebhook = (merchantId, catalogVersionUpdated, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateSpecialsFromWebhook');
    const business = yield Business_1.Business.createQueryBuilder('business')
        .where('business.merchantId = :merchantId', { merchantId: merchantId })
        .getOne();
    if (!business) {
        console.log("Can't find Business for merchantId: " + merchantId);
        callback(false);
        return;
    }
    // See if we need to update catalog items
    if (!business.loyaltyUsesCatalogItems && !business.specialsUseCatalogItems) {
        console.log('catalog update is not required for specials or loyalty');
        callback(false);
        return;
    }
    const token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (!token) {
        console.log("Can't get token");
        callback(false);
        return;
    }
    const accessTokenExpirationDate = business.accessTokenExpirationDate;
    if (!accessTokenExpirationDate || !business.merchantRefreshToken) {
        console.log("Can't get token");
        callback(false);
        return;
    }
    const diffInTime = accessTokenExpirationDate.getTime() - new Date().getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    console.log('number of days till token expires');
    if (diffInDays < 8) {
        const accessToken = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
        const refreshToken = (0, EncryptionService_1.decryptToken)(business.merchantRefreshToken);
        console.log('accessToken: ' + accessToken + ', refreshToken: ' + refreshToken);
        if (!refreshToken) {
            console.log('could not decrypt refresh token');
            callback(true);
            return;
        }
        const newTokens = yield requestNewTokens(refreshToken);
        if (newTokens) {
            const newAccessToken = newTokens[0];
            const newRefreshToken = newTokens[1];
            const newRefreshDate = newTokens[2];
            yield appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
                businessId: business.businessId,
            }, {
                merchantAccessToken: newAccessToken,
                merchantRefreshToken: newRefreshToken,
                accessTokenExpirationDate: newRefreshDate,
            });
            console.log('Just updated tokens in business');
        }
        else {
            callback(true);
        }
    }
    getCatalogItemsLastUpdated(business.lastUpdateDate, token, function (catalogIdMapAndVariantStates) {
        if (business.loyaltyUsesCatalogItems) {
            updateLoyaltyAccrualsFromCatalogChangesIfNeeded(business.businessId, catalogIdMapAndVariantStates, token, function (wasSuccessful) {
                if (business.specialsUseCatalogItems) {
                    updateSpecialsFromCatalogChangesIfNeeded(business.businessId, catalogIdMapAndVariantStates[0], function (wasSuccessful) {
                        callback(true);
                    });
                }
            });
        }
        else if (business.specialsUseCatalogItems) {
            updateSpecialsFromCatalogChangesIfNeeded(business.businessId, catalogIdMapAndVariantStates[0], function (wasSuccessful) {
                console.log('returned from updateSpecialsFromCatalogChangesIfNeeded');
                callback(true);
            });
        }
    });
});
exports.updateSpecialsFromWebhook = updateSpecialsFromWebhook;
const requestNewTokens = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    console.log('inside requestNewTokens');
    console.log('refreshToken: ' + refreshToken);
    try {
        const requestBody = {
            refresh_token: refreshToken,
            redirect_uri: 'https://myredirectendpoint.com/callback',
            grant_type: 'refresh_token',
            code_verifier: 'PCOQi8CHfaRU3Q8NlKLNvu2AiKOd0wKneQdb8vUiF4U',
            client_id: 'sq0idp-UKXXq5VxNXSDxNAV1manlQ',
        };
        const superAgent = require('superagent');
        const result = yield superAgent
            .post('https://connect.squareup.com/oauth2/token')
            .set('Content-Type', 'application/json')
            .send(requestBody);
        console.log('got response from server. result: ' + result + ', body: ' + (result === null || result === void 0 ? void 0 : result.body));
        console.log('result.access_token: ' + ((_d = result === null || result === void 0 ? void 0 : result.body) === null || _d === void 0 ? void 0 : _d.access_token));
        console.log('result.errors: ' + ((_e = result === null || result === void 0 ? void 0 : result.body) === null || _e === void 0 ? void 0 : _e.errors));
        const errors = (_f = result === null || result === void 0 ? void 0 : result.body) === null || _f === void 0 ? void 0 : _f.errors;
        if (errors) {
            console.log('errors returned when requesting new token: ' + errors);
            return undefined;
        }
        const newAccessToken = result === null || result === void 0 ? void 0 : result.body.access_token;
        const newRefreshToken = result === null || result === void 0 ? void 0 : result.body.refresh_token;
        const newRefreshDate = result === null || result === void 0 ? void 0 : result.body.expires_at;
        if (!newAccessToken || !newRefreshToken || !newRefreshDate) {
            console.log('tokens not returned when requesting new token');
            return undefined;
        }
        const encryptedAccessToken = (0, EncryptionService_1.encryptToken)(newAccessToken);
        const encryptedRefreshToken = (0, EncryptionService_1.encryptToken)(newRefreshToken);
        const refreshDate = new Date(newRefreshDate);
        console.log('returning new access token: ' +
            newAccessToken +
            ', new refresh token: ' +
            newRefreshToken +
            ', new expiration date:' +
            refreshDate);
        return [encryptedAccessToken, encryptedRefreshToken, refreshDate];
    }
    catch (err) {
        console.log('Error while requesting new token: ' + err);
        return undefined;
    }
});
const updateSpecialsFromCatalogChangesIfNeeded = (businessId, catalogMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k, _l, _m, _o;
    console.log('inside updateSpecialsFromCatalogChangesIfNeeded');
    let itemIds = [];
    // Create array of item ids to search for
    catalogMap.forEach(function (key, value) {
        itemIds.push(value);
        console.log('adding key to search list: ' + key + ', value: ' + value);
    });
    if (itemIds.length > 0) {
        // get all special items matching the catalog items that just changed
        const itemSpecials = yield SpecialItem_1.SpecialItem.createQueryBuilder('specialItem')
            .where('specialItem.itemId IN (:...ids)', { ids: itemIds })
            .getMany();
        if (itemSpecials && itemSpecials.length > 0) {
            console.log('some items have change: ' + itemSpecials.length);
            for (var itemSpecial of itemSpecials) {
                const changedItem = catalogMap.get(itemSpecial.itemId);
                if (changedItem) {
                    if (changedItem.isDeleted) {
                        yield appDataSource_1.AppDataSource.manager.delete(SpecialItem_1.SpecialItem, {
                            id: itemSpecial.id,
                        });
                    }
                    else {
                        console.log('updating existing item from input special, index: ' +
                            changedItem.itemData.name);
                        // Determine price from variants
                        let priceRange;
                        let priceCurrency;
                        let minCurrencyAmount;
                        let minCurrencyCurrency;
                        let maxCurrencyAmount;
                        let maxCurrencyCurrency;
                        if (changedItem.itemData.variations) {
                            for (var variation of changedItem.itemData.variations) {
                                if (variation.type == 'ITEM_VARIATION' &&
                                    ((_h = (_g = variation.itemVariationData) === null || _g === void 0 ? void 0 : _g.priceMoney) === null || _h === void 0 ? void 0 : _h.amount)) {
                                    const amount = (_k = (_j = variation.itemVariationData) === null || _j === void 0 ? void 0 : _j.priceMoney) === null || _k === void 0 ? void 0 : _k.amount;
                                    console.log('item amount: ' + amount);
                                    const currency = (_o = (_m = (_l = variation.itemVariationData) === null || _l === void 0 ? void 0 : _l.priceMoney) === null || _m === void 0 ? void 0 : _m.currency) !== null && _o !== void 0 ? _o : 'USD';
                                    if (amount && currency) {
                                        const adjustedAmount = Number(amount) / 100.0;
                                        if (!minCurrencyAmount) {
                                            minCurrencyAmount = adjustedAmount;
                                            minCurrencyCurrency = currency;
                                        }
                                        if (!maxCurrencyAmount) {
                                            maxCurrencyAmount = adjustedAmount;
                                            maxCurrencyCurrency = currency;
                                        }
                                        if (minCurrencyAmount) {
                                            if (adjustedAmount < minCurrencyAmount) {
                                                minCurrencyAmount = adjustedAmount;
                                                minCurrencyCurrency = currency;
                                            }
                                        }
                                        if (maxCurrencyAmount) {
                                            if (adjustedAmount > maxCurrencyAmount) {
                                                maxCurrencyAmount = adjustedAmount;
                                                maxCurrencyCurrency = currency;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (minCurrencyAmount && maxCurrencyAmount) {
                            if (minCurrencyAmount == maxCurrencyAmount) {
                                const currencyType = (0, LoyaltyService_1.getMoneyCurrencyType)(minCurrencyCurrency);
                                if (currencyType) {
                                    const formattedPrice = minCurrencyAmount.toLocaleString(currencyType, {
                                        style: 'currency',
                                        currency: minCurrencyCurrency,
                                        maximumFractionDigits: 2,
                                    });
                                    priceRange = formattedPrice;
                                    priceCurrency = minCurrencyCurrency;
                                }
                            }
                            else {
                                const minCurrencyType = (0, LoyaltyService_1.getMoneyCurrencyType)(minCurrencyCurrency);
                                const maxCurrencyType = (0, LoyaltyService_1.getMoneyCurrencyType)(maxCurrencyCurrency);
                                if (minCurrencyType && maxCurrencyType) {
                                    const formattedMinPrice = minCurrencyAmount.toLocaleString(minCurrencyType, {
                                        style: 'currency',
                                        currency: minCurrencyCurrency,
                                        maximumFractionDigits: 2,
                                    });
                                    const formattedMaxPrice = maxCurrencyAmount.toLocaleString(maxCurrencyType, {
                                        style: 'currency',
                                        currency: maxCurrencyCurrency,
                                        maximumFractionDigits: 2,
                                    });
                                    priceRange = formattedMinPrice + ' - ' + formattedMaxPrice;
                                    priceCurrency = maxCurrencyCurrency;
                                }
                            }
                        }
                        console.log('priceRange: ' + priceRange);
                        console.log('priceCurrency: ' + priceCurrency);
                        // Check if image url has changed
                        let firstImageUrl = undefined;
                        let imageWasDeleted = false;
                        if (changedItem.itemData.imageIds) {
                            for (var imageId of changedItem.itemData.imageIds) {
                                const imageObject = catalogMap.get(imageId);
                                if (imageObject &&
                                    !imageObject.isDeleted &&
                                    imageObject.imageData) {
                                    firstImageUrl = imageObject.imageData.url;
                                    console.log('found image for specialItemId: ' +
                                        changedItem.id +
                                        ', url: ' +
                                        firstImageUrl);
                                }
                            }
                        }
                        console.log('firstImageUrl: ' + firstImageUrl);
                        yield appDataSource_1.AppDataSource.manager.update(SpecialItem_1.SpecialItem, {
                            id: itemSpecial.id,
                        }, {
                            name: changedItem.itemData.name,
                            itemDescription: changedItem.itemData.description,
                            itemPriceRange: priceRange,
                            priceCurrency: priceCurrency,
                            imageUrl: firstImageUrl !== null && firstImageUrl !== void 0 ? firstImageUrl : null,
                        });
                    }
                }
            }
        }
    }
    updateBusinessSpecialCatalogIndicator(businessId);
    callback(true);
});
const updateLoyaltyAccrualsFromCatalogChangesIfNeeded = (businessId, catalogIdMapAndVariantStates, token, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _p, _q;
    let wereLoyaltyItemsUpdated = false;
    // If a variant was deleted, we don't get the variantId and so can't check to see if
    // it was in an accrual. So unfortunately, we need to assume it may have been on an
    // accrual and the request a loyalty update from the merchant
    if (catalogIdMapAndVariantStates[1]) {
        wereLoyaltyItemsUpdated = true;
    }
    else {
        // get all loyalty accrual and their categories or variant ids
        const accruals = yield LoyaltyAccrual_1.LoyaltyAccrual.createQueryBuilder('loyaltyAccrual')
            .where("loyaltyAccrual.accrualType = 'CATEGORY' OR loyaltyAccrual.accrualType = 'ITEM_VARIATION'")
            .getMany();
        if (accruals) {
            accruals.forEach((accrual) => {
                const catalogId = accrual.accrualType == 'CATEGORY'
                    ? accrual.categoryId
                    : accrual.variantId;
                console.log('checking catalogMap for catalogId: ' + catalogId);
                const catalogItem = catalogIdMapAndVariantStates[0].get(catalogId);
                if (catalogItem) {
                    wereLoyaltyItemsUpdated = true;
                    return true;
                }
            });
        }
    }
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    if (wereLoyaltyItemsUpdated) {
        const client = new square_1.Client({
            accessToken: token,
            environment: env,
        });
        const { loyaltyApi } = client;
        let loyaltyProgramResponse = yield loyaltyApi.retrieveLoyaltyProgram('main');
        console.log('response: ' + (loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result));
        const loyaltyProgram = (_p = loyaltyProgramResponse === null || loyaltyProgramResponse === void 0 ? void 0 : loyaltyProgramResponse.result) === null || _p === void 0 ? void 0 : _p.program;
        if (loyaltyProgram) {
            (0, MerchantService_1.getCatalogItemIdMapFromAccurals)(token, (_q = loyaltyProgram.accrualRules) !== null && _q !== void 0 ? _q : [], function (catalogItemNameMap) {
                console.log('Catalog items used by loyalty have changes, so updating loyalty');
                updateLoyaltyWithLatestChanges(businessId, loyaltyProgram, catalogItemNameMap, function (wasSuccessful) {
                    callback(true);
                });
            });
        }
        else {
            callback(true);
        }
    }
    else {
        console.log('No catalog items have changed since last update');
        callback(true);
    }
});
const updateLoyaltyWithLatestChanges = (businessId, loyaltyProgram, catalogItemNameMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
        let loyalty = yield appDataSource_1.AppDataSource.manager.findOne(Loyalty_1.Loyalty, {
            where: {
                businessId: businessId,
            },
        });
        if (loyalty) {
            (0, LoyaltyService_1.updateAppLoyaltyAccrualsFromMerchant)(loyaltyProgram.accrualRules, loyaltyProgram.terminology, loyalty, catalogItemNameMap);
            (0, LoyaltyService_1.removeOldAccrualRules)(loyalty.loyaltyAccruals, loyaltyProgram);
            let loyaltyUsesCatalogItems = false;
            for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
                if (loyaltyAccrualRule.accrualType == 'CATEGORY' ||
                    loyaltyAccrualRule.accrualType == 'ITEM_VARIATION')
                    loyaltyUsesCatalogItems = true;
            }
            (0, LoyaltyService_1.updateBusinessLoyaltyCatalogIndicator)(businessId, loyaltyUsesCatalogItems);
            console.log('sending callback');
            callback(true);
        }
        else {
            callback(true);
        }
    }
    else {
        callback(true);
    }
});
const getCatalogItemsLastUpdated = (lastUpdateDate, token, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _r, _s, _t, _u;
    console.log('inside getCatalogItemsLastUpdated');
    console.log('looking up catalog changes with token: ' + token);
    const lastUpdateDateIso = lastUpdateDate.toISOString();
    const env = process.env.NODE_ENV == 'development'
        ? square_1.Environment.Sandbox
        : square_1.Environment.Production;
    const client = new square_1.Client({
        accessToken: token,
        environment: env,
    });
    const body = {
        objectTypes: ['ITEM', 'CATEGORY'],
        beginTime: lastUpdateDateIso,
        includeDeletedObjects: true,
        includeRelatedObjects: true,
    };
    const { catalogApi } = client;
    console.log('Getting catalog changes since ' + lastUpdateDateIso);
    const catalogResults = yield catalogApi.searchCatalogObjects(body);
    let catalogMap = new Map();
    let wereVariantsMission = false;
    if (catalogResults.result.objects) {
        for (var object of catalogResults.result.objects) {
            if (object.type == 'CATEGORY') {
                catalogMap.set(object.id, object);
                console.log('got type: ' +
                    object.type +
                    ', id: ' +
                    object.id +
                    ', isDeleted: ' +
                    object.isDeleted +
                    ', category name: ' +
                    ((_r = object.categoryData) === null || _r === void 0 ? void 0 : _r.name));
            }
            else if (object.type == 'ITEM') {
                catalogMap.set(object.id, object);
                if ((_s = object.itemData) === null || _s === void 0 ? void 0 : _s.variations) {
                    for (var variant of object.itemData.variations) {
                        catalogMap.set(variant.id, object);
                        console.log('got type: ' +
                            object.type +
                            ', id: ' +
                            object.id +
                            ', isDeleted: ' +
                            object.isDeleted +
                            ', item name: ' +
                            ((_t = object.itemData) === null || _t === void 0 ? void 0 : _t.name));
                    }
                }
                else {
                    wereVariantsMission = true;
                    console.log('variant was missing from ITEM in searchCatalogObjects results');
                }
            }
        }
    }
    if (catalogResults.result.relatedObjects) {
        for (var relatedObject of catalogResults.result.relatedObjects) {
            if (relatedObject.type == 'IMAGE') {
                catalogMap.set(relatedObject.id, relatedObject);
                console.log('got related type: ' +
                    relatedObject.type +
                    ', id: ' +
                    relatedObject.id +
                    ', isDeleted: ' +
                    relatedObject.isDeleted +
                    ', category name: ' +
                    ((_u = relatedObject.imageData) === null || _u === void 0 ? void 0 : _u.url));
            }
        }
    }
    callback([catalogMap, wereVariantsMission]);
});
module.exports = {
    deleteExistingSpecial: exports.deleteExistingSpecial,
    getAllSpecials: exports.getAllSpecials,
    createSpecial: exports.createSpecial,
    updateExistingSpecial: exports.updateExistingSpecial,
    updateSpecialsFromWebhook: exports.updateSpecialsFromWebhook,
};
