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
exports.Favorite = void 0;
const typeorm_1 = require("typeorm");
const Location_1 = require("./Location");
const User_1 = require("./User");
let Favorite = class Favorite extends typeorm_1.BaseEntity {
};
exports.Favorite = Favorite;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Favorite.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Favorite.prototype, "appUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: false }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Favorite.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Location_1.Location, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Location_1.Location)
], Favorite.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.favorites, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "appUserId" }),
    __metadata("design:type", User_1.User)
], Favorite.prototype, "appUser", void 0);
exports.Favorite = Favorite = __decorate([
    (0, typeorm_1.Index)("appUser_locationId_id_UNIQUE", ["appUser", "locationId"], {
        unique: true,
    }),
    (0, typeorm_1.Entity)()
], Favorite);
