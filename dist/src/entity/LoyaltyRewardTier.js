"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyRewardTier = void 0;
const typeorm_1 = require("typeorm");
const Loyalty_1 = require("./Loyalty");
let LoyaltyRewardTier = class LoyaltyRewardTier extends typeorm_1.BaseEntity {
    ;
};
exports.LoyaltyRewardTier = LoyaltyRewardTier;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], LoyaltyRewardTier.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)()
], LoyaltyRewardTier.prototype, "loyaltyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false })
], LoyaltyRewardTier.prototype, "rewardTierId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyRewardTier.prototype, "merchantReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyRewardTier.prototype, "merchantRewardDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null })
], LoyaltyRewardTier.prototype, "displayReward", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null })
], LoyaltyRewardTier.prototype, "displayRewardDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], LoyaltyRewardTier.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], LoyaltyRewardTier.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Loyalty_1.Loyalty, loyalty => loyalty.loyaltyRewardTiers, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'loyaltyId' })
], LoyaltyRewardTier.prototype, "loyalty", void 0);
exports.LoyaltyRewardTier = LoyaltyRewardTier = __decorate([
    (0, typeorm_1.Entity)()
], LoyaltyRewardTier);
