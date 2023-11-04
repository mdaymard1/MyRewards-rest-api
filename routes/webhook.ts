import { Request, Response } from 'express';
import { SquareWebhook } from '../src/services/entity/SquareWebhook';
import {
  updateLoyaltyFromWebhook,
  updatePromotionsFromWebhook,
} from '../src/services/LoyaltyService';

const handleSquareWebhook = async (request: Request, response: Response) => {
  const { body } = request;

  const webhook: SquareWebhook = new SquareWebhook(body);

  console.log(
    'webhook type: ' + webhook.type + ' for merchant: ' + webhook.merchantId,
  );

  if (!webhook) {
    console.log('webhook payload was empty');
    response.status(200);
    response.end();
    return;
  }

  if (!webhook.merchantId) {
    console.log('webhook merchantId missing');
    response.status(200);
    response.end();
    return;
  }

  const callbackBody = JSON.stringify(request.body);
  console.log('callbackBody: ' + callbackBody);

  console.log('payload is valid.');

  if (webhook.loyaltyProgram) {
    updateLoyaltyFromWebhook(
      webhook.merchantId,
      webhook.loyaltyProgram,
      function (wasSuccessful: boolean) {
        console.log('handleSquareWebhook completed successfully');
        response.status(200);
        response.end();
      },
    );
  } else if (webhook.loyaltyPromotion) {
    updatePromotionsFromWebhook(
      webhook.merchantId,
      webhook.loyaltyPromotion,
      function (wasSuccessful: boolean) {
        response.status(200);
        response.end();
      },
    );
  } else {
    // We're not interested in this event
    console.log('webhook event skipped');
    response.status(200);
    response.end();
  }
};

module.exports = {
  handleSquareWebhook,
};
