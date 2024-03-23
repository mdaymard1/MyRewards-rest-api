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
exports.AppUser = void 0;
const typeorm_1 = require("typeorm");
const Customer_1 = require("./Customer");
const typeorm_encrypted_1 = require("typeorm-encrypted");
const encryption_config_1 = require("../../encryption-config");
let AppUser = class AppUser extends typeorm_1.BaseEntity {
};
exports.AppUser = AppUser;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AppUser.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: false }),
    __metadata("design:type", String)
], AppUser.prototype, "ref", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "json",
        nullable: true,
        transformer: new typeorm_encrypted_1.JSONEncryptionTransformer(encryption_config_1.EncryptionTransformerConfig),
    }),
    __metadata("design:type", Object)
], AppUser.prototype, "userDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], AppUser.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: false }),
    __metadata("design:type", Date)
], AppUser.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Customer_1.Customer, (customer) => customer.appUser, { eager: true }),
    __metadata("design:type", Customer_1.Customer)
], AppUser.prototype, "customer", void 0);
exports.AppUser = AppUser = __decorate([
    (0, typeorm_1.Index)("appuser_ref_UNIQUE", ["ref"], {
        unique: true,
    }),
    (0, typeorm_1.Entity)()
], AppUser);
