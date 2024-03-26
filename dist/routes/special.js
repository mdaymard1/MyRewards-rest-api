"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSpecial = exports.updateSpecial = exports.createNewSpecial = exports.getSpecials = void 0;
const BusinessService_1 = require("../src/services/BusinessService");
const SpecialService_1 = require("../src/services/SpecialService");
const getSpecials = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const specials = yield (0, SpecialService_1.getAllSpecials)(businessId);
    response.send(specials);
    return;
});
exports.getSpecials = getSpecials;
const createNewSpecial = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { special } = request.body;
    if (!special) {
        console.log("Special object not found");
        response.status(400);
        response.end();
        return;
    }
    if (!special.title) {
        console.log("Special missing title");
        response.status(400);
        response.end();
        return;
    }
    if (!special.items) {
        console.log("Special missing items");
        response.status(400);
        response.end();
        return;
    }
    const newSpecialId = yield (0, SpecialService_1.createSpecial)(businessId, special);
    if (newSpecialId) {
        var specialResponse = Object();
        specialResponse.id = newSpecialId;
        response.send(specialResponse);
    }
    else {
        console.log("create special did not return a new id");
        response.status(400);
        response.end();
    }
});
exports.createNewSpecial = createNewSpecial;
const updateSpecial = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { specialId } = request.params;
    const { special } = request.body;
    if (!special) {
        console.log("Special object not found");
        response.status(400);
        response.end();
        return;
    }
    if (!special.title) {
        console.log("Special missing title");
        response.status(400);
        response.end();
        return;
    }
    if (!special.items) {
        console.log("Special missing items");
        response.status(400);
        response.end();
        return;
    }
    const wasSuccessful = yield (0, SpecialService_1.updateExistingSpecial)(specialId, special);
    response.send(wasSuccessful ? 204 : 400);
});
exports.updateSpecial = updateSpecial;
const deleteSpecial = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const businessId = yield (0, BusinessService_1.getBusinessIdFromAuthToken)(request);
    if (!businessId) {
        response.status(401);
        response.end();
        return;
    }
    const { specialId } = request.params;
    const wasSuccessful = yield (0, SpecialService_1.deleteExistingSpecial)(specialId);
    response.sendStatus(wasSuccessful ? 200 : 400);
});
exports.deleteSpecial = deleteSpecial;
module.exports = {
    deleteSpecial: exports.deleteSpecial,
    getSpecials: exports.getSpecials,
    createNewSpecial: exports.createNewSpecial,
    updateSpecial: exports.updateSpecial,
};
