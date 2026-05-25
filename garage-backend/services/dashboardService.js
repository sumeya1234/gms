import db from "../config/db.js";

export const getSuperAdminStats = async () => {
  const [[totalGarages]] = await db.query("SELECT COUNT(*) as count FROM garages");
  const [[totalUsers]] = await db.query("SELECT COUNT(*) as count FROM users");
  const [[activeRequests]] = await db.query("SELECT COUNT(*) as count FROM servicerequests WHERE Status NOT IN ('Completed', 'Rejected')");
  const [[totalRevenue]] = await db.query("SELECT SUM(Amount) as sum FROM payments WHERE PaymentStatus = 'Completed'");

  return {
    totalGarages: totalGarages.count,
    totalUsers: totalUsers.count,
    activeRequests: activeRequests.count,
    totalRevenue: totalRevenue.sum || 0
  };
};

export const getGarageManagerStats = async (garageId, user) => {
  if (user?.role === "GarageManager") {
    const [manager] = await db.query("SELECT 1 FROM garagemanagers WHERE UserID = ? AND GarageID = ?", [user.id, garageId]);
    if (!manager.length) {
      const error = new Error("Unauthorized: You do not manage this garage");
      error.status = 403;
      throw error;
    }
  }
  if (user?.role === "Accountant") {
    const [accountant] = await db.query("SELECT 1 FROM accountants WHERE UserID = ? AND GarageID = ?", [user.id, garageId]);
    if (!accountant.length) {
      const error = new Error("Unauthorized: You are not assigned to this garage");
      error.status = 403;
      throw error;
    }
  }

  const [[activeJobs]] = await db.query(
    "SELECT COUNT(*) as count FROM servicerequests WHERE GarageID = ? AND Status IN ('Pending', 'Approved', 'InProgress')",
    [garageId]
  );

  const [[totalRevenue]] = await db.query(
    "SELECT SUM(Amount) as sum FROM payments p JOIN servicerequests sr ON p.RequestID = sr.RequestID WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'",
    [garageId]
  );

  const [lowStockItems] = await db.query(
    "SELECT ItemName, Quantity FROM inventory WHERE GarageID = ? AND Quantity < 10",
    [garageId]
  );

  const [[activeEstimates]] = await db.query(
    "SELECT COUNT(*) as count FROM servicerequests WHERE GarageID = ? AND Status = 'pending'",
    [garageId]
  );

  const [[approvedEstimates]] = await db.query(
    "SELECT COUNT(*) as count FROM servicerequests WHERE GarageID = ? AND Status = 'Approved'",
    [garageId]
  );

  return {
    activeJobs: activeJobs?.count || 0,
    totalRevenue: totalRevenue?.sum || 0,
    lowStockItems: lowStockItems || [],
    activeEstimates: (activeEstimates?.count || 0) + (approvedEstimates?.count || 0),
    pendingApproval: activeEstimates?.count || 0
  };
};

export const getGarageOwnerOverview = async (garageId) => {
  const [[activeJobs]] = await db.query(
    "SELECT COUNT(*) as count FROM servicerequests WHERE GarageID = ? AND Status IN ('Pending', 'Approved', 'InProgress')",
    [garageId]
  );
  const [[completedJobs]] = await db.query(
    "SELECT COUNT(*) as count FROM servicerequests WHERE GarageID = ? AND Status = 'Completed'",
    [garageId]
  );
  const [[pendingPayments]] = await db.query(
    `SELECT COUNT(*) as count
     FROM payments p
     JOIN servicerequests sr ON p.RequestID = sr.RequestID
     WHERE sr.GarageID = ? AND p.PaymentStatus = 'Pending'`,
    [garageId]
  );
  const [[totalRevenue]] = await db.query(
    `SELECT COALESCE(SUM(p.Amount), 0) as sum
     FROM payments p
     JOIN servicerequests sr ON p.RequestID = sr.RequestID
     WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'`,
    [garageId]
  );
  const [lowStockItems] = await db.query(
    "SELECT ItemName, Quantity FROM inventory WHERE GarageID = ? AND Quantity < 10 ORDER BY Quantity ASC",
    [garageId]
  );

  return {
    activeJobs: activeJobs.count,
    completedJobs: completedJobs.count,
    pendingPayments: pendingPayments.count,
    totalRevenue: totalRevenue.sum || 0,
    lowStockItems
  };
};

export const getGarageRevenueByPeriod = async (garageId, period = "daily") => {
  let query = "";
  if (period === "weekly") {
    query = `
      SELECT DATE_FORMAT(p.PaymentDate, '%x-W%v') as label, COALESCE(SUM(p.Amount), 0) as revenue
      FROM payments p
      JOIN servicerequests sr ON p.RequestID = sr.RequestID
      WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'
        AND p.PaymentDate >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY label
      ORDER BY MAX(p.PaymentDate) DESC
      LIMIT 12
    `;
  } else if (period === "monthly") {
    query = `
      SELECT DATE_FORMAT(p.PaymentDate, '%Y-%m') as label, COALESCE(SUM(p.Amount), 0) as revenue
      FROM payments p
      JOIN servicerequests sr ON p.RequestID = sr.RequestID
      WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'
        AND p.PaymentDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY label
      ORDER BY MAX(p.PaymentDate) DESC
      LIMIT 12
    `;
  } else if (period === "yearly") {
    query = `
      SELECT DATE_FORMAT(p.PaymentDate, '%Y') as label, COALESCE(SUM(p.Amount), 0) as revenue
      FROM payments p
      JOIN servicerequests sr ON p.RequestID = sr.RequestID
      WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'
        AND p.PaymentDate >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
      GROUP BY label
      ORDER BY label DESC
      LIMIT 5
    `;
  } else {
    query = `
      SELECT DATE_FORMAT(p.PaymentDate, '%Y-%m-%d') as label, COALESCE(SUM(p.Amount), 0) as revenue
      FROM payments p
      JOIN servicerequests sr ON p.RequestID = sr.RequestID
      WHERE sr.GarageID = ? AND p.PaymentStatus = 'Completed'
        AND p.PaymentDate >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY label
      ORDER BY MAX(p.PaymentDate) DESC
      LIMIT 14
    `;
  }

  const [rows] = await db.query(query, [garageId]);
  return rows.reverse();
};

export const generateGarageOperationalReport = async (garageId, period = "monthly") => {
  const [revenueTrend, overview, stockSnapshot] = await Promise.all([
    getGarageRevenueByPeriod(garageId, period),
    getGarageOwnerOverview(garageId),
    db.query(
      `SELECT ItemID, ItemName, Quantity, UnitPrice, (Quantity * UnitPrice) as stockValue
       FROM inventory
       WHERE GarageID = ?
       ORDER BY Quantity ASC, ItemName ASC`,
      [garageId]
    ).then(([rows]) => rows)
  ]);

  const totalStockValue = stockSnapshot.reduce((sum, item) => sum + Number(item.stockValue || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    period,
    financial: {
      totalRevenue: overview.totalRevenue,
      pendingPayments: overview.pendingPayments,
      trend: revenueTrend
    },
    operations: {
      activeJobs: overview.activeJobs,
      completedJobs: overview.completedJobs
    },
    inventory: {
      totalStockValue,
      lowStockItems: overview.lowStockItems,
      stockSnapshot
    }
  };
};

export const getServiceUsageStats = async (garageId, period = "monthly") => {
  let interval = "INTERVAL 30 DAY";
  if (period === "weekly") interval = "INTERVAL 7 DAY";
  if (period === "yearly") interval = "INTERVAL 1 YEAR";

  const [rows] = await db.query(
    `SELECT 
      gs.ServiceName,
      COUNT(sr.RequestID) as usageCount,
      SUM(COALESCE(gs.Price, 0)) as totalRevenue
     FROM garageservices gs
     LEFT JOIN servicerequests sr ON sr.GarageID = gs.GarageID 
        AND FIND_IN_SET(TRIM(gs.ServiceName), REPLACE(REPLACE(sr.ServiceType, ' ,', ','), ', ', ','))
        AND sr.Status = 'Completed'
        AND sr.RequestDate >= DATE_SUB(CURDATE(), ${interval})
     WHERE gs.GarageID = ?
     GROUP BY gs.ServiceName
     ORDER BY usageCount DESC`,
    [garageId]
  );
  return rows;
};

export const getPartsUsageLog = async (garageId, period = "monthly") => {
  let interval = "INTERVAL 30 DAY";
  if (period === "weekly") interval = "INTERVAL 7 DAY";
  if (period === "yearly") interval = "INTERVAL 1 YEAR";

  const [rows] = await db.query(
    `SELECT 
      si.ItemID,
      i.ItemName,
      SUM(si.QuantityUsed) as totalQuantity,
      AVG(i.SellingPrice) as avgPrice,
      SUM(si.QuantityUsed * i.SellingPrice) as totalCost,
      MAX(sr.RequestDate) as lastUsed
     FROM serviceitems si
     JOIN inventory i ON si.ItemID = i.ItemID
     JOIN servicerequests sr ON si.RequestID = sr.RequestID
     WHERE sr.GarageID = ? 
       AND sr.Status = 'Completed'
       AND sr.RequestDate >= DATE_SUB(CURDATE(), ${interval})
     GROUP BY si.ItemID, i.ItemName
     ORDER BY totalCost DESC`,
    [garageId]
  );
  return rows;
};
