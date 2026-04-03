import { getUserProfile, updateProfile, changePassword, updateRole, assignUserToGarage } from "../services/userService.js";
import { fetchMyNotifications, savePushToken } from "../services/notificationService.js";
import { getSuperAdminStats } from "../services/dashboardService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const userProfile = await getUserProfile(req.user.id);
  res.json({
    user: {
      id: userProfile.UserID,
      fullName: userProfile.FullName,
      email: userProfile.Email,
      phone: userProfile.PhoneNumber,
      role: userProfile.Role,
      status: userProfile.Status
    }
  });
});

export const editProfile = asyncHandler(async (req, res) => {
  await updateProfile(req.user.id, req.body);
  res.json({ message: "Profile updated successfully" });
});

export const editPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await changePassword(req.user.id, oldPassword, newPassword);
  res.json({ message: "Password updated successfully" });
});

export const setUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  await updateRole(userId, role);
  res.json({ message: `User role updated to ${role}` });
});

export const assignToGarage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { garageId } = req.body;
  await assignUserToGarage(userId, garageId, req.user);
  res.json({ message: "User assigned successfully" });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await fetchMyNotifications(req.user.id);
  res.json(notifications);
});

export const registerToken = asyncHandler(async (req, res) => {
  const { token, deviceType } = req.body;
  await savePushToken(req.user.id, token, deviceType);
  res.json({ message: "Registration token saved" });
});

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await getSuperAdminStats();
  res.json(stats);
});
