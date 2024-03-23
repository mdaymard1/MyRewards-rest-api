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
exports.EnrollmentRequest = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const typeorm_encrypted_1 = require("typeorm-encrypted");
const encryption_config_1 = require("../../encryption-config");
// @Index('customer_id_UNIQUE', ['merchantCustomerId', 'businessId'], {
//   unique: true,
// })
let EnrollmentRequest = class EnrollmentRequest extends typeorm_1.BaseEntity {
};
exports.EnrollmentRequest = EnrollmentRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EnrollmentRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: false }),
    __metadata("design:type", String)
], EnrollmentRequest.prototype, "ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: false }),
    __metadata("design:type", Date)
], EnrollmentRequest.prototype, "enrollRequestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "json",
        nullable: false,
        transformer: new typeorm_encrypted_1.JSONEncryptionTransformer(encryption_config_1.EncryptionTransformerConfig),
    }),
    __metadata("design:type", Object)
], EnrollmentRequest.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], EnrollmentRequest.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], EnrollmentRequest.prototype, "appUserid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], EnrollmentRequest.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, (business) => business.enrollmentRequests, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "businessId" }),
    __metadata("design:type", Business_1.Business)
], EnrollmentRequest.prototype, "business", void 0);
exports.EnrollmentRequest = EnrollmentRequest = __decorate([
    (0, typeorm_1.Entity)()
], EnrollmentRequest);
