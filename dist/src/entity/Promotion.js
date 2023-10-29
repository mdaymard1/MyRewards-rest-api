"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promotion = void 0;
const typeorm_1 = require("typeorm");
const Loyalty_1 = require("./Loyalty");
let Promotion = class Promotion extends typeorm_1.BaseEntity {
};
exports.Promotion = Promotion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], Promotion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)()
], Promotion.prototype, "loyaltyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Promotion.prototype, "promotionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Promotion.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Promotion.prototype, "merchantName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null })
], Promotion.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
], Promotion.prototype, "promotionStartsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true })
], Promotion.prototype, "locationIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], Promotion.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], Promotion.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Loyalty_1.Loyalty, loyalty => loyalty.promotions, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'loyaltyId' })
], Promotion.prototype, "loyalty", void 0);
exports.Promotion = Promotion = __decorate([
    (0, typeorm_1.Entity)()
], Promotion);
