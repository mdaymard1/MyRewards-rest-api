"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loyalty = void 0;
const typeorm_1 = require("typeorm");
const LoyaltyAccrual_1 = require("./LoyaltyAccrual");
const LoyaltyRewardTier_1 = require("./LoyaltyRewardTier");
const Promotion_1 = require("./Promotion");
const Business_1 = require("./Business");
let Loyalty = class Loyalty extends typeorm_1.BaseEntity {
};
exports.Loyalty = Loyalty;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], Loyalty.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false })
], Loyalty.prototype, "showLoyaltyInApp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false })
], Loyalty.prototype, "showPromotionsInApp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true })
], Loyalty.prototype, "automaticallyUpdateChangesFromMerchant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Loyalty.prototype, "terminologyOne", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Loyalty.prototype, "terminologyMany", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Loyalty.prototype, "loyaltyStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)()
], Loyalty.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], Loyalty.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], Loyalty.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LoyaltyAccrual_1.LoyaltyAccrual, loyaltyAccrual => loyaltyAccrual.loyalty, { eager: true })
], Loyalty.prototype, "loyaltyAccruals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Promotion_1.Promotion, promotion => promotion.loyalty, { eager: true })
], Loyalty.prototype, "promotions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LoyaltyRewardTier_1.LoyaltyRewardTier, loyaltyRewardTier => loyaltyRewardTier.loyalty, { eager: true })
], Loyalty.prototype, "loyaltyRewardTiers", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Business_1.Business, (business) => business.loyalty)
], Loyalty.prototype, "business", void 0);
exports.Loyalty = Loyalty = __decorate([
    (0, typeorm_1.Entity)()
], Loyalty);
