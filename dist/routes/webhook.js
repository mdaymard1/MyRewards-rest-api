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
const SpecialService_1 = require("../src/services/SpecialService");
const BusinessService_1 = require("../src/services/BusinessService");
const square_1 = require("square");
const SIGNATURE_KEY = process.env.SIGNATURE_KEY;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL;
const isFromSquare = (signature, body) => {
    if (!SIGNATURE_KEY || !NOTIFICATION_URL) {
        console.log("input is invalid");
        return false;
    }
    return square_1.WebhooksHelper.isValidWebhookEventSignature(body, signature, SIGNATURE_KEY, NOTIFICATION_URL);
};
const handleSquareWebhook = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = request;
    const webhook = new SquareWebhook_1.SquareWebhook(body);
    console.log("webhook type: " + webhook.type + " for merchant: " + webhook.merchantId);
    const requestBody = JSON.stringify(request.body);
    console.log("requestBody: " + requestBody);
    if (!webhook) {
        console.log("webhook payload was empty");
        response.status(200);
        response.end();
        return;
    }
    if (!webhook.merchantId) {
        console.log("webhook merchantId missing");
        response.status(200);
        response.end();
        return;
    }
    // Validate that this post came from Square
    const signature = request.headers["x-square-hmacsha256-signature"];
    if (!isFromSquare(signature, requestBody)) {
        console.log("signature is invalid");
        response.sendStatus(401);
        response.end();
        return;
    }
    response.end();
    console.log("payload is valid.");
    if (webhook.loyaltyProgram) {
        const wasSuccessful = yield (0, LoyaltyService_1.updateLoyaltyFromWebhook)(webhook.merchantId, webhook.loyaltyProgram);
        console.log("handleSquareWebhook completed successfully");
        response.status(200);
        response.end();
    }
    else if (webhook.loyaltyPromotion) {
        (0, LoyaltyService_1.updatePromotionsFromWebhook)(webhook.merchantId, webhook.loyaltyPromotion);
        response.status(200);
        response.end();
    }
    else if (webhook.loyaltyAccount) {
        const wasSuccessful = yield (0, LoyaltyService_1.updateLoyaltyAccountFromWebhook)(webhook.merchantId, webhook.loyaltyAccount);
        response.status(wasSuccessful ? 200 : 400);
        response.end();
    }
    else if (webhook.catalogVersionUpdated) {
        const wasSuccessful = yield (0, SpecialService_1.updateSpecialsFromWebhook)(webhook.merchantId, webhook.catalogVersionUpdated);
        console.log("returned from updateSpecialsFromWebhook");
        response.status(200);
        response.end();
    }
    else if (webhook.location) {
        const status = yield (0, BusinessService_1.updateBusinessLocationFromWebhook)(webhook.merchantId, webhook.location.locationId, webhook.location.type);
        console.log("returned from updateBusinessLocationFromWebhook with status of " + status);
        response.status(200);
        response.end();
    }
    else {
        // We're not interested in this event
        console.log("webhook event skipped");
        response.status(200);
        response.end();
    }
});
module.exports = {
    handleSquareWebhook,
};
