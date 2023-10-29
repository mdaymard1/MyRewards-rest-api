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
exports.updateLoyaltyItems = exports.updateLoyaltyStatuses = exports.updateAppLoyaltyFromMerchant = exports.isLoyaltyOrPromotionsOutOfDate = exports.createAppLoyaltyFromLoyaltyProgram = exports.LoyaltyStatusType = void 0;
const Loyalty_1 = require("../entity/Loyalty");
const LoyaltyAccrual_1 = require("../entity/LoyaltyAccrual");
const LoyaltyRewardTier_1 = require("../entity/LoyaltyRewardTier");
const Promotion_1 = require("../entity/Promotion");
const appDataSource_1 = require("../../appDataSource");
var LoyaltyStatusType;
(function (LoyaltyStatusType) {
    LoyaltyStatusType["Active"] = "Active";
    LoyaltyStatusType["Inactive"] = "Inactive";
})(LoyaltyStatusType || (exports.LoyaltyStatusType = LoyaltyStatusType = {}));
const createAppLoyaltyFromLoyaltyProgram = (businessId, loyaltyProgram, loyaltyPromotions, categoryIdMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!loyaltyProgram.terminology) {
        console.log("terminology missing in createAppLoyaltyFromLoyaltyProgram");
        callback(undefined);
        return;
    }
    const loyalty = appDataSource_1.AppDataSource.manager.create(Loyalty_1.Loyalty, {
        showLoyaltyInApp: true,
        showPromotionsInApp: true,
        automaticallyUpdateChangesFromMerchant: true,
        loyaltyStatus: "Active",
        terminologyOne: (_a = loyaltyProgram.terminology) === null || _a === void 0 ? void 0 : _a.one,
        terminologyMany: (_b = loyaltyProgram.terminology) === null || _b === void 0 ? void 0 : _b.other,
        businessId: businessId,
        createDate: new Date(),
    });
    console.log("created new loyalty with id: " + loyalty.id);
    const loyaltyId = loyalty.id;
    // var accrualRules: LoyaltyAccrual[] = [];
    if (loyaltyProgram.accrualRules) {
        loyaltyProgram.accrualRules.forEach(function (loyaltyAccrualRule) {
            createAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology, loyaltyId);
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
            createPromotion(loyaltyPromotion, loyaltyProgram.terminology, loyaltyId);
        });
    }
    callback(loyalty);
});
exports.createAppLoyaltyFromLoyaltyProgram = createAppLoyaltyFromLoyaltyProgram;
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
        console.log("comparing loyaltyProgramUpdatedAt:" + loyaltyProgramUpdatedAt + " to appLoyaltyUpdatedAt: " + appLoyaltyUpdatedAt);
        if (appLoyaltyUpdatedAt.getTime() < loyaltyProgramUpdatedAt.getTime()) {
            return true;
        }
    }
    /// Now check all promotions to see if they're out of date, removed or new promos have been added
    console.log("promotions length: " + promotions.length);
    for (var loyaltyPromotion of promotions) {
        console.log("checking promo " + loyaltyPromotion.id);
        if (loyaltyPromotion.id && loyalty.promotions) {
            var wasPromoFound = false;
            for (var appPromotion of loyalty.promotions) {
                console.log("appPromotion.promotionId: " + appPromotion.promotionId);
                console.log("appPromotion.merchantName: " + appPromotion.merchantName);
                if (appPromotion.promotionId == loyaltyPromotion.id && appPromotion.lastUpdateDate) {
                    wasPromoFound = true;
                    // if (appPromotion.promotionId == loyaltyPromotion.id!) {
                    if (loyaltyPromotion.updatedAt) {
                        var loyaltyUpdatedAt = new Date(loyaltyPromotion.updatedAt);
                        if (loyaltyUpdatedAt) {
                            console.log("comparing lastUpdateDate:" + appPromotion.lastUpdateDate + " to loyaltyUpdatedAt: " + loyaltyUpdatedAt);
                            if (appPromotion.lastUpdateDate.getTime() < loyaltyUpdatedAt.getTime()) {
                                console.log("returning true1");
                                return true;
                            }
                        }
                        else {
                            console.log("returning true2");
                            return true;
                        }
                    }
                    else {
                        console.log("returning true3");
                        return true;
                    }
                }
            }
            if (!wasPromoFound) {
                console.log("returning true4");
                return true;
            }
        }
    }
    if (loyalty.promotions) {
        for (var appPromotion of loyalty.promotions) {
            if (appPromotion.loyaltyId) {
                console.log("checking to see if appPromotion exists in loyalty promotions");
                var wasPromoFound = false;
                for (var loyaltyPromotion of promotions) {
                    console.log("comparing loyaltyPromotion.promotionId: " + loyaltyPromotion.id + " to appPromotion.promotionId: " + appPromotion.promotionId);
                    if (loyaltyPromotion.id && loyaltyPromotion.id == appPromotion.promotionId) {
                        wasPromoFound = true;
                        console.log("setting wasPromoFound to true");
                    }
                }
                if (!wasPromoFound) {
                    console.log("returning true5");
                    return true;
                }
            }
        }
    }
    return false;
};
exports.isLoyaltyOrPromotionsOutOfDate = isLoyaltyOrPromotionsOutOfDate;
const updateAppLoyaltyFromMerchant = (loyalty, loyaltyProgram, promotions, categoryIdMap, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    console.log("inside updateAppLoyaltyFromMerchant");
    const queryRunner = yield appDataSource_1.AppDataSource.createQueryRunner();
    yield queryRunner.startTransaction();
    try {
        if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
            for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
                var existingAppAccural = undefined;
                var displayEarningPointsDescription = undefined;
                var displayAdditionalEarningPointsDescription = undefined;
                if (loyalty.loyaltyAccruals) {
                    if (loyaltyAccrualRule.accrualType == "ITEM_VARIATION") {
                        if ((_c = loyaltyAccrualRule.itemVariationData) === null || _c === void 0 ? void 0 : _c.itemVariationId) {
                            for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                                if (appLoyaltyAccrual.variantId && appLoyaltyAccrual.variantId == loyaltyAccrualRule.itemVariationData.itemVariationId) {
                                    existingAppAccural = appLoyaltyAccrual;
                                    displayEarningPointsDescription = (_d = appLoyaltyAccrual.displayEarningPointsDescription) !== null && _d !== void 0 ? _d : undefined;
                                    displayAdditionalEarningPointsDescription = (_e = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription) !== null && _e !== void 0 ? _e : undefined;
                                }
                            }
                        }
                    }
                    else if (loyaltyAccrualRule.accrualType == "CATEGORY") {
                        if ((_f = loyaltyAccrualRule.categoryData) === null || _f === void 0 ? void 0 : _f.categoryId) {
                            for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                                if (appLoyaltyAccrual.categoryId && appLoyaltyAccrual.categoryId == loyaltyAccrualRule.categoryData.categoryId) {
                                    existingAppAccural = appLoyaltyAccrual;
                                    displayEarningPointsDescription = (_g = appLoyaltyAccrual.displayEarningPointsDescription) !== null && _g !== void 0 ? _g : undefined;
                                    displayAdditionalEarningPointsDescription = (_h = appLoyaltyAccrual.displayEarningAdditionalEarningPointsDescription) !== null && _h !== void 0 ? _h : undefined;
                                }
                            }
                        }
                    }
                    else {
                        console.log("checking for matches");
                        var matches = loyalty.loyaltyAccruals.filter((accrual) => accrual.accrualType == loyaltyAccrualRule.accrualType);
                        if (matches && matches.length > 0) {
                            existingAppAccural = matches[0];
                            displayEarningPointsDescription = (_j = matches[0].displayEarningPointsDescription) !== null && _j !== void 0 ? _j : undefined;
                            displayAdditionalEarningPointsDescription = (_k = matches[0].displayEarningAdditionalEarningPointsDescription) !== null && _k !== void 0 ? _k : undefined;
                        }
                    }
                }
                var categoryName = undefined;
                if ((_l = loyaltyAccrualRule.categoryData) === null || _l === void 0 ? void 0 : _l.categoryId) {
                    categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData.categoryId);
                }
                const currentRuleDescriptions = rewardsRuleValue(loyaltyAccrualRule, categoryName, loyaltyProgram.terminology);
                console.log("currentRuleDescriptions: " + currentRuleDescriptions);
                console.log("existingAppAccural: " + existingAppAccural);
                // If core description or core additional description has changed, disregard existing app accrual
                if (existingAppAccural) {
                    console.log("existingAppAccural!.merchantEarningPointsDescription: " + existingAppAccural.merchantEarningPointsDescription);
                    console.log("currentRuleDescriptions[0]: " + currentRuleDescriptions[0]);
                    if (existingAppAccural.merchantEarningPointsDescription && existingAppAccural.merchantEarningPointsDescription != currentRuleDescriptions[0]) {
                        console.log("setting existingAppAccural to null1. existingAppAccural?.merchantEarningPointsDescription: " + (existingAppAccural === null || existingAppAccural === void 0 ? void 0 : existingAppAccural.merchantEarningPointsDescription) + ", currentRuleDescriptions[0]: " + currentRuleDescriptions[0]);
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
                if (existingAppAccural) {
                    updateAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology, loyalty.id, existingAppAccural, displayEarningPointsDescription, displayAdditionalEarningPointsDescription);
                }
                else {
                    createAccrual(loyaltyAccrualRule, categoryIdMap, loyaltyProgram.terminology, loyalty.id);
                }
            }
        }
        // Update Reward Tiers
        if (loyaltyProgram.rewardTiers) {
            for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
                var existingAppRewardTier = undefined;
                var displayRewardDescription = undefined;
                if (loyalty.loyaltyRewardTiers && loyaltyRewardTier.id) {
                    console.log("searching loyaltyRewardTiers for loyaltyRewardTier.id" + loyaltyRewardTier.id);
                    var tierMatches = loyalty.loyaltyRewardTiers.filter((rewardTier) => rewardTier.rewardTierId == loyaltyRewardTier.id);
                    if (tierMatches && tierMatches.length > 0) {
                        existingAppRewardTier = tierMatches[0];
                        displayRewardDescription = (_m = tierMatches[0].displayRewardDescription) !== null && _m !== void 0 ? _m : undefined;
                    }
                }
                console.log("existingAppRewardTier: " + existingAppRewardTier);
                console.log("comparing existingAppRewardTier?.merchantRewardDescription: " + (existingAppRewardTier === null || existingAppRewardTier === void 0 ? void 0 : existingAppRewardTier.merchantRewardDescription) + " to loyaltyRewardTier.name: " + loyaltyRewardTier.name);
                if (existingAppRewardTier) {
                    if (existingAppRewardTier.merchantRewardDescription && loyaltyRewardTier.name) {
                        if (existingAppRewardTier.merchantRewardDescription != loyaltyRewardTier.name) {
                            console.log("clearing existingAppRewardTier.displayRewardDescription");
                            displayRewardDescription = undefined;
                        }
                    }
                }
                if (existingAppRewardTier) {
                    updateRewardTier(loyaltyRewardTier, loyaltyProgram.terminology, loyalty.id, existingAppRewardTier, displayRewardDescription);
                }
                else {
                    createRewardTier(loyaltyRewardTier, loyaltyProgram.terminology, loyalty.id);
                }
            }
        }
        //Update Promotions from merchant
        for (var loyaltyPromotion of promotions) {
            var existingPromotion = undefined;
            var displayName = undefined;
            if (loyalty.promotions && loyaltyPromotion.id) {
                console.log("searching loyalty.promotions for loyaltyPromotion.promotionId" + loyaltyPromotion.id);
                var promoMatches = loyalty.promotions.filter((promo) => promo.promotionId == loyaltyPromotion.id);
                if (promoMatches && promoMatches.length > 0) {
                    existingPromotion = promoMatches[0];
                    displayName = (_o = existingPromotion.displayName) !== null && _o !== void 0 ? _o : undefined;
                }
            }
            console.log("existingPromotion: " + existingPromotion);
            if (existingPromotion) {
                // Remove overriden name if the merchant name has changed since we overrode it
                if (existingPromotion.merchantName && loyaltyPromotion.name != existingPromotion.merchantName) {
                    displayName = undefined;
                }
            }
            if (existingPromotion) {
                updatePromotion(loyaltyPromotion, loyaltyProgram.terminology, loyalty.id, existingPromotion, displayName);
            }
            else {
                createPromotion(loyaltyPromotion, loyaltyProgram.terminology, loyalty.id);
            }
        }
        //Now let's remove old accrual rows from the db that are no longer in the loyalty program
        if (loyalty.loyaltyAccruals) {
            for (var appLoyaltyAccrual of loyalty.loyaltyAccruals) {
                var wasAccrualFound = false;
                // Look up accrual in currenty loyalty program
                if (loyaltyProgram.accrualRules && loyaltyProgram.terminology) {
                    for (var loyaltyAccrualRule of loyaltyProgram.accrualRules) {
                        if (loyaltyAccrualRule.accrualType == "ITEM_VARIATION" && appLoyaltyAccrual.accrualType == "ITEM_VARIATION") {
                            if (((_p = loyaltyAccrualRule.itemVariationData) === null || _p === void 0 ? void 0 : _p.itemVariationId) == appLoyaltyAccrual.variantId) {
                                wasAccrualFound = true;
                            }
                        }
                        else if (loyaltyAccrualRule.accrualType == "CATEGORY" && appLoyaltyAccrual.accrualType == "CATEGORY") {
                            if (((_q = loyaltyAccrualRule.categoryData) === null || _q === void 0 ? void 0 : _q.categoryId) == appLoyaltyAccrual.categoryId) {
                                wasAccrualFound = true;
                                console.log("got a match on Category accrual");
                            }
                        }
                        else if (loyaltyAccrualRule.accrualType == "VISIT" && appLoyaltyAccrual.accrualType == "VISIT") {
                            wasAccrualFound = true;
                        }
                        else if (loyaltyAccrualRule.accrualType == "SPEND" && appLoyaltyAccrual.accrualType == "SPEND") {
                            wasAccrualFound = true;
                        }
                    }
                }
                if (!wasAccrualFound) {
                    console.log("need to delete accrualId: " + appLoyaltyAccrual.id);
                    deleteAccrual(appLoyaltyAccrual.id);
                }
            }
        }
        //Remove old reward tier rows
        if (loyalty.loyaltyRewardTiers) {
            for (var appRewardTier of loyalty.loyaltyRewardTiers) {
                var wasRewardTierFound = false;
                if (loyaltyProgram.rewardTiers) {
                    for (var loyaltyRewardTier of loyaltyProgram.rewardTiers) {
                        if (loyaltyRewardTier.id) {
                            if (appRewardTier.rewardTierId == loyaltyRewardTier.id) {
                                wasRewardTierFound = true;
                                console.log("found rewardTier");
                            }
                        }
                    }
                }
                if (!wasRewardTierFound) {
                    console.log("need to delete rewardTier: " + appRewardTier.id);
                    deleteRewardTier(appRewardTier.id);
                }
            }
        }
        //Remove old promotion rows
        if (loyalty.promotions) {
            for (var appPromotion of loyalty.promotions) {
                var wasPromotionFound = false;
                for (var loyaltyPromotion of promotions) {
                    if (loyaltyPromotion.id) {
                        if (appPromotion.promotionId == loyaltyPromotion.id) {
                            wasPromotionFound = true;
                            console.log("found promotion");
                        }
                    }
                }
                if (!wasPromotionFound) {
                    console.log("need to delete promotion: " + appPromotion.id);
                    deletePromotion(appPromotion.id);
                }
            }
        }
        yield queryRunner.commitTransaction();
        callback(loyalty);
    }
    catch (err) {
        console.log("error in updateAppLoyaltyFromMerchant: " + err);
        yield queryRunner.rollbackTransaction();
    }
    finally {
        yield queryRunner.release();
    }
});
exports.updateAppLoyaltyFromMerchant = updateAppLoyaltyFromMerchant;
const updateLoyaltyStatuses = (businessId, loyaltyId, showLoyaltyInApp, showPromotionsInApp, automaticallyUpdateChangesFromMerchant, loyaltyStatus, callback) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside updateLoyaltyStatus");
    console.log("showLoyaltyInApp: " + showLoyaltyInApp);
    const existingLoyalty = yield Loyalty_1.Loyalty
        .createQueryBuilder("loyalty")
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
        console.log("existingLoyalty not found");
    }
});
exports.updateLoyaltyStatuses = updateLoyaltyStatuses;
const updateLoyaltyItems = (businessId, loyaltyId, loyaltyAccruals, promotions, loyaltyRewardTiers, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _r, _s, _t;
    console.log("inside updateLoyaltyItems");
    const existingLoyalty = yield Loyalty_1.Loyalty.findOne({
        where: {
            id: loyaltyId
        }
    });
    if (!existingLoyalty) {
        console.log("loyaltyId: " + loyaltyId + " not found");
        callback(false);
    }
    const queryRunner = yield appDataSource_1.AppDataSource.createQueryRunner();
    yield queryRunner.startTransaction();
    try {
        if (loyaltyAccruals) {
            for (var loyaltyAccrual of loyaltyAccruals) {
                var matches = (_r = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.loyaltyAccruals) === null || _r === void 0 ? void 0 : _r.filter((accrual) => accrual.id == loyaltyAccrual.id);
                if (matches && matches.length > 0) {
                    if (matches[0].displayEarningPointsDescription != loyaltyAccrual.displayEarningPointsDescription ||
                        matches[0].displayEarningAdditionalEarningPointsDescription != loyaltyAccrual.displayEarningAdditionalEarningPointsDescription) {
                        console.log("loyaltyAccrual will be updated for id: " + loyaltyAccrual.id);
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
                var promotionMatches = (_s = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.promotions) === null || _s === void 0 ? void 0 : _s.filter((existingPromotion) => existingPromotion.id == promotion.id);
                if (promotionMatches && promotionMatches.length > 0) {
                    if (promotionMatches[0].displayName != promotion.displayName) {
                        console.log("promotion will be updated for id: " + promotion.id);
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
                var rewardTierMatches = (_t = existingLoyalty === null || existingLoyalty === void 0 ? void 0 : existingLoyalty.loyaltyRewardTiers) === null || _t === void 0 ? void 0 : _t.filter((existingRewardTier) => existingRewardTier.id == loyaltyRewardTier.id);
                if (rewardTierMatches && rewardTierMatches.length > 0) {
                    if (rewardTierMatches[0].displayReward != loyaltyRewardTier.displayReward ||
                        rewardTierMatches[0].displayRewardDescription != loyaltyRewardTier.displayRewardDescription) {
                        console.log("loyaltyRewardTier will be updated for id: " + loyaltyRewardTier.id);
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
        console.log("error in updateLoyaltyItems: " + err);
        yield queryRunner.rollbackTransaction();
    }
    finally {
        yield queryRunner.release();
    }
});
exports.updateLoyaltyItems = updateLoyaltyItems;
const deleteAccrual = (accrualId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(LoyaltyAccrual_1.LoyaltyAccrual, accrualId);
    console.log("just deleted accral with id:" + accrualId);
});
const deleteRewardTier = (rewardTierId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(LoyaltyRewardTier_1.LoyaltyRewardTier, rewardTierId);
    console.log("just deleted reward tier with id:" + rewardTierId);
});
const deletePromotion = (promotionId) => __awaiter(void 0, void 0, void 0, function* () {
    yield appDataSource_1.AppDataSource.manager.delete(Promotion_1.Promotion, promotionId);
    console.log("just deleted promotion with id:" + promotionId);
});
const createAccrual = (loyaltyAccrualRule, categoryIdMap, terminology, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
    var _u, _v, _w;
    var categoryName = undefined;
    if ((_u = loyaltyAccrualRule.categoryData) === null || _u === void 0 ? void 0 : _u.categoryId) {
        categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData.categoryId);
    }
    const ruleValues = rewardsRuleValue(loyaltyAccrualRule, categoryName, terminology);
    console.log("ruleValues: " + ruleValues);
    const accrual = appDataSource_1.AppDataSource.manager.create(LoyaltyAccrual_1.LoyaltyAccrual, {
        loyaltyId: loyaltyId,
        accrualType: loyaltyAccrualRule.accrualType,
        categoryId: (_v = loyaltyAccrualRule.categoryData) === null || _v === void 0 ? void 0 : _v.categoryId,
        variantId: (_w = loyaltyAccrualRule.itemVariationData) === null || _w === void 0 ? void 0 : _w.itemVariationId,
        merchantEarningPointsDescription: ruleValues[0],
        merchantAdditionalEarningPointsDescription: ruleValues[1],
    });
    // await loyaltyAccrualRepository.save(accrual);
    console.log("just created accral with id:" + accrual.id);
});
const updateAccrual = (loyaltyAccrualRule, categoryIdMap, terminology, loyaltyId, existingAppAccural, displayEarningPointsDescription, displayAdditionalEarningPointsDescription) => __awaiter(void 0, void 0, void 0, function* () {
    var _x, _y, _z;
    console.log("inside updateAccrual");
    var categoryName = undefined;
    if ((_x = loyaltyAccrualRule.categoryData) === null || _x === void 0 ? void 0 : _x.categoryId) {
        categoryName = categoryIdMap.get(loyaltyAccrualRule.categoryData.categoryId);
    }
    const ruleValues = rewardsRuleValue(loyaltyAccrualRule, categoryName, terminology);
    console.log("ruleValues: " + ruleValues);
    console.log("existingAppAccural.displayEarningAdditionalEarningPointsDescription = " + existingAppAccural.displayEarningAdditionalEarningPointsDescription);
    yield appDataSource_1.AppDataSource.manager.update(LoyaltyAccrual_1.LoyaltyAccrual, {
        id: existingAppAccural.id,
    }, {
        accrualType: loyaltyAccrualRule.accrualType,
        categoryId: (_z = (_y = loyaltyAccrualRule.categoryData) === null || _y === void 0 ? void 0 : _y.categoryId) !== null && _z !== void 0 ? _z : undefined,
        merchantEarningPointsDescription: ruleValues[0],
        merchantAdditionalEarningPointsDescription: ruleValues[1],
        displayEarningPointsDescription: displayEarningPointsDescription !== null && displayEarningPointsDescription !== void 0 ? displayEarningPointsDescription : null,
        displayEarningAdditionalEarningPointsDescription: displayAdditionalEarningPointsDescription !== null && displayAdditionalEarningPointsDescription !== void 0 ? displayAdditionalEarningPointsDescription : null,
        lastUpdateDate: new Date(),
    });
    console.log("just updated loyatyAccrual with id:" + existingAppAccural.id);
});
const createRewardTier = (loyaltyRewardTier, terminology, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
    const rewardTier = appDataSource_1.AppDataSource.manager.create(LoyaltyRewardTier_1.LoyaltyRewardTier, {
        loyaltyId: loyaltyId,
        rewardTierId: loyaltyRewardTier.id,
        merchantReward: getRewardValue(loyaltyRewardTier, terminology),
        merchantRewardDescription: loyaltyRewardTier.name
    });
    // rewardTiers.push(rewardTier);
    // await loyaltyRewardTierRepository.save(rewardTier);
    console.log("just created rewardTier with id:" + rewardTier.id);
});
const updateRewardTier = (loyaltyRewardTier, terminology, loyaltyId, existingAppRewardTier, displayRewardDescription) => __awaiter(void 0, void 0, void 0, function* () {
    var _0;
    appDataSource_1.AppDataSource.manager.update(LoyaltyRewardTier_1.LoyaltyRewardTier, {
        id: existingAppRewardTier.id,
    }, {
        merchantReward: getRewardValue(loyaltyRewardTier, terminology),
        merchantRewardDescription: loyaltyRewardTier.name,
        displayReward: (_0 = existingAppRewardTier.displayReward) !== null && _0 !== void 0 ? _0 : null,
        displayRewardDescription: displayRewardDescription !== null && displayRewardDescription !== void 0 ? displayRewardDescription : null,
        lastUpdateDate: new Date(),
    });
    console.log("just updaated rewardTier with id:" + existingAppRewardTier.id);
});
const createPromotion = (loyaltyPromotion, terminology, loyaltyId) => __awaiter(void 0, void 0, void 0, function* () {
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
    // await promotionRepository.save(promotion);
    console.log("just created promotion with id: " + promotion.id);
});
const updatePromotion = (loyaltyPromotion, terminology, loyaltyId, existingPromotion, displayName) => __awaiter(void 0, void 0, void 0, function* () {
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
    console.log("just updated promotion with id: " + existingPromotion.id);
});
const rewardsRuleValue = (accrualRule, categoryName, terminology) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    console.log("inside rewardsRuleValue with accrualType of " + accrualRule.accrualType);
    switch (accrualRule.accrualType) {
        case "VISIT":
            console.log("rewardsRuleValue type is VISIT");
            var visitRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) + " for every visit. ";
            if (((_a = accrualRule.visitData) === null || _a === void 0 ? void 0 : _a.minimumAmountMoney) && ((_c = (_b = accrualRule.visitData) === null || _b === void 0 ? void 0 : _b.minimumAmountMoney) === null || _c === void 0 ? void 0 : _c.amount)) {
                const currency = (_e = (_d = accrualRule.visitData) === null || _d === void 0 ? void 0 : _d.minimumAmountMoney.currency) !== null && _e !== void 0 ? _e : "USD";
                const amount = (_g = (_f = accrualRule.visitData) === null || _f === void 0 ? void 0 : _f.minimumAmountMoney) === null || _g === void 0 ? void 0 : _g.amount;
                if (amount && currency) {
                    const currencyType = getMoneyCurrencyType(currency);
                    if (currencyType) {
                        const adjustedAmount = Number(amount) / 100.00;
                        const showCents = (Number(amount) % 100.00) > 0;
                        const ruleMinimum = adjustedAmount.toLocaleString(currencyType, { style: "currency", currency: currency,
                            maximumFractionDigits: showCents ? 2 : 0 });
                        visitRuleDescription += ruleMinimum + " minimum purchase.";
                    }
                }
            }
            return [visitRuleDescription, ""];
        case "SPEND":
            console.log("rewardsRuleValue type is SPEND");
            var additionalDescription = "";
            const amount = (_j = (_h = accrualRule.spendData) === null || _h === void 0 ? void 0 : _h.amountMoney) === null || _j === void 0 ? void 0 : _j.amount;
            const currency = (_m = (_l = (_k = accrualRule.spendData) === null || _k === void 0 ? void 0 : _k.amountMoney) === null || _l === void 0 ? void 0 : _l.currency) !== null && _m !== void 0 ? _m : "USD";
            if (amount && currency) {
                console.log("got amount and currency");
                const currencyType = getMoneyCurrencyType(currency);
                if (currencyType) {
                    const adjustedAmount = Number(amount) / 100.00;
                    const showCents = (Number(amount) % 100.00) > 0;
                    const ruleAmount = adjustedAmount.toLocaleString(currencyType, { style: "currency", currency: currency,
                        maximumFractionDigits: showCents ? 2 : 0 });
                    var spendRuleDescription = rewardsPointsEarned(accrualRule.points, terminology);
                    spendRuleDescription += " for every " + ruleAmount +
                        " spent in a single transaction.";
                    const excludedItemVariationIds = (_o = accrualRule.spendData) === null || _o === void 0 ? void 0 : _o.excludedItemVariationIds;
                    const excludedCategoryIds = (_p = accrualRule.spendData) === null || _p === void 0 ? void 0 : _p.excludedCategoryIds;
                    if ((excludedItemVariationIds &&
                        excludedItemVariationIds.length > 0) ||
                        (excludedCategoryIds && excludedCategoryIds.length > 0)) {
                        additionalDescription =
                            "Certain items are excluded from earning Stars";
                    }
                    return [spendRuleDescription, additionalDescription];
                }
            }
            else {
                console.log("missing amount or currency");
            }
            return ["", ""];
        case "CATEGORY":
            console.log("rewardsRuleValue type is CATEGORY");
            const ruleDescription = rewardsPointsEarned(accrualRule.points, terminology);
            const name = categoryName !== null && categoryName !== void 0 ? categoryName : "";
            return [ruleDescription + " for any item in " + name + " purchased", undefined];
        case "ITEM_VARIATION":
            console.log("rewardsRuleValue type is ITEM");
            const itemRuleDescription = rewardsPointsEarned(accrualRule.points, terminology) + " for every purchase of select items.";
            return [itemRuleDescription, ""];
    }
    return [undefined, undefined];
};
const MoneyCurrencyType = {
    USD: "en-US",
};
const getMoneyCurrencyType = (type) => {
    if (type == "USD") {
        return MoneyCurrencyType.USD;
    }
    return null;
};
const rewardsPointsEarned = (loyaltyPoints, terminology) => {
    var ruleDescription = "Earn ";
    const points = loyaltyPoints !== null && loyaltyPoints !== void 0 ? loyaltyPoints : 0;
    return ruleDescription + String(points) + " " + (points > 1 ? terminology.other : terminology.one);
};
const getRewardValue = (rewardTier, terminology) => {
    return String(rewardTier.points) + " " + (rewardTier.points > 1 ? terminology.other : terminology.one);
};
module.exports = {
    createAppLoyaltyFromLoyaltyProgram: exports.createAppLoyaltyFromLoyaltyProgram,
    isLoyaltyOrPromotionsOutOfDate: exports.isLoyaltyOrPromotionsOutOfDate,
    updateAppLoyaltyFromMerchant: exports.updateAppLoyaltyFromMerchant,
    updateLoyaltyItems: exports.updateLoyaltyItems,
    updateLoyaltyStatuses: exports.updateLoyaltyStatuses,
    LoyaltyStatusType,
};
