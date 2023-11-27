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
exports.SpecialItem = void 0;
const typeorm_1 = require("typeorm");
const Special_1 = require("./Special");
let SpecialItem = class SpecialItem extends typeorm_1.BaseEntity {
};
exports.SpecialItem = SpecialItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SpecialItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], SpecialItem.prototype, "specialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", Number)
], SpecialItem.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], SpecialItem.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], SpecialItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SpecialItem.prototype, "itemDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], SpecialItem.prototype, "isManuallyEntered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SpecialItem.prototype, "itemPriceRange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SpecialItem.prototype, "priceCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: null }),
    __metadata("design:type", Object)
], SpecialItem.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Special_1.Special, (special) => special.items, {
        nullable: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'specialId' }),
    __metadata("design:type", Special_1.Special)
], SpecialItem.prototype, "special", void 0);
exports.SpecialItem = SpecialItem = __decorate([
    (0, typeorm_1.Entity)({
        orderBy: {
            sortOrder: 'ASC',
        },
    })
], SpecialItem);
