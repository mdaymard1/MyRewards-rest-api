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
exports.Business = void 0;
const typeorm_1 = require("typeorm");
const Loyalty_1 = require("./Loyalty");
const Special_1 = require("./Special");
const Customer_1 = require("./Customer");
const Location_1 = require("./Location");
const EnrollmentRequest_1 = require("./EnrollmentRequest");
let Business = class Business extends typeorm_1.BaseEntity {
};
exports.Business = Business;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Business.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Business.prototype, "createDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], Business.prototype, "lastUpdateDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Business.prototype, "merchantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "merchantAccessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "merchantRefreshToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Business.prototype, "accessTokenExpirationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Business.prototype, "loyaltyUsesCatalogItems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Business.prototype, "specialsUseCatalogItems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "businessName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "addressLine1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "addressLine2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "zipCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "hoursOfOperation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "businessDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "websiteUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "appStoreUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "googlePlayStoreUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "reviewsUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Business.prototype, "firstImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Business.prototype, "secondImageUrl", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Loyalty_1.Loyalty),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Loyalty_1.Loyalty)
], Business.prototype, "loyalty", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Special_1.Special, (special) => special.business, { eager: true }),
    __metadata("design:type", Array)
], Business.prototype, "specials", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Customer_1.Customer, (customer) => customer.business, { eager: true }),
    __metadata("design:type", Array)
], Business.prototype, "customers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Location_1.Location, (location) => location.business, { eager: true }),
    __metadata("design:type", Array)
], Business.prototype, "locations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EnrollmentRequest_1.EnrollmentRequest, (enrollmentRequest) => enrollmentRequest.business, { eager: true }),
    __metadata("design:type", Array)
], Business.prototype, "enrollmentRequests", void 0);
exports.Business = Business = __decorate([
    (0, typeorm_1.Entity)()
], Business);
