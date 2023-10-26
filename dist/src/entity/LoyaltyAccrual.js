"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyAccrual = void 0;
const typeorm_1 = require("typeorm");
const Loyalty_1 = require("./Loyalty");
let LoyaltyAccrual = class LoyaltyAccrual {
};
exports.LoyaltyAccrual = LoyaltyAccrual;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], LoyaltyAccrual.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)()
], LoyaltyAccrual.prototype, "loyaltyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false })
], LoyaltyAccrual.prototype, "accrualType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyAccrual.prototype, "variantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyAccrual.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyAccrual.prototype, "merchantEarningPointsDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], LoyaltyAccrual.prototype, "merchantAdditionalEarningPointsDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null })
], LoyaltyAccrual.prototype, "displayEarningPointsDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null })
], LoyaltyAccrual.prototype, "displayEarningAdditionalEarningPointsDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], LoyaltyAccrual.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => "now()" })
], LoyaltyAccrual.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Loyalty_1.Loyalty, loyalty => loyalty.loyaltyAccruals, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'loyaltyId' })
], LoyaltyAccrual.prototype, "loyalty", void 0);
exports.LoyaltyAccrual = LoyaltyAccrual = __decorate([
    (0, typeorm_1.Entity)()
], LoyaltyAccrual);
