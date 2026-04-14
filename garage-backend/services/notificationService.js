import db from "../config/db.js";

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
      // 3. Send (Mocked) Push Notifications
      tokens.forEach(t => {
        console.log(`[MOCK PUSH]: To Token ${t.Token} - ${title}: ${message} (Type: ${type})`);
      });
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