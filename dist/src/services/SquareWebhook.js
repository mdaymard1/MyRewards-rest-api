"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquareWebhook = void 0;
class SquareWebhook {
    constructor(payload) {
        this.type = payload.type;
        this.merchantId = payload.merchant_id;
        if (this.type == "loyalty.program.updated" && this.merchantId &&
            payload.data.type == "loyalty_program" && payload.data.object.loyalty_program) {
            this.loyaltyProgram = new SquareLoyaltyProgram(payload.data.object.loyalty_program);
        }
        console.log("SquareWebhook initialized");
    }
}
exports.SquareWebhook = SquareWebhook;
class SquareLoyaltyProgram {
    constructor(payload) {
        var _a, _b;
        this.id = payload.id;
        this.status = payload.status;
        if (payload.accrual_rules) {
            this.accrualRules = [];
            console.log("creating accrual rules");
            for (var accrual of payload.accrual_rules) {
                (_a = this.accrualRules) === null || _a === void 0 ? void 0 : _a.push(new SquareAccrualRules(accrual));
            }
        }
        if (payload.reward_tiers) {
            console.log("creating reward tiers");
            this.rewardTiers = [];
            for (var rewardTier of payload.reward_tiers) {
                (_b = this.rewardTiers) === null || _b === void 0 ? void 0 : _b.push(new SquareRewardTier(rewardTier));
            }
        }
    }
}
class SquareAccrualRules {
    constructor(payload) {
        var _a, _b, _c, _d, _e;
        this.accrualType = payload.accrual_type;
        this.points = payload.points;
        if (payload.spend_data && ((_a = payload.spend_data) === null || _a === void 0 ? void 0 : _a.amount_money)) {
            this.spendData = {
                amount: (_c = (_b = payload.spend_data) === null || _b === void 0 ? void 0 : _b.amount_money) === null || _c === void 0 ? void 0 : _c.amount,
                currency: (_e = (_d = payload.spend_data) === null || _d === void 0 ? void 0 : _d.amount_money) === null || _e === void 0 ? void 0 : _e.currency,
            };
        }
    }
}
class SquareRewardTier {
    constructor(payload) {
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
