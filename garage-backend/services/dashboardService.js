import db from "../config/db.js";

export const getSuperAdminStats = async () => {
  const [[totalGarages]] = await db.query("SELECT COUNT(*) as count FROM Garages");
  const [[totalUsers]] = await db.query("SELECT COUNT(*) as count FROM Users");
  const [[activeRequests]] = await db.query("SELECT COUNT(*) as count FROM ServiceRequests WHERE Status NOT IN ('Completed', 'Rejected')");
  const [[totalRevenue]] = await db.query("SELECT SUM(Amount) as sum FROM Payments WHERE PaymentStatus = 'Completed'");

  return {
    totalGarages: totalGarages.count,
    totalUsers: totalUsers.count,
    activeRequests: activeRequests.count,
    totalRevenue: totalRevenue.sum || 0
  };
};

export const getGarageManagerStats = async (garageId) => {
  const [[activeJobs]] = await db.query(
    "SELECT COUNT(*) as count FROM ServiceRequests WHERE GarageID = ? AND Status IN ('Pending', 'Approved', 'InProgress')",
    [garageId]
  );
  
  const [[totalRevenue]] = await db.query(
    "SELECT SUM(Amount) as sum FROM Payments p JOIN ServiceRequests sr ON p.RequestID = sr.RequestID WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'",
    [garageId]
  );

  const [lowStockItems] = await db.query(
    "SELECT ItemName, Quantity FROM Inventory WHERE GarageID = ? AND Quantity < 10",
    [garageId]
  );

  return {
    activeJobs: activeJobs.count,
    totalRevenue: totalRevenue.sum || 0,
    lowStockItems
  };
};
