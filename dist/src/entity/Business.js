"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = void 0;
const typeorm_1 = require("typeorm");
const Loyalty_1 = require("./Loyalty");
let Business = class Business {
};
exports.Business = Business;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], Business.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
], Business.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
], Business.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Business.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false })
], Business.prototype, "merchantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Business.prototype, "merchantAccessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true })
], Business.prototype, "merchantRefreshToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })
], Business.prototype, "accessTokenExpirationDate", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Loyalty_1.Loyalty),
    (0, typeorm_1.JoinColumn)()
], Business.prototype, "loyalty", void 0);
exports.Business = Business = __decorate([
    (0, typeorm_1.Entity)()
], Business);
