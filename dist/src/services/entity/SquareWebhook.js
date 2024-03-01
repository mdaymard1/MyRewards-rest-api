"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquareRewardTier = exports.SquareAccrualRules = exports.SquareLoyaltyProgram = exports.SquareLoyaltyPromotion = exports.SquareLoyaltyAccount = exports.SquareCatalogVersionUpdated = exports.SquareWebhook = void 0;
class SquareWebhook {
    constructor(payload) {
        console.log('inside SquareWebhook constructor with type: ' + payload.data.type);
        this.type = payload.type;
        this.merchantId = payload.merchant_id;
        if ((this.type == 'loyalty.program.updated' ||
            this.type == 'loyalty.program.created') &&
            this.merchantId &&
            payload.data.type == 'loyalty.program' &&
            payload.data.object.loyalty_program) {
            this.loyaltyProgram = new SquareLoyaltyProgram(payload.data.object.loyalty_program);
        }
        if ((this.type == 'loyalty.promotion.created' ||
            this.type == 'loyalty.promotion.updated') &&
            this.merchantId &&
            payload.data.type == 'loyalty.promotion' &&
            payload.data.object.loyalty_promotion) {
            this.loyaltyPromotion = new SquareLoyaltyPromotion(payload.data.object.loyalty_promotion);
        }
        if ((this.type == 'loyalty.account.created' ||
            this.type == 'loyalty.account.updated' ||
            'loyalty.account.deleted') &&
            this.merchantId &&
            payload.data.type == 'loyalty_account' &&
            payload.data.object.loyalty_account) {
            this.loyaltyAccount = new SquareLoyaltyAccount(payload.data.object.loyalty_account, this.type);
        }
        if (this.type == 'catalog.version.updated' &&
            this.merchantId &&
            payload.data.type == 'catalog' &&
            payload.data.object.catalog_version) {
            this.catalogVersionUpdated = new SquareCatalogVersionUpdated(payload.data.object.catalog_version);
        }
        console.log('SquareWebhook initialized');
    }
}
exports.SquareWebhook = SquareWebhook;
class SquareCatalogVersionUpdated {
    constructor(payload) {
        console.log('inside SquareCatalogVersionUpdated constructor');
        if (payload.updated_at) {
            this.catalogVersion = {
                updatedAt: payload.updated_at,
            };
        }
    }
}
exports.SquareCatalogVersionUpdated = SquareCatalogVersionUpdated;
class SquareLoyaltyAccount {
    constructor(payload, type) {
        console.log('inside SquareLoyaltyAccount constructor');
        this.id = payload.id;
        this.loyaltyProgramId = payload.program_id;
        this.balance = payload.balance;
        this.lifetimePoints = payload.lifetime_points;
        if (payload.mapping) {
            this.mapping = {
                createdAt: payload.mapping.created_at,
                phoneNumber: payload.mapping.phone_number,
            };
        }
        this.customerId = payload.customer_id;
        this.enrolledAt = payload.enrolled_at;
        this.wasDeleted = type == 'loyalty.account.deleted';
    }
}
exports.SquareLoyaltyAccount = SquareLoyaltyAccount;
class SquareLoyaltyPromotion {
    constructor(payload) {
        console.log('inside SquareLoyaltyPromotion constructor');
        this.id = payload.id;
        this.name = payload.name;
        this.status = payload.status;
        this.loyaltyProgramId = payload.loyalty_program_id;
        if (payload.available_time) {
            this.availableTime = {
                startDate: payload.available_time.start_date,
                endDate: payload.available_time.end_date,
            };
        }
    }
}
exports.SquareLoyaltyPromotion = SquareLoyaltyPromotion;
class SquareLoyaltyProgram {
    constructor(payload) {
        var _a, _b;
        console.log('inside SquareLoyaltyProgram constructor');
        this.id = payload.id;
        this.status = payload.status;
        if (payload.accrual_rules) {
            this.accrualRules = [];
            console.log('creating accrual rules');
            for (var accrual of payload.accrual_rules) {
                (_a = this.accrualRules) === null || _a === void 0 ? void 0 : _a.push(new SquareAccrualRules(accrual));
            }
        }
        if (payload.reward_tiers) {
            console.log('creating reward tiers');
            this.rewardTiers = [];
            for (var rewardTier of payload.reward_tiers) {
                (_b = this.rewardTiers) === null || _b === void 0 ? void 0 : _b.push(new SquareRewardTier(rewardTier));
            }
        }
        this.locationIds = [];
        if (payload.location_ids) {
            for (var locationId of payload.location_ids) {
                this.locationIds.push(locationId);
            }
        }
        if (payload.terminology) {
            this.terminology = {
                one: payload.terminology.one,
                other: payload.terminology.other,
            };
        }
    }
}
exports.SquareLoyaltyProgram = SquareLoyaltyProgram;
class SquareAccrualRules {
    constructor(payload) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        console.log('inside SquareAccrualRules constructor');
        this.accrualType = payload.accrual_type;
        this.points = payload.points;
        if (payload.spend_data && ((_a = payload.spend_data) === null || _a === void 0 ? void 0 : _a.amount_money)) {
            this.spendData = {
                amountMoney: {
                    amount: (_c = (_b = payload.spend_data) === null || _b === void 0 ? void 0 : _b.amount_money) === null || _c === void 0 ? void 0 : _c.amount,
                    currency: (_e = (_d = payload.spend_data) === null || _d === void 0 ? void 0 : _d.amount_money) === null || _e === void 0 ? void 0 : _e.currency,
                },
                excludedItemVariationIds: payload.spend_data.excluded_item_variation_ids,
                excludedCategoryIds: payload.spend_data.excluded_category_ids,
            };
        }
        else if (payload.visit_data && ((_f = payload.visit_data) === null || _f === void 0 ? void 0 : _f.amount_money)) {
            this.visitData = {
                minimumAmountMoney: {
                    amount: (_h = (_g = payload.visit_data) === null || _g === void 0 ? void 0 : _g.amount_money) === null || _h === void 0 ? void 0 : _h.amount,
                    currency: (_k = (_j = payload.visit_data) === null || _j === void 0 ? void 0 : _j.amount_money) === null || _k === void 0 ? void 0 : _k.currency,
                },
            };
        }
        else if (payload.item_variation_data) {
            this.itemVariationData = {
                itemVariationId: payload.item_variation_data.item_variation_id,
            };
        }
        else if (payload.category_data) {
            this.categoryData = {
                categoryId: payload.category_data.category_id,
            };
        }
    }
}
exports.SquareAccrualRules = SquareAccrualRules;
class SquareRewardTier {
    constructor(payload) {
        console.log('inside SquareRewardTier constructor');
        this.id = payload.id;
        this.name = payload.name;
        this.points = payload.points;
        if (payload.definition) {
            this.discountType = payload.definition.discount_type;
            this.percentageDiscount = payload.definition.percentage_discount;
            this.scope = payload.definition.scope;
        }
    }
}
exports.SquareRewardTier = SquareRewardTier;
