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
const SquareWebhook_1 = require("../src/services/entity/SquareWebhook");
const LoyaltyService_1 = require("../src/services/LoyaltyService");
const handleSquareWebhook = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = request;
    const webhook = new SquareWebhook_1.SquareWebhook(body);
    console.log("webhook type: " + webhook.type);
    if (!webhook) {
        response.status(200);
        response.end();
    }
    if (webhook.loyaltyProgram) {
        (0, LoyaltyService_1.updateLoyaltyFromWebhook)(webhook.merchantId, webhook.loyaltyProgram, function (wasSuccessful) {
            response.status(200);
            response.end();
            return;
        });
    }
    else {
        response.status(500);
        response.end();
    }
});
module.exports = {
    handleSquareWebhook,
};
