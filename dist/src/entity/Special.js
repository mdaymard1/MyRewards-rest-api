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
exports.Special = void 0;
const typeorm_1 = require("typeorm");
const SpecialItem_1 = require("./SpecialItem");
const Business_1 = require("./Business");
let Special = class Special extends typeorm_1.BaseEntity {
};
exports.Special = Special;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Special.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)()
    // @Generated('increment')
    ,
    (0, typeorm_1.Generated)('increment'),
    __metadata("design:type", Number)
], Special.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Special.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Special.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Special.prototype, "showItemDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Special.prototype, "showItemPhotos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], Special.prototype, "showItemPrices", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Special.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Special.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Special.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SpecialItem_1.SpecialItem, (item) => item.special, { eager: true }),
    __metadata("design:type", Array)
], Special.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, (business) => business.specials, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Special.prototype, "business", void 0);
exports.Special = Special = __decorate([
    (0, typeorm_1.Entity)({
        orderBy: {
            sortOrder: 'ASC',
        },
    })
], Special);
