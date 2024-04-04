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
exports.Customer = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
// import { AppUser } from "./AppUser";
const Location_1 = require("./Location");
const User_1 = require("./User");
const CustomerNotificationPreference_1 = require("./CustomerNotificationPreference");
let Customer = class Customer extends typeorm_1.BaseEntity {
};
exports.Customer = Customer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Customer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "merchantCustomerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "lifetimePoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Customer.prototype, "enrolledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "enrollmentSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Customer.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Customer.prototype, "appUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, (business) => business.customers, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "businessId" }),
    __metadata("design:type", Business_1.Business)
], Customer.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.customers, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "appUserId" }),
    __metadata("design:type", User_1.User)
], Customer.prototype, "appUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Location_1.Location, (location) => location.customers, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "locationId" }),
    __metadata("design:type", Location_1.Location)
], Customer.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => CustomerNotificationPreference_1.CustomerNotificationPreference),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", CustomerNotificationPreference_1.CustomerNotificationPreference)
], Customer.prototype, "notificationPreference", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Index)("customer_id_UNIQUE", ["merchantCustomerId", "businessId"], {
        unique: true,
    }),
    (0, typeorm_1.Entity)()
], Customer);
