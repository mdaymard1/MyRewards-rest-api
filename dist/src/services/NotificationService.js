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
exports.NotificationChangeType = exports.sendNotifications = void 0;
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
const sendNotifications = (contents, ids, image, deepLink) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("inside sendNotifications with ids: " + ids);
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
        const response = yield client.createNotification(notification);
        console.log("response id: " + response.id + "external_id: " + response.external_id);
        if (response.errors &&
            response.errors.invalid_external_user_ids.length > 0) {
            console.log("Error sending notifications due to invalid external ids");
            return null;
        }
        else {
            console.log("notification sent to " + response.recipients + " sent.");
            return "sent";
        }
    }
    catch (error) {
        console.log("Error thrown while sending notification: " + error);
    }
});
exports.sendNotifications = sendNotifications;
var NotificationChangeType;
(function (NotificationChangeType) {
    NotificationChangeType[NotificationChangeType["Rewards"] = 0] = "Rewards";
    NotificationChangeType[NotificationChangeType["Promotions"] = 1] = "Promotions";
    NotificationChangeType[NotificationChangeType["Specials"] = 2] = "Specials";
})(NotificationChangeType || (exports.NotificationChangeType = NotificationChangeType = {}));
module.exports = {
    NotificationChangeType,
    sendNotifications: exports.sendNotifications,
};
