import { PlayerNotificationTargetIncludeAliases } from "@onesignal/node-onesignal";

const OneSignal = require("@onesignal/node-onesignal");

const ONESIGNAL_APP_ID = "589e36cc-8c8c-4834-8c9e-66056ca20ab5";

const app_key_provider = {
  getToken() {
    return "YWU3Mjc0NTMtZGQ3NC00YzZhLWJlYjAtYjk0M2IxZmRkYzE0";
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

export const sendNotifications = async (
  contents: string,
  ids: string[],
  image?: string
) => {
  console.log("inside sendNotifications with image: " + image);

  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;

  notification.include_external_user_ids = ids;

  if (image) {
    notification.ios_attachments = { id: image };
  }

  notification.contents = {
    en: contents,
  };

  const response = await client.createNotification(notification);
  console.log(
    "response id: " + response.id + "external_id: " + response.external_id
  );
  if (response.errors && response.errors.invalid_external_user_ids.length > 0) {
    console.log("Error sending notifications due to invalid external ids");
    return null;
  } else {
    console.log("notification sent to " + response.recipients + " sent.");
    return "sent";
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
};
