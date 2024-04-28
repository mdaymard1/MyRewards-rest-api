import { PlayerNotificationTargetIncludeAliases } from "@onesignal/node-onesignal";

const OneSignal = require("@onesignal/node-onesignal");

const ONESIGNAL_APP_ID = "589e36cc-8c8c-4834-8c9e-66056ca20ab5";

const app_key_provider = {
  getToken() {
    return "YWU3Mjc0NTMtZGQ3NC00YzZhLWJlYjAtYjk0M2IxZmRkYzE0";
  },
};

const merchant_app_key_provider = {
  getToken() {
    return "MWEzZTY2YTEtNWMxYS00OGI3LTliNTUtZmRiZWM2MTUwMWZi";
  },
};

const configuration = OneSignal.createConfiguration({
  authMethods: {
    app_key: {
      tokenProvider: app_key_provider,
    },
  },
});
const client = new OneSignal.DefaultApi(configuration);

const ONESIGNAL_MERCHANT_APP_ID = "0d2f0ff7-6771-4a02-9699-2c6ab15bac8c";

const merchant_configuration = OneSignal.createConfiguration({
  authMethods: {
    app_key: {
      tokenProvider: merchant_app_key_provider,
    },
  },
});

const merchant_client = new OneSignal.DefaultApi(merchant_configuration);

export const sendNotifications = async (
  contents: string,
  ids: string[],
  image?: string,
  deepLink?: string
) => {
  console.log("inside sendNotifications");

  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;

  notification.include_external_user_ids = ids;

  if (image) {
    notification.ios_attachments = { id: image };
  }

  notification.contents = {
    en: contents,
  };

  if (deepLink) {
    notification.custom_data = { deepLink: deepLink };
    notification.data = { deepLink: deepLink };
  }

  try {
    const response = await client.createNotification(notification);
    console.log(
      "response id: " + response.id + "external_id: " + response.external_id
    );
    if (
      response.errors &&
      response.errors.invalid_external_user_ids.length > 0
    ) {
      console.log("Error sending notifications due to invalid external ids");
      return null;
    } else {
      console.log("notification sent to " + response.recipients + " sent.");
      return "sent";
    }
  } catch (error) {
    console.log("Error thrown while sending notification: " + error);
  }
};

export const sendMerchantNotifications = async (
  contents: string,
  ids: string[],
  image?: string,
  deepLink?: string
) => {
  console.log("inside sendMerchantNotifications");

  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_MERCHANT_APP_ID;

  notification.include_external_user_ids = ids;

  if (image) {
    notification.ios_attachments = { id: image };
  }

  notification.contents = {
    en: contents,
  };

  if (deepLink) {
    notification.custom_data = { deepLink: deepLink };
    notification.data = { deepLink: deepLink };
  }

  try {
    const response = await merchant_client.createNotification(notification);
    console.log(
      "response id: " + response.id + "external_id: " + response.external_id
    );
    if (
      response.errors &&
      response.errors.invalid_external_user_ids.length > 0
    ) {
      console.log("Error sending notifications due to invalid external ids");
      return null;
    } else {
      console.log("notification sent to " + response.recipients + " sent.");
      return "sent";
    }
  } catch (error) {
    console.log("Error thrown while sending notification: " + error);
  }
};

export enum NotificationChangeType {
  Rewards = 0,
  Promotions = 1,
  Specials = 2,
}

module.exports = {
  NotificationChangeType,
  sendNotifications,
  sendMerchantNotifications,
};
