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
exports.updateAppLoyaltyAccrualsFromMerchant = exports.removeOldAccrualRules = exports.getMoneyCurrencyType = exports.rewardsRuleValue = exports.deleteAccrual = exports.updateLoyaltyItems = exports.updateLoyaltyStatuses = exports.updateAppLoyaltyFromMerchant = exports.isLoyaltyOrPromotionsOutOfDate = exports.updateBusinessLoyaltyCatalogIndicator = exports.createAppLoyaltyFromLoyaltyProgram = exports.updatePromotionsFromWebhook = exports.updateLoyaltyFromWebhook = exports.enrollCustomerInLoyalty = exports.LoyaltyStatusType = void 0;
const Loyalty_1 = require("../entity/Loyalty");
const LoyaltyAccrual_1 = require("../entity/LoyaltyAccrual");
const LoyaltyRewardTier_1 = require("../entity/LoyaltyRewardTier");
const Promotion_1 = require("../entity/Promotion");
const appDataSource_1 = require("../../appDataSource");
const Business_1 = require("../entity/Business");
const Customer_1 = require("../entity/Customer");
const EncryptionService_1 = require("./EncryptionService");
const MerchantService_1 = require("./MerchantService");
const typeorm_1 = require("typeorm");
var LoyaltyStatusType;
(function (LoyaltyStatusType) {
    LoyaltyStatusType["Active"] = "Active";
    LoyaltyStatusType["Inactive"] = "Inactive";
})(LoyaltyStatusType || (exports.LoyaltyStatusType = LoyaltyStatusType = {}));
const enrollCustomerInLoyalty = (businessId, token, firstName, lastName, phoneNumber, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside enrollCustomerInLoyalty');
    const existingLoyalty = yield Loyalty_1.Loyalty.createQueryBuilder('loyalty')
        .where('loyalty.businessId = :businessId', { businessId: businessId })
        .getOne();
    if (!existingLoyalty) {
        console.log('loyalty not found');
        return false;
    }
    // make sure it's ok to enroll in square loyalty
    if (!existingLoyalty.enrollInSquareLoyaltyDirectly) {
        console.log('enrollInSquareLoyaltyDirectly is false so skipping');
        return false;
    }
    // First, upsert loyalty account in merchant system
    let loyaltyCustomerAccountId = yield (0, MerchantService_1.createLoyaltyAccount)(token, existingLoyalty.merchantLoyaltyId, phoneNumber);
    if (!loyaltyCustomerAccountId) {
        // A null value could mean that the loyalty account already existed for this phone number
        const customerId = yield updateExistingCustomer(token, businessId, phoneNumber, firstName, lastName, email);
        return customerId;
    }
    let appCustomerId = yield insertCustomer(businessId, loyaltyCustomerAccountId);
    if (appCustomerId) {
        let merchCustomerId = yield (0, MerchantService_1.upsertMerchantCustomerAccount)(token, loyaltyCustomerAccountId, appCustomerId, firstName, lastName, phoneNumber, email);
        return merchCustomerId;
    }
    return null;
    return null;
});
exports.enrollCustomerInLoyalty = enrollCustomerInLoyalty;
/*  This function handles the case when a loyalty account already exists
    for a given phone number. We'll still try to insert our Customer and
    then update the merchant's customer account with our details.
*/
const updateExistingCustomer = (token, businessId, phoneNumber, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateExistingCustomer');
    let existingCustomerId = yield (0, MerchantService_1.lookupCustomerIdByPhoneNumber)(token, phoneNumber);
    if (existingCustomerId) {
        // Add the customer to our db
        let appCustomerId = yield insertCustomer(businessId, existingCustomerId);
        // Finally, upsert the merchant's customer account
        if (appCustomerId) {
            (0, MerchantService_1.upsertMerchantCustomerAccount)(token, existingCustomerId, appCustomerId, firstName, lastName, phoneNumber, email);
            return existingCustomerId;
        }
    }
    return null;
});
const insertCustomer = (businessId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('creating customer');
    try {
        const customer = yield appDataSource_1.AppDataSource.manager.create(Customer_1.Customer, {
            businessId: businessId,
            merchantCustomerId: customerId,
            createdDate: new Date(),
        });
        yield appDataSource_1.AppDataSource.manager.save(customer);
        console.log('just created customer with id:' + customer.id);
        return customerId;
    }
    catch (error) {
        if (error instanceof typeorm_1.QueryFailedError &&
            error.message.includes('customer_id_UNIQUE')) {
            console.log('Ignoring uplicate customer error');
            return customerId;
        }
        else {
            console.log('got error when inserting customer:' + error);
            return null;
        }
    }
});
const upsertCustomer = (businessId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside upsertCustomer with businessId: ' +
        businessId +
        ', customerId: ' +
        customerId);
    let customer = yield Customer_1.Customer.createQueryBuilder('customer')
        .where('customer.businessId = :businessId', { businessId: businessId })
        .andWhere('customer.merchantCustomerId = :customerId', {
        customerId: customerId,
    })
        .getOne();
    if (!customer) {
        console.log('creating customer');
        customer = yield appDataSource_1.AppDataSource.manager.create(Customer_1.Customer, {
            businessId: businessId,
            merchantCustomerId: customerId,
            createdDate: new Date(),
        });
        yield appDataSource_1.AppDataSource.manager.save(customer);
        console.log('just created customer with id:' + customer.id);
    }
    else {
        console.log('customer with id:' + customer.id + ' already exists');
    }
    return customer.id;
});
const updateLoyaltyFromWebhook = (merchantId, webhookLoyaltyProgram, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log('inside updateLoyaltyFromWebhook');
    const business = yield Business_1.Business.createQueryBuilder('business')
        .where('business.merchantId = :merchantId', { merchantId: merchantId })
        .getOne();
    if (!business) {
        console.log("Can't find Business for merchantId: " + merchantId);
        callback(false);
        return;
    }
    const token = (0, EncryptionService_1.decryptToken)(business.merchantAccessToken);
    if (!token) {
        console.log("Can't get token");
        callback(false);
        return;
    }
    let loyalty = yield appDataSource_1.AppDataSource.manager.findOne(Loyalty_1.Loyalty, {
        where: {
            businessId: business === null || business === void 0 ? void 0 : business.businessId,
        },
    });
    if (!loyalty) {
        console.log('Creating new Loyalty for webhook update');
        loyalty = Loyalty_1.Loyalty.create({
            showLoyaltyInApp: false,
            showPromotionsInApp: false,
            automaticallyUpdateChangesFromMerchant: false,
            loyaltyStatus: 'Inactive',
            terminologyOne: 'Pont',
            terminologyMany: 'Points',
            businessId: business.businessId,
            createDate: new Date(),
        });
        yield appDataSource_1.AppDataSource.manager.save(loyalty);
    }
    else {
        console.log('got loyalty: ' + loyalty);
    }
    if (!loyalty) {
        console.log('Unable to create new Loyalty for webhook');
        callback(false);
        return;
    }
    let status = webhookLoyaltyProgram.status.toLowerCase();
    // capitalize first letter of status
    loyalty.loyaltyStatus = status.charAt(0).toUpperCase() + status.slice(1);
    loyalty.terminologyOne = (_b = (_a = webhookLoyaltyProgram.terminology) === null || _a === void 0 ? void 0 : _a.one) !== null && _b !== void 0 ? _b : 'Point';
    loyalty.terminologyMany =
        (_d = (_c = webhookLoyaltyProgram.terminology) === null || _c === void 0 ? void 0 : _c.other) !== null && _d !== void 0 ? _d : 'Points';
    loyalty.locations = [];
    if (webhookLoyaltyProgram.locationIds) {
        for (var webhookLocationId of webhookLoyaltyProgram.locationIds) {
            loyalty.locations.push(webhookLocationId);
        }
    }
    loyalty.lastUpdateDate = new Date();
    console.log('about to save loyalty');
    yield appDataSource_1.AppDataSource.manager.save(loyalty);
    // Update Reward Tiers
    if (webhookLoyaltyProgram.rewardTiers && webhookLoyaltyProgram.terminology) {
        updateAppLoyaltyRewardTiersFromMerchant(webhookLoyaltyProgram.rewardTiers, webhookLoyaltyProgram.terminology, loyalty);
    }
    if (webhookLoyaltyProgram.accrualRules && webhookLoyaltyProgram.terminology) {
        (0, MerchantService_1.getCatalogItemIdMapFromAccurals)(token, webhookLoyaltyProgram.accrualRules, function (catalogItemNameMap) {
            updateAppLoyaltyAccrualsFromMerchant(webhookLoyaltyProgram.accrualRules, webhookLoyaltyProgram.terminology, loyalty, catalogItemNameMap);
            cleanUpLoyaltyAndSaveChanges(loyalty, webhookLoyaltyProgram, catalogItemNameMap.size > 0, function (wasSuccessful) {
                callback(wasSuccessful);
            });
        });
    }
    else {
        cleanUpLoyaltyAndSaveChanges(loyalty, webhookLoyaltyProgram, false, function (wasSuccessful) {
            callback(wasSuccessful);
        });
    }
});
exports.updateLoyaltyFromWebhook = updateLoyaltyFromWebhook;
const cleanUpLoyaltyAndSaveChanges = (loyalty, webhookLoyaltyProgram, loyaltyUsesCatalogItems, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside cleanUpLoyaltyAndSaveChanges');
    //Now let's remove old accrual rows from the db that are no longer in the loyalty program
    if (loyalty === null || loyalty === void 0 ? void 0 : loyalty.loyaltyAccruals) {
        removeOldAccrualRules(loyalty.loyaltyAccruals, webhookLoyaltyProgram);
    }
    //Remove old reward tier rows
    if (loyalty === null || loyalty === void 0 ? void 0 : loyalty.loyaltyRewardTiers) {
        removeOldRewardTiers(loyalty.loyaltyRewardTiers, webhookLoyaltyProgram);
    }
    (0, exports.updateBusinessLoyaltyCatalogIndicator)(loyalty.businessId, loyaltyUsesCatalogItems);
    callback(true);
});
const updatePromotionsFromWebhook = (merchantId, webhookLoyaltyPrmotion, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    console.log('inside updatePromotionsFromWebhook');
    const business = yield Business_1.Business.createQueryBuilder('business')
        .where('business.merchantId = :merchantId', { merchantId: merchantId })
        .getOne();
    if (!business) {
        console.log("Can't find Business for merchantId: " + merchantId);
        callback(false);
        return;
    }
    let loyalty = yield appDataSource_1.AppDataSource.manager.findOne(Loyalty_1.Loyalty, {
        where: {
            businessId: business === null || business === void 0 ? void 0 : business.businessId,
        },
    });
    if (loyalty) {
        loyalty.lastUpdateDate = new Date();
        console.log('updating lastUpdateDate on loyalty');
        yield appDataSource_1.AppDataSource.manager.save(loyalty);
    }
    let promotion = yield appDataSource_1.AppDataSource.manager.findOne(Promotion_1.Promotion, {
        where: {
            promotionId: webhookLoyaltyPrmotion.id,
        },
    });
    if (promotion) {
        if (webhookLoyaltyPrmotion.status == 'ACTIVE' ||
            webhookLoyaltyPrmotion.status == 'SCHEDULED') {
            updatePromotion(webhookLoyaltyPrmotion, promotion, (_e = promotion.displayName) !== null && _e !== void 0 ? _e : undefined);
            callback(true);
        }
        else {
            deletePromotion(promotion.id);
            callback(true);
        }
    }
    else {
        const existingLoyalty = yield Loyalty_1.Loyalty.createQueryBuilder('loyalty')
            .where('loyalty.businessId = :businessId', {
            businessId: business.businessId,
        })
            .getOne();
        if (existingLoyalty) {
            createPromotion(webhookLoyaltyPrmotion, existingLoyalty.id);
            callback(true);
        }
        else {
            console.log('unable to find loyalty for promotion');
            callback(false);
        }
    }
});
exports.updatePromotionsFromWebhook = updatePromotionsFromWebhook;
const createAppLoyaltyFromLoyaltyProgram = (businessId, loyaltyProgram, loyaltyPromotions, catalogItemNameMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    if (!loyaltyProgram.terminology) {
        console.log('terminology missing in createAppLoyaltyFromLoyaltyProgram');
        callback(undefined);
        return;
    }
    const loyalty = appDataSource_1.AppDataSource.manager.create(Loyalty_1.Loyalty, {
        showLoyaltyInApp: true,
        showPromotionsInApp: true,
        automaticallyUpdateChangesFromMerchant: true,
        loyaltyStatus: 'Active',
        terminologyOne: (_f = loyaltyProgram.terminology) === null || _f === void 0 ? void 0 : _f.one,
        terminologyMany: (_g = loyaltyProgram.terminology) === null || _g === void 0 ? void 0 : _g.other,
        businessId: businessId,
        merchantLoyaltyId: loyaltyProgram.id,
        createDate: new Date(),
    });
    yield appDataSource_1.AppDataSource.manager.save(loyalty);
    console.log('created new loyalty with id: ' + loyalty.id);
    const loyaltyId = loyalty.id;
    let loyaltyUsesCatalogItems = false;
    if (loyaltyProgram.accrualRules) {
        loyaltyProgram.accrualRules.forEach(function (loyaltyAccrualRule) {
            createAccrual(loyaltyAccrualRule, catalogItemNameMap, loyaltyProgram.terminology, loyaltyId);
            if (loyaltyAccrualRule.accrualType == 'CATEGORY' ||
                loyaltyAccrualRule.accrualType == 'ITEM_VARIATION')
                loyaltyUsesCatalogItems = true;
        });
    }
    if (loyaltyProgram.rewardTiers) {
        loyaltyProgram.rewardTiers.forEach(function (loyaltyRewardTier) {
            if (loyaltyRewardTier.id && loyaltyProgram.terminology) {
                createRewardTier(loyaltyRewardTier, loyaltyProgram.terminology, loyaltyId);
            }
        });
    }
    // var promotions: Promotion[] = [];
    if (loyaltyPromotions) {
        loyaltyPromotions.forEach(function (loyaltyPromotion) {
            createPromotion(loyaltyPromotion, loyaltyId);
        });
    }
    (0, exports.updateBusinessLoyaltyCatalogIndicator)(businessId, loyaltyUsesCatalogItems);
    callback(loyalty);
});
exports.createAppLoyaltyFromLoyaltyProgram = createAppLoyaltyFromLoyaltyProgram;
const updateBusinessLoyaltyCatalogIndicator = (businessId, loyaltyUsesCatalogItems) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.update(Business_1.Business, {
        businessId: businessId,
    }, {
        loyaltyUsesCatalogItems: loyaltyUsesCatalogItems,
        lastUpdateDate: new Date(),
    });
});
exports.updateBusinessLoyaltyCatalogIndicator = updateBusinessLoyaltyCatalogIndicator;
const isLoyaltyOrPromotionsOutOfDate = (loyalty, loyaltyProgram, promotions) => {
    // First check if loyalty program is out of date
    var loyaltyProgramUpdatedAt;
    if (loyaltyProgram.updatedAt) {
        loyaltyProgramUpdatedAt = new Date(loyaltyProgram.updatedAt);
    }
    var appLoyaltyUpdatedAt;
    if (loyalty.lastUpdateDate) {
        appLoyaltyUpdatedAt = loyalty.lastUpdateDate;
    }
    else if (loyalty.createDate) {
        appLoyaltyUpdatedAt = loyalty.createDate;
    }
    if (loyaltyProgramUpdatedAt && appLoyaltyUpdatedAt) {
        console.log('comparing loyaltyProgramUpdatedAt:' +
            loyaltyProgramUpdatedAt +
            ' to appLoyaltyUpdatedAt: ' +
            appLoyaltyUpdatedAt);
        if (appLoyaltyUpdatedAt.getTime() < loyaltyProgramUpdatedAt.getTime()) {
            return true;
        }
    }
    /// Now check all promotions to see if they're out of date, removed or new promos have been added
    console.log('promotions length: ' + promotions.length);
    for (var loyaltyPromotion of promotions) {
        console.log('checking promo ' + loyaltyPromotion.id);
        if (loyaltyPromotion.id && loyalty.promotions) {
            var wasPromoFound = false;
            for (var appPromotion of loyalty.promotions) {
                console.log('appPromotion.promotionId: ' + appPromotion.promotionId);
                console.log('appPromotion.merchantName: ' + appPromotion.merchantName);
                if (appPromotion.promotionId == loyaltyPromotion.id &&
                    appPromotion.lastUpdateDate) {
                    wasPromoFound = true;
                    // if (appPromotion.promotionId == loyaltyPromotion.id!) {
                    if (loyaltyPromotion.updatedAt) {
                        var loyaltyUpdatedAt = new Date(loyaltyPromotion.updatedAt);
                        if (loyaltyUpdatedAt) {
                            console.log('comparing lastUpdateDate:' +
                                appPromotion.lastUpdateDate +
                                ' to loyaltyUpdatedAt: ' +
                                loyaltyUpdatedAt);
                            if (appPromotion.lastUpdateDate.getTime() <
                                loyaltyUpdatedAt.getTime()) {
                                console.log('returning true1');
                                return true;
                            }
                        }
                        else {
                            console.log('returning true2');
                            return true;
                        }
                    }
                    else {
                        console.log('returning true3');
                        return true;
                    }
                }
            }
            if (!wasPromoFound) {
                console.log('returning true4');
                return true;
            }
        }
    }
    if (loyalty.promotions) {
        for (var appPromotion of loyalty.promotions) {
            if (appPromotion.loyaltyId) {
                console.log('checking to see if appPromotion exists in loyalty promotions');
                var wasPromoFound = false;
                for (var loyaltyPromotion of promotions) {
                    console.log('comparing loyaltyPromotion.promotionId: ' +
                        loyaltyPromotion.id +
                        ' to appPromotion.promotionId: ' +
                        appPromotion.promotionId);
                    if (loyaltyPromotion.id &&
                        loyaltyPromotion.id == appPromotion.promotionId) {
                        wasPromoFound = true;
                        console.log('setting wasPromoFound to true');
                    }
                }
                if (!wasPromoFound) {
                    console.log('returning true5');
                    return true;
                }
            }
        }
    }
    return false;
};
exports.isLoyaltyOrPromotionsOutOfDate = isLoyaltyOrPromotionsOutOfDate;
const updateAppLoyaltyFromMerchant = (loyalty, loyaltyProgram, promotions, catalogItemNameMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateAppLoyaltyFromMerchant');
    const queryRunner = yield appDataSource_1.AppDataSource.createQueryRunner();
    yield queryRunner.startTransaction();
    try {
        loyalty.lastUpdateDate = new Date();
        yield appDataSource_1.AppDataSource.manager.save(loyalty);
        let loyaltyUsesCatalogItems = false;
        if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
            updateAppLoyaltyAccrualsFromMerchant(loyaltyProgram.accrualRules, loyaltyProgram.terminology, loyalty, catalogItemNameMap);
            for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
                if (loyaltyAccrualRule.accrualType == 'CATEGORY' ||
                    loyaltyAccrualRule.accrualType == 'ITEM_VARIATION')
                    loyaltyUsesCatalogItems = true;
            }
        }
        // Update Reward Tiers
        if (loyaltyProgram.rewardTiers && loyaltyProgram.terminology) {
            var loyaltyRewardTier = updateAppLoyaltyRewardTiersFromMerchant(loyaltyProgram.rewardTiers, loyaltyProgram.terminology, loyalty);
        }
        //Update Promotions from merchant
        if (loyaltyProgram.terminology) {
            var loyaltyPromotion = updateAppLoyaltyPromotionsFromMerchant(promotions, loyaltyProgram.terminology, loyalty);
        }
        //Now let's remove old accrual rows from the db that are no longer in the loyalty program
        if (loyalty.loyaltyAccruals) {
            removeOldAccrualRules(loyalty.loyaltyAccruals, loyaltyProgram);
        }
        //Remove old reward tier rows
        if (loyalty.loyaltyRewardTiers) {
            removeOldRewardTiers(loyalty.loyaltyRewardTiers, loyaltyProgram);
        }
        //Remove old promotion rows
        if (loyalty.promotions) {
            removeOldPromotions(loyalty, promotions);
        }
        (0, exports.updateBusinessLoyaltyCatalogIndicator)(loyalty.businessId, loyaltyUsesCatalogItems);
        yield queryRunner.commitTransaction();
        callback(loyalty);
    }
    catch (err) {
        console.log('error in updateAppLoyaltyFromMerchant: ' + err);
        yield queryRunner.rollbackTransaction();
    }
    finally {
        yield queryRunner.release();
    }
});
exports.updateAppLoyaltyFromMerchant = updateAppLoyaltyFromMerchant;
const updateLoyaltyStatuses = (businessId, loyaltyId, showLoyaltyInApp, showPromotionsInApp, automaticallyUpdateChangesFromMerchant, loyaltyStatus, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside updateLoyaltyStatus');
    console.log('showLoyaltyInApp: ' + showLoyaltyInApp);
    const existingLoyalty = yield Loyalty_1.Loyalty.createQueryBuilder('loyalty')
        .where('loyalty.businessId = :businessId', { businessId: businessId })
        .getOne();
    if (existingLoyalty && existingLoyalty.id == loyaltyId) {
        yield Loyalty_1.Loyalty.update(existingLoyalty.id, {
            showLoyaltyInApp: showLoyaltyInApp,
            showPromotionsInApp: showPromotionsInApp,
            automaticallyUpdateChangesFromMerchant: automaticallyUpdateChangesFromMerchant,
            loyaltyStatus: loyaltyStatus,
            lastUpdateDate: new Date(),
        });
        callback(true);
    }
    else {
        console.log('existingLoyalty not found');
    }
});
exports.updateLoyaltyStatuses = updateLoyaltyStatuses;
const updateLoyaltyItems = (businessId, loyaltyId, loyaltyAccruals, promotions, loyaltyRewardTiers, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k;
    console.log('inside updateLoyaltyItems');
    const existingLoyalty = yield Loyalty_1.Loyalty.findOne({
        where: {
            id: loyaltyId,
        },
    });
    if (!existingLoyalty) {
        console.log('loyaltyId: ' + loyaltyId + ' not found');
        callback(false);
    }
    const queryRunner = yield appDataSource_1.AppDataSource.createQueryRunner();
    yield queryRunner.startTransaction();
    try {
        if (loyaltyAccruals) {
            for (var loyaltyAccrual of loyaltyAccruals) {
                var matches = (_h = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.loyaltyAccruals) === null || _h === void 0 ? void 0 : _h.filter((accrual) => accrual.id == loyaltyAccrual.id);
                if (matches && matches.length > 0) {
                    if (matches[0].displayEarningPointsDescription !=
                        loyaltyAccrual.displayEarningPointsDescription ||
                        matches[0].displayEarningAdditionalEarningPointsDescription !=
                            loyaltyAccrual.displayEarningAdditionalEarningPointsDescription) {
                        console.log('loyaltyAccrual will be updated for id: ' + loyaltyAccrual.id);
                        yield LoyaltyAccrual_1.LoyaltyAccrual.update(loyaltyAccrual.id, {
                            displayEarningPointsDescription: loyaltyAccrual.displayEarningPointsDescription,
                            displayEarningAdditionalEarningPointsDescription: loyaltyAccrual.displayEarningAdditionalEarningPointsDescription,
                            lastUpdateDate: new Date(),
                        });
                    }
                }
            }
        }
        if (promotions) {
            for (var promotion of promotions) {
                var promotionMatches = (_j = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.promotions) === null || _j === void 0 ? void 0 : _j.filter((existingPromotion) => existingPromotion.id == promotion.id);
                if (promotionMatches && promotionMatches.length > 0) {
                    if (promotionMatches[0].displayName != promotion.displayName) {
                        console.log('promotion will be updated for id: ' + promotion.id);
                        yield Promotion_1.Promotion.update(promotion.id, {
                            displayName: promotion.displayName,
                            lastUpdateDate: new Date(),
                        });
                    }
                }
            }
        }
        if (loyaltyRewardTiers) {
            for (var loyaltyRewardTier of loyaltyRewardTiers) {
                var rewardTierMatches = (_k = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.loyaltyRewardTiers) === null || _k === void 0 ? void 0 : _k.filter((existingRewardTier) => existingRewardTier.id == loyaltyRewardTier.id);
                if (rewardTierMatches && rewardTierMatches.length > 0) {
                    if (rewardTierMatches[0].displayReward !=
                        loyaltyRewardTier.displayReward ||
                        rewardTierMatches[0].displayRewardDescription !=
                            loyaltyRewardTier.displayRewardDescription) {
                        console.log('loyaltyRewardTier will be updated for id: ' +
                            loyaltyRewardTier.id);
                        yield LoyaltyRewardTier_1.LoyaltyRewardTier.update(loyaltyRewardTier.id, {
                            displayReward: loyaltyRewardTier.displayReward,
                            displayRewardDescription: loyaltyRewardTier.displayRewardDescription,
                            lastUpdateDate: new Date(),
                        });
                    }
                }
            }
        }
        yield queryRunner.commitTransaction();
        callback(true);
    }
    catch (err) {
        console.log('error in updateLoyaltyItems: ' + err);
        yield queryRunner.rollbackTransaction();
    }
    finally {
        yield queryRunner.release();
    }
});
exports.updateLoyaltyItems = updateLoyaltyItems;
const deleteAccrual = (accrualId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(LoyaltyAccrual_1.LoyaltyAccrual, accrualId);
    console.log('just deleted accral with id:' + accrualId);
});
exports.deleteAccrual = deleteAccrual;
const deleteRewardTier = (rewardTierId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(LoyaltyRewardTier_1.LoyaltyRewardTier, rewardTierId);
    console.log('just deleted reward tier with id:' + rewardTierId);
});
const deletePromotion = (promotionId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(Promotion_1.Promotion, promotionId);
    console.log('just deleted promotion with id:' + promotionId);
});
const createAccrual = (loyaltyAccrualRule, catalogItemNameMap, terminology, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p;
    var itemName = undefined;
    if ((_l = loyaltyAccrualRule.categoryData) === null || _l === void 0 ? void 0 : _l.categoryId) {
        itemName = catalogItemNameMap.get(loyaltyAccrualRule.categoryData.categoryId);
    }
    else if ((_m = loyaltyAccrualRule.itemVariationData) === null || _m === void 0 ? void 0 : _m.itemVariationId) {
        itemName = catalogItemNameMap.get(loyaltyAccrualRule.itemVariationData.itemVariationId);
    }
    const ruleValues = (0, exports.rewardsRuleValue)(loyaltyAccrualRule, itemName, terminology);
    console.log('ruleValues: ' + ruleValues);
    const accrual = appDataSource_1.AppDataSource.manager.create(LoyaltyAccrual_1.LoyaltyAccrual, {
        loyaltyId: loyaltyId,
        accrualType: loyaltyAccrualRule.accrualType,
        categoryId: (_o = loyaltyAccrualRule.categoryData) === null || _o === void 0 ? void 0 : _o.categoryId,
        variantId: (_p = loyaltyAccrualRule.itemVariationData) === null || _p === void 0 ? void 0 : _p.itemVariationId,
        merchantEarningPointsDescription: ruleValues[0],
        merchantAdditionalEarningPointsDescription: ruleValues[1],
    });
    yield appDataSource_1.AppDataSource.manager.save(accrual);
    console.log('just created accral with id:' + accrual.id);
});
const updateAccrual = (loyaltyAccrualRule, catalogItemNameMap, terminology, loyaltyId, existingAppAccural, displayEarningPointsDescription, displayAdditionalEarningPointsDescription) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r, _s, _t, _u, _v;
    console.log('inside updateAccrual');
    var itemName = undefined;
    if ((_q = loyaltyAccrualRule.categoryData) === null || _q === void 0 ? void 0 : _q.categoryId) {
        itemName = catalogItemNameMap.get(loyaltyAccrualRule.categoryData.categoryId);
    }
    else if ((_r = loyaltyAccrualRule.itemVariationData) === null || _r === void 0 ? void 0 : _r.itemVariationId) {
        itemName = catalogItemNameMap.get(loyaltyAccrualRule.itemVariationData.itemVariationId);
    }
    const ruleValues = (0, exports.rewardsRuleValue)(loyaltyAccrualRule, itemName, terminology);
    console.log('ruleValues: ' + ruleValues);
    console.log('existingAppAccural.displayEarningAdditionalEarningPointsDescription = ' +
        existingAppAccural.displayEarningAdditionalEarningPointsDescription);
    yield appDataSource_1.AppDataSource.manager.update(LoyaltyAccrual_1.LoyaltyAccrual, {
        id: existingAppAccural.id,
    }, {
        accrualType: loyaltyAccrualRule.accrualType,
        categoryId: (_t = (_s = loyaltyAccrualRule.categoryData) === null || _s === void 0 ? void 0 : _s.categoryId) !== null && _t !== void 0 ? _t : undefined,
        variantId: (_v = (_u = loyaltyAccrualRule.itemVariationData) === null || _u === void 0 ? void 0 : _u.itemVariationId) !== null && _v !== void 0 ? _v : undefined,
        merchantEarningPointsDescription: ruleValues[0],
        merchantAdditionalEarningPointsDescription: ruleValues[1],
        displayEarningPointsDescription: displayEarningPointsDescription !== null && displayEarningPointsDescription !== void 0 ? displayEarningPointsDescription : null,
        displayEarningAdditionalEarningPointsDescription: displayAdditionalEarningPointsDescription !== null && displayAdditionalEarningPointsDescription !== void 0 ? displayAdditionalEarningPointsDescription : null,
        lastUpdateDate: new Date(),
    });
    console.log('just updated loyatyAccrual with id:' + existingAppAccural.id);
});
const createRewardTier = (loyaltyRewardTier, terminology, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside createRewardTier');
    const rewardTier = appDataSource_1.AppDataSource.manager.create(LoyaltyRewardTier_1.LoyaltyRewardTier, {
        loyaltyId: loyaltyId,
        rewardTierId: loyaltyRewardTier.id,
        merchantReward: getRewardValue(loyaltyRewardTier, terminology),
        merchantRewardDescription: loyaltyRewardTier.name,
    });
    // rewardTiers.push(rewardTier);
    yield appDataSource_1.AppDataSource.manager.save(rewardTier);
    console.log('just created rewardTier with id:' + rewardTier.id);
});
const updateRewardTier = (loyaltyRewardTier, terminology, loyaltyId, existingAppRewardTier, displayRewardDescription) => __awaiter(void 0, void 0, void 0, function* () {
    var _w;
    appDataSource_1.AppDataSource.manager.update(LoyaltyRewardTier_1.LoyaltyRewardTier, {
        id: existingAppRewardTier.id,
    }, {
        merchantReward: getRewardValue(loyaltyRewardTier, terminology),
        merchantRewardDescription: loyaltyRewardTier.name,
        displayReward: (_w = existingAppRewardTier.displayReward) !== null && _w !== void 0 ? _w : null,
        displayRewardDescription: displayRewardDescription !== null && displayRewardDescription !== void 0 ? displayRewardDescription : null,
        lastUpdateDate: new Date(),
    });
    console.log('just updaated rewardTier with id:' + existingAppRewardTier.id);
});
const createPromotion = (loyaltyPromotion, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
    var startsOn;
    if (loyaltyPromotion.availableTime.startDate) {
        startsOn = new Date(loyaltyPromotion.availableTime.startDate);
    }
    const promotion = appDataSource_1.AppDataSource.manager.create(Promotion_1.Promotion, {
        loyaltyId: loyaltyId,
        promotionId: loyaltyPromotion.id,
        status: loyaltyPromotion.status,
        merchantName: loyaltyPromotion.name,
        promotionStartsOn: startsOn,
    });
    // promotions.push(promotion);
    yield appDataSource_1.AppDataSource.manager.save(promotion);
    console.log('just created promotion with id: ' + promotion.id);
});
const updatePromotion = (loyaltyPromotion, existingPromotion, displayName) => __awaiter(void 0, void 0, void 0, function* () {
    var startsOn;
    if (loyaltyPromotion.availableTime.startDate) {
        startsOn = new Date(loyaltyPromotion.availableTime.startDate);
    }
    appDataSource_1.AppDataSource.manager.update(Promotion_1.Promotion, {
        id: existingPromotion.id,
    }, {
        status: loyaltyPromotion.status,
        merchantName: loyaltyPromotion.name,
        promotionStartsOn: startsOn,
        displayName: displayName !== null && displayName !== void 0 ? displayName : null,
        lastUpdateDate: new Date(),
    });
    console.log('just updated promotion with id: ' + existingPromotion.id);
});
const rewardsRuleValue = (accrualRule, itemName, terminology) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    console.log('inside rewardsRuleValue with accrualType of ' + accrualRule.accrualType);
    switch (accrualRule.accrualType) {
        case 'VISIT':
            console.log('rewardsRuleValue type is VISIT');
            var visitRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) +
                ' for every visit. ';
            if (((_a = accrualRule.visitData) === null || _a === void 0 ? void 0 : _a.minimumAmountMoney) &&
                ((_c = (_b = accrualRule.visitData) === null || _b === void 0 ? void 0 : _b.minimumAmountMoney) === null || _c === void 0 ? void 0 : _c.amount)) {
                const currency = (_e = (_d = accrualRule.visitData) === null || _d === void 0 ? void 0 : _d.minimumAmountMoney.currency) !== null && _e !== void 0 ? _e : 'USD';
                const amount = (_g = (_f = accrualRule.visitData) === null || _f === void 0 ? void 0 : _f.minimumAmountMoney) === null || _g === void 0 ? void 0 : _g.amount;
                if (amount && currency) {
                    const currencyType = (0, exports.getMoneyCurrencyType)(currency);
                    if (currencyType) {
                        const adjustedAmount = Number(amount) / 100.0;
                        const showCents = Number(amount) % 100.0 > 0;
                        const ruleMinimum = adjustedAmount.toLocaleString(currencyType, {
                            style: 'currency',
                            currency: currency,
                            maximumFractionDigits: showCents ? 2 : 0,
                        });
                        visitRuleDescription += ruleMinimum + ' minimum purchase.';
                    }
                }
            }
            return [visitRuleDescription, ''];
        case 'SPEND':
            console.log('rewardsRuleValue type is SPEND');
            var additionalDescription = '';
            const amount = (_j = (_h = accrualRule.spendData) === null || _h === void 0 ? void 0 : _h.amountMoney) === null || _j === void 0 ? void 0 : _j.amount;
            const currency = (_m = (_l = (_k = accrualRule.spendData) === null || _k === void 0 ? void 0 : _k.amountMoney) === null || _l === void 0 ? void 0 : _l.currency) !== null && _m !== void 0 ? _m : 'USD';
            if (amount && currency) {
                console.log('got amount and currency');
                const currencyType = (0, exports.getMoneyCurrencyType)(currency);
                if (currencyType) {
                    const adjustedAmount = Number(amount) / 100.0;
                    const showCents = Number(amount) % 100.0 > 0;
                    const ruleAmount = adjustedAmount.toLocaleString(currencyType, {
                        style: 'currency',
                        currency: currency,
                        maximumFractionDigits: showCents ? 2 : 0,
                    });
                    var spendRuleDescription = rewardsPointsEarned(accrualRule.points, terminology);
                    spendRuleDescription +=
                        ' for every ' + ruleAmount + ' spent in a single transaction.';
                    const excludedItemVariationIds = (_o = accrualRule.spendData) === null || _o === void 0 ? void 0 : _o.excludedItemVariationIds;
                    const excludedCategoryIds = (_p = accrualRule.spendData) === null || _p === void 0 ? void 0 : _p.excludedCategoryIds;
                    if ((excludedItemVariationIds && excludedItemVariationIds.length > 0) ||
                        (excludedCategoryIds && excludedCategoryIds.length > 0)) {
                        additionalDescription =
                            'Certain items are excluded from earning Stars';
                    }
                    return [spendRuleDescription, additionalDescription];
                }
            }
            else {
                console.log('missing amount or currency');
            }
            return ['', ''];
        case 'CATEGORY':
            console.log('rewardsRuleValue type is CATEGORY');
            const ruleDescription = rewardsPointsEarned(accrualRule.points, terminology);
            const name = itemName !== null && itemName !== void 0 ? itemName : '';
            return [
                ruleDescription + ' for any item in ' + name + ' purchased',
                undefined,
            ];
        case 'ITEM_VARIATION':
            console.log('rewardsRuleValue type is ITEM with itemName: ' + itemName);
            const purchasedItemName = itemName
                ? ' for every ' + itemName
                : ' for certain items ';
            const itemRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) +
                purchasedItemName +
                ' purchased.';
            return [itemRuleDescription, ''];
    }
    return [undefined, undefined];
};
exports.rewardsRuleValue = rewardsRuleValue;
const MoneyCurrencyType = {
    USD: 'en-US',
};
const getMoneyCurrencyType = (type) => {
    if (type == 'USD') {
        return MoneyCurrencyType.USD;
    }
    return null;
};
exports.getMoneyCurrencyType = getMoneyCurrencyType;
const rewardsPointsEarned = (loyaltyPoints, terminology) => {
    var ruleDescription = 'Earn ';
    const points = loyaltyPoints !== null && loyaltyPoints !== void 0 ? loyaltyPoints : 0;
    return (ruleDescription +
        String(points) +
        ' ' +
        (points > 1 ? terminology.other : terminology.one));
};
const getRewardValue = (rewardTier, terminology) => {
    return (String(rewardTier.points) +
        ' ' +
        (rewardTier.points > 1 ? terminology.other : terminology.one));
};
function removeOldPromotions(loyalty, promotions) {
    for (var appPromotion of loyalty.promotions) {
        var wasPromotionFound = false;
        for (var loyaltyPromotion of promotions) {
            if (loyaltyPromotion.id) {
                if (appPromotion.promotionId == loyaltyPromotion.id) {
                    wasPromotionFound = true;
                    console.log('found promotion');
                }
            }
        }
        if (!wasPromotionFound) {
            console.log('need to delete promotion: ' + appPromotion.id);
            deletePromotion(appPromotion.id);
        }
    }
}
function removeOldRewardTiers(loyaltyRewardTiers, loyaltyProgram) {
    console.log('inside removeOldRewardTiers');
    for (var appRewardTier of loyaltyRewardTiers) {
        var wasRewardTierFound = false;
        if (loyaltyProgram.rewardTiers) {
            for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
                if (loyaltyRewardTier.id) {
                    if (appRewardTier.rewardTierId == loyaltyRewardTier.id) {
                        wasRewardTierFound = true;
                        console.log('found rewardTier');
                    }
                }
            }
        }
        if (!wasRewardTierFound) {
            console.log('need to delete rewardTier: ' + appRewardTier.id);
            deleteRewardTier(appRewardTier.id);
        }
    }
}
function removeOldAccrualRules(loyaltyAccruals, loyaltyProgram) {
    var _a, _b;
    console.log('inside removeOldAccrualRules');
    for (var appLoyaltyAccrual of loyaltyAccruals) {
        var wasAccrualFound = false;
        // Look up accrual in currenty loyalty program
        if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
            for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
                if (loyaltyAccrualRule.accrualType == 'ITEM_VARIATION' &&
                    appLoyaltyAccrual.accrualType == 'ITEM_VARIATION') {
                    if (((_a = loyaltyAccrualRule.itemVariationData) === null || _a === void 0 ? void 0 : _a.itemVariationId) ==
                        appLoyaltyAccrual.variantId) {
                        wasAccrualFound = true;
                    }
                }
                else if (loyaltyAccrualRule.accrualType == 'CATEGORY' &&
                    appLoyaltyAccrual.accrualType == 'CATEGORY') {
                    if (((_b = loyaltyAccrualRule.categoryData) === null || _b === void 0 ? void 0 : _b.categoryId) ==
                        appLoyaltyAccrual.categoryId) {
                        wasAccrualFound = true;
                        console.log('got a match on Category accrual');
                    }
                }
                else if (loyaltyAccrualRule.accrualType == 'VISIT' &&
                    appLoyaltyAccrual.accrualType == 'VISIT') {
                    wasAccrualFound = true;
                }
                else if (loyaltyAccrualRule.accrualType == 'SPEND' &&
                    appLoyaltyAccrual.accrualType == 'SPEND') {
                    wasAccrualFound = true;
                }
            }
        }
        if (!wasAccrualFound) {
            console.log('need to delete accrualId: ' + appLoyaltyAccrual.id);
            (0, exports.deleteAccrual)(appLoyaltyAccrual.id);
        }
    }
}
exports.removeOldAccrualRules = removeOldAccrualRules;
function updateAppLoyaltyPromotionsFromMerchant(promotions, terminology, loyalty) {
    var _a;
    console.log('inside updateAppLoyaltyPromotionsFromMerchant');
    for (var loyaltyPromotion of promotions) {
        var existingPromotion = undefined;
        var displayName = undefined;
        if (loyalty.promotions && loyaltyPromotion.id) {
            console.log('searching loyalty.promotions for loyaltyPromotion.promotionId' +
                loyaltyPromotion.id);
            var promoMatches = loyalty.promotions.filter((promo) => promo.promotionId == loyaltyPromotion.id);
            if (promoMatches && promoMatches.length > 0) {
                existingPromotion = promoMatches[0];
                displayName = (_a = existingPromotion.displayName) !== null && _a !== void 0 ? _a : undefined;
            }
        }
        console.log('existingPromotion: ' + existingPromotion);
        if (existingPromotion) {
            // Remove overriden name if the merchant name has changed since we overrode it
            if (existingPromotion.merchantName &&
                loyaltyPromotion.name != existingPromotion.merchantName) {
                displayName = undefined;
            }
        }
        if (existingPromotion) {
            updatePromotion(loyaltyPromotion, existingPromotion, displayName);
        }
        else {
            createPromotion(loyaltyPromotion, loyalty.id);
        }
    }
    // return loyaltyPromotion;
}
function updateAppLoyaltyRewardTiersFromMerchant(loyaltyProgramRewardTiers, terminology, loyalty) {
    var _a;
    console.log('inside updateAppLoyaltyRewardTiersFromMerchant');
    for (var loyaltyRewardTier of loyaltyProgramRewardTiers) {
        var existingAppRewardTier = undefined;
        var displayRewardDescription = undefined;
        if (loyalty.loyaltyRewardTiers && loyaltyRewardTier.id) {
            console.log('searching loyaltyRewardTiers for loyaltyRewardTier.id' +
                loyaltyRewardTier.id);
            var tierMatches = loyalty.loyaltyRewardTiers.filter((rewardTier) => rewardTier.rewardTierId == loyaltyRewardTier.id);
            if (tierMatches && tierMatches.length > 0) {
                existingAppRewardTier = tierMatches[0];
                displayRewardDescription =
                    (_a = tierMatches[0].displayRewardDescription) !== null && _a !== void 0 ? _a : undefined;
            }
        }
        console.log('existingAppRewardTier: ' + existingAppRewardTier);
        console.log('comparing existingAppRewardTier?.merchantRewardDescription: ' +
            (existingAppRewardTier === null || existingAppRewardTier === void 0 ? void 0 : existingAppRewardTier.merchantRewardDescription) +
            ' to loyaltyRewardTier.name: ' +
            loyaltyRewardTier.name);
        if (existingAppRewardTier) {
            if (existingAppRewardTier.merchantRewardDescription &&
                loyaltyRewardTier.name) {
                if (existingAppRewardTier.merchantRewardDescription !=
                    loyaltyRewardTier.name) {
                    console.log('clearing existingAppRewardTier.displayRewardDescription');
                    displayRewardDescription = undefined;
                }
            }
        }
        if (existingAppRewardTier) {
            updateRewardTier(loyaltyRewardTier, terminology, loyalty.id, existingAppRewardTier, displayRewardDescription);
        }
        else {
            createRewardTier(loyaltyRewardTier, terminology, loyalty.id);
        }
    }
    // return loyaltyRewardTier;
}
function updateAppLoyaltyAccrualsFromMerchant(loyaltyProgramAccrualRules, terminology, loyalty, catalogItemNameMap) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    console.log('inside updateAppLoyaltyAccrualsFromMerchant');
    console.log('catalogItemNameMap size: ' + catalogItemNameMap.size);
    for (var loyaltyAccrualRule of loyaltyProgramAccrualRules) {
        var existingAppAccural = undefined;
        var displayEarningPointsDescription = undefined;
        var displayAdditionalEarningPointsDescription = undefined;
        if (loyalty.loyaltyAccruals) {
            if (loyaltyAccrualRule.accrualType == 'ITEM_VARIATION') {
                if ((_a = loyaltyAccrualRule.itemVariationData) === null || _a === void 0 ? void 0 : _a.itemVariationId) {
                    for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                        if (appLoyaltyAccrual.variantId &&
                            appLoyaltyAccrual.variantId ==
                                loyaltyAccrualRule.itemVariationData.itemVariationId) {
                            existingAppAccural = appLoyaltyAccrual;
                            displayEarningPointsDescription =
                                (_b = appLoyaltyAccrual.displayEarningPointsDescription) !== null && _b !== void 0 ? _b : undefined;
                            displayAdditionalEarningPointsDescription =
                                (_c = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription) !== null && _c !== void 0 ? _c : undefined;
                        }
                    }
                }
            }
            else if (loyaltyAccrualRule.accrualType == 'CATEGORY') {
                if ((_d = loyaltyAccrualRule.categoryData) === null || _d === void 0 ? void 0 : _d.categoryId) {
                    for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                        if (appLoyaltyAccrual.categoryId &&
                            appLoyaltyAccrual.categoryId ==
                                loyaltyAccrualRule.categoryData.categoryId) {
                            existingAppAccural = appLoyaltyAccrual;
                            displayEarningPointsDescription =
                                (_e = appLoyaltyAccrual.displayEarningPointsDescription) !== null && _e !== void 0 ? _e : undefined;
                            displayAdditionalEarningPointsDescription =
                                (_f = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription) !== null && _f !== void 0 ? _f : undefined;
                        }
                    }
                }
            }
            else {
                console.log('checking for matches');
                var matches = loyalty.loyaltyAccruals.filter((accrual) => accrual.accrualType == loyaltyAccrualRule.accrualType);
                if (matches && matches.length > 0) {
                    existingAppAccural = matches[0];
                    displayEarningPointsDescription =
                        (_g = matches[0].displayEarningPointsDescription) !== null && _g !== void 0 ? _g : undefined;
                    displayAdditionalEarningPointsDescription =
                        (_h = matches[0].displayEarningAdditionalEarningPointsDescription) !== null && _h !== void 0 ? _h : undefined;
                }
            }
        }
        var itemName = undefined;
        if ((_j = loyaltyAccrualRule.categoryData) === null || _j === void 0 ? void 0 : _j.categoryId) {
            console.log('looking up categoryId in map ' +
                loyaltyAccrualRule.categoryData.categoryId);
            itemName = catalogItemNameMap.get(loyaltyAccrualRule.categoryData.categoryId);
        }
        else if ((_k = loyaltyAccrualRule.itemVariationData) === null || _k === void 0 ? void 0 : _k.itemVariationId) {
            console.log('looking up itemId in map ' +
                loyaltyAccrualRule.itemVariationData.itemVariationId);
            itemName = catalogItemNameMap.get(loyaltyAccrualRule.itemVariationData.itemVariationId);
        }
        console.log('itemName: ' + itemName);
        const currentRuleDescriptions = (0, exports.rewardsRuleValue)(loyaltyAccrualRule, itemName, terminology);
        console.log('currentRuleDescriptions: ' + currentRuleDescriptions);
        console.log('existingAppAccural: ' + existingAppAccural);
        let shouldRemoveAccrualWhenItemIsMissiong = false;
        // If core description or core additional description has changed, disregard existing app accrual
        if (existingAppAccural) {
            if (!accrualIsValid(loyaltyAccrualRule.accrualType, itemName)) {
                shouldRemoveAccrualWhenItemIsMissiong = true;
                console.log('removing accrual because name was not found');
            }
            else {
                console.log('existingAppAccural!.merchantEarningPointsDescription: ' +
                    existingAppAccural.merchantEarningPointsDescription);
                console.log('currentRuleDescriptions[0]: ' + currentRuleDescriptions[0]);
                if (existingAppAccural.merchantEarningPointsDescription &&
                    existingAppAccural.merchantEarningPointsDescription !=
                        currentRuleDescriptions[0]) {
                    console.log('setting existingAppAccural to null1. existingAppAccural?.merchantEarningPointsDescription: ' +
                        (existingAppAccural === null || existingAppAccural === void 0 ? void 0 : existingAppAccural.merchantEarningPointsDescription) +
                        ', currentRuleDescriptions[0]: ' +
                        currentRuleDescriptions[0]);
                    displayEarningPointsDescription = undefined;
                }
                //TODO: Need to figure out why this code fails with Cannot read properties of undefined (reading 'merchantAdditionalEarningPointsDescription')
                // if (existingAppAccural!.merchantAdditionalEarningPointsDescription != undefined) {
                //   if (existingAppAccural!.merchantAdditionalEarningPointsDescription != currentRuleDescriptions[1]) {
                //     existingAppAccural = undefined;
                //     console.log("setting existingAppAccural to null2");
                //   }
                // }
            }
        }
        if (shouldRemoveAccrualWhenItemIsMissiong && (existingAppAccural === null || existingAppAccural === void 0 ? void 0 : existingAppAccural.id)) {
            (0, exports.deleteAccrual)(existingAppAccural.id);
        }
        else if (existingAppAccural) {
            updateAccrual(loyaltyAccrualRule, catalogItemNameMap, terminology, loyalty.id, existingAppAccural, displayEarningPointsDescription, displayAdditionalEarningPointsDescription);
        }
        else {
            if (accrualIsValid(loyaltyAccrualRule.accrualType, itemName)) {
                createAccrual(loyaltyAccrualRule, catalogItemNameMap, terminology, loyalty.id);
            }
        }
    }
    console.log('returning from updateAppLoyaltyAccrualsFromMerchant');
    // return { appLoyaltyAccrual, loyaltyAccrualRule };
}
exports.updateAppLoyaltyAccrualsFromMerchant = updateAppLoyaltyAccrualsFromMerchant;
const accrualIsValid = (accrualType, itemName) => {
    if ((accrualType == 'CATEGORY' || 'ITEM_VARIATION') &&
        itemName == undefined) {
        return false;
    }
    return true;
};
module.exports = {
    createAppLoyaltyFromLoyaltyProgram: exports.createAppLoyaltyFromLoyaltyProgram,
    deleteAccrual: exports.deleteAccrual,
    enrollCustomerInLoyalty: exports.enrollCustomerInLoyalty,
    isLoyaltyOrPromotionsOutOfDate: exports.isLoyaltyOrPromotionsOutOfDate,
    updateAppLoyaltyFromMerchant: exports.updateAppLoyaltyFromMerchant,
    updateLoyaltyFromWebhook: exports.updateLoyaltyFromWebhook,
    updatePromotionsFromWebhook: exports.updatePromotionsFromWebhook,
    updateLoyaltyItems: exports.updateLoyaltyItems,
    updateLoyaltyStatuses: exports.updateLoyaltyStatuses,
    LoyaltyStatusType,
    rewardsRuleValue: exports.rewardsRuleValue,
    updateBusinessLoyaltyCatalogIndicator: exports.updateBusinessLoyaltyCatalogIndicator,
    updateAppLoyaltyAccrualsFromMerchant,
    removeOldAccrualRules,
    getMoneyCurrencyType: exports.getMoneyCurrencyType,
};
