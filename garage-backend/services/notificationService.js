import db from "../config/db.js";
import { messaging } from "../config/firebase.js";
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const createNotification = async (userId, title, message, type = 'GENERAL') => {
  // 1. Insert into DB (In-App)
  try {
    await db.query(
      "INSERT INTO Notifications (UserID, Title, Message, Type) VALUES (?, ?, ?, ?)",
      [userId, title, message, type]
    );

    // 2. Fetch User's Push Tokens
    const [tokens] = await db.query("SELECT Token FROM PushTokens WHERE UserID = ?", [userId]);

    if (tokens.length > 0) {
      const expoTokens = [];
      const fcmTokens = [];

      tokens.forEach(t => {
        if (Expo.isExpoPushToken(t.Token)) {
          expoTokens.push(t.Token);
        } else {
          fcmTokens.push(t.Token);
        }
      });

      // --- Handle Expo Notifications ---
      if (expoTokens.length > 0) {
        let messages = [];
        for (let pushToken of expoTokens) {
          messages.push({
            to: pushToken,
            sound: 'default',
            title: title,
            body: message,
            data: { type },
          });
        }
        
        try {
          let chunks = expo.chunkPushNotifications(messages);
          for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            // In a production app, you might want to save tickets and check them later
            console.log(`Expo push sent to ${userId}:`, ticketChunk);
          }
        } catch (expoError) {
          console.error("Expo Push Error:", expoError.message);
        }
      }

      // --- Handle FCM Notifications ---
      if (fcmTokens.length > 0 && messaging) {
        const payload = {
          tokens: fcmTokens,
          notification: { title, body: message },
          data: { type },
        };

        try {
          const response = await messaging.sendEachForMulticast(payload);
          console.log(`FCM sent ${response.successCount} messages to ${userId}.`);
          
          if (response.failureCount > 0) {
            const cleanupTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code;
                if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                  cleanupTokens.push(fcmTokens[idx]);
                }
              }
            });

            if (cleanupTokens.length > 0) {
              await db.query("DELETE FROM PushTokens WHERE Token IN (?)", [cleanupTokens]);
            }
          }
        } catch (fcmError) {
          console.error("FCM Delivery Error:", fcmError.message);
        }
      } else if (fcmTokens.length > 0 && !messaging) {
        console.warn("FCM tokens found but messaging not initialized. Skipping FCM.");
      }
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};

export const fetchMyNotifications = async (userId) => {
  const [rows] = await db.query(
    "SELECT * FROM Notifications WHERE UserID = ? ORDER BY CreatedAt DESC",
    [userId]
  );
  return rows;
};

export const markAsRead = async (notificationId, userId) => {
  await db.query(
    "UPDATE Notifications SET IsRead = TRUE WHERE NotificationID = ? AND UserID = ?",
    [notificationId, userId]
  );
};

export const deleteNotification = async (notificationId, userId) => {
  await db.query(
    "DELETE FROM Notifications WHERE NotificationID = ? AND UserID = ?",
    [notificationId, userId]
  );
};

export const deleteAllNotifications = async (userId) => {
  await db.query(
    "DELETE FROM Notifications WHERE UserID = ?",
    [userId]
  );
};

export const savePushToken = async (userId, token, deviceType) => {
  await db.query(
    "INSERT INTO PushTokens (UserID, Token, DeviceType) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Token = ?",
    [userId, token, deviceType, token]
  );
};