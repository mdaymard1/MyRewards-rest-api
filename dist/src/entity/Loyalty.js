"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Loyalty.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Loyalty.prototype, "showLoyaltyInApp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Loyalty.prototype, "showPromotionsInApp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Loyalty.prototype, "showLoyaltyEnrollmentInApp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Loyalty.prototype, "enrollInSquareLoyaltyDirectly", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Loyalty.prototype, "automaticallyUpdateChangesFromMerchant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Loyalty.prototype, "terminologyOne", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Loyalty.prototype, "terminologyMany", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Loyalty.prototype, "loyaltyStatus", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true, default: {} }),
    __metadata("design:type", Array)
], Loyalty.prototype, "locations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Loyalty.prototype, "merchantLoyaltyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Loyalty.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => 'now()' }),
    __metadata("design:type", Date)
], Loyalty.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => 'now()' }),
    __metadata("design:type", Date)
], Loyalty.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LoyaltyAccrual_1.LoyaltyAccrual, (loyaltyAccrual) => loyaltyAccrual.loyalty, {
        eager: true,
    }),
    __metadata("design:type", Array)
], Loyalty.prototype, "loyaltyAccruals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Promotion_1.Promotion, (promotion) => promotion.loyalty, { eager: true }),
    __metadata("design:type", Array)
], Loyalty.prototype, "promotions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LoyaltyRewardTier_1.LoyaltyRewardTier, (loyaltyRewardTier) => loyaltyRewardTier.loyalty, { eager: true }),
    __metadata("design:type", Array)
], Loyalty.prototype, "loyaltyRewardTiers", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Business_1.Business, (business) => business.loyalty),
    __metadata("design:type", Business_1.Business)
], Loyalty.prototype, "business", void 0);
exports.Loyalty = Loyalty = __decorate([
    (0, typeorm_1.Entity)()
], Loyalty);
