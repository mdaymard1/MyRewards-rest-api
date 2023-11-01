import { Request, Response } from 'express';
import { SquareWebhook } from '../src/services/entity/SquareWebhook';
import {
  updateLoyaltyFromWebhook,
  updatePromotionsFromWebhook,
} from '../src/services/LoyaltyService';

const handleSquareWebhook = async (request: Request, response: Response) => {
  const { body } = request;

  const webhook: SquareWebhook = new SquareWebhook(body);

  console.log('webhook type: ' + webhook.type);

  if (!webhook) {
    response.status(200);
    response.end();
    return;
  }

  if (!webhook.merchantId) {
    response.status(200);
    response.end();
    return;
  }

  if (webhook.loyaltyProgram) {
    updateLoyaltyFromWebhook(
      webhook.merchantId,
      webhook.loyaltyProgram,
      function (wasSuccessful: boolean) {
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
    response.status(200);
    response.end();
  }
};

module.exports = {
  handleSquareWebhook,
};
