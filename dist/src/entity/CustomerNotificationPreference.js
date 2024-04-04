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
exports.CustomerNotificationPreference = void 0;
const typeorm_1 = require("typeorm");
const Customer_1 = require("./Customer");
const User_1 = require("./User");
let CustomerNotificationPreference = class CustomerNotificationPreference extends typeorm_1.BaseEntity {
};
exports.CustomerNotificationPreference = CustomerNotificationPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CustomerNotificationPreference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CustomerNotificationPreference.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    __metadata("design:type", String)
], CustomerNotificationPreference.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", nullable: true }),
    __metadata("design:type", Boolean)
], CustomerNotificationPreference.prototype, "notifyOfRewardChanges", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", nullable: true }),
    __metadata("design:type", Boolean)
], CustomerNotificationPreference.prototype, "notifyOfPromotionChanges", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", nullable: true }),
    __metadata("design:type", Boolean)
], CustomerNotificationPreference.prototype, "notifyOfSpecialsChanges", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    __metadata("design:type", String)
], CustomerNotificationPreference.prototype, "appUserId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Customer_1.Customer, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Customer_1.Customer)
], CustomerNotificationPreference.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.customerNotificationPrefs, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "appUserId" }),
    __metadata("design:type", User_1.User)
], CustomerNotificationPreference.prototype, "appUser", void 0);
exports.CustomerNotificationPreference = CustomerNotificationPreference = __decorate([
    (0, typeorm_1.Entity)()
], CustomerNotificationPreference);
