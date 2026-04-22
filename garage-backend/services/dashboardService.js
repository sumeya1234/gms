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

export const getSuperAdminAnalytics = async () => {
  // Monthly Revenue for last 6 months
  const [revenueStats] = await db.query(`
    SELECT 
      DATE_FORMAT(PaymentDate, '%Y-%m') as month,
      SUM(Amount) as revenue
    FROM Payments
    WHERE PaymentStatus = 'Completed' 
      AND PaymentDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  // Monthly Requests for last 6 months
  const [requestStats] = await db.query(`
    SELECT 
      DATE_FORMAT(RequestDate, '%Y-%m') as month,
      COUNT(*) as count
    FROM ServiceRequests
    WHERE RequestDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  // Top 5 Garages by Total Revenue
  const [garageRevenue] = await db.query(`
    SELECT 
      g.Name as name,
      SUM(p.Amount) as revenue
    FROM Garages g
    JOIN ServiceRequests sr ON g.GarageID = sr.GarageID
    JOIN Payments p ON sr.RequestID = p.RequestID
    WHERE p.PaymentStatus = 'Completed'
    GROUP BY g.GarageID
    ORDER BY revenue DESC
    LIMIT 5
  `);

  // Popular Service Types
  const [serviceTypes] = await db.query(`
    SELECT 
      ServiceType as name,
      COUNT(*) as count
    FROM ServiceRequests
    GROUP BY ServiceType
    ORDER BY count DESC
    LIMIT 10
  `);

  return {
    revenueStats,
    requestStats,
    garageRevenue,
    serviceTypes
  };
};
