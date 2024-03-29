import { Request, Response } from "express";
import { SquareWebhook } from "../src/services/entity/SquareWebhook";
import {
  updateLoyaltyAccountFromWebhook,
  updateLoyaltyFromWebhook,
  updatePromotionsFromWebhook,
} from "../src/services/LoyaltyService";
import { updateSpecialsFromWebhook } from "../src/services/SpecialService";
import { updateBusinessLocationFromWebhook } from "../src/services/BusinessService";
import { stat } from "fs";

const handleSquareWebhook = async (request: Request, response: Response) => {
  const { body } = request;

  const webhook: SquareWebhook = new SquareWebhook(body);

  console.log(
    "webhook type: " + webhook.type + " for merchant: " + webhook.merchantId
  );

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

  console.log("payload is valid.");

  if (webhook.loyaltyProgram) {
    const wasSuccessful = await updateLoyaltyFromWebhook(
      webhook.merchantId,
      webhook.loyaltyProgram
    );
    console.log("handleSquareWebhook completed successfully");
    response.status(200);
    response.end();
  } else if (webhook.loyaltyPromotion) {
    updatePromotionsFromWebhook(webhook.merchantId, webhook.loyaltyPromotion);
    response.status(200);
    response.end();
  } else if (webhook.loyaltyAccount) {
    const wasSuccessful = await updateLoyaltyAccountFromWebhook(
      webhook.merchantId,
      webhook.loyaltyAccount
    );
    response.status(wasSuccessful ? 200 : 400);
    response.end();
  } else if (webhook.catalogVersionUpdated) {
    const wasSuccessful = await updateSpecialsFromWebhook(
      webhook.merchantId,
      webhook.catalogVersionUpdated
    );
    console.log("returned from updateSpecialsFromWebhook");
    response.status(200);
    response.end();
  } else if (webhook.location) {
    const status = await updateBusinessLocationFromWebhook(
      webhook.merchantId,
      webhook.location.locationId,
      webhook.location.type
    );
    console.log(
      "returned from updateBusinessLocationFromWebhook with status of " + status
    );
    response.status(200);
    response.end();
  } else {
    // We're not interested in this event
    console.log("webhook event skipped");
    response.status(200);
    response.end();
  }
};

module.exports = {
  handleSquareWebhook,
};
