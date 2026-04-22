import db from "../config/db.js";
import axios from "axios";

export const createChapaSubaccount = async (businessName, accountName, bankCode, accountNumber) => {
  // In test mode, Chapa still validates real bank accounts, so we generate a local placeholder
  const isTestMode = process.env.CHAPA_SECRET_KEY?.startsWith('CHASECK_TEST');
  if (isTestMode) {
    const placeholderId = `test-sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[TEST MODE] Skipping Chapa subaccount API. Generated placeholder: ${placeholderId}`);
    return placeholderId;
  }

  try {
    const payload = {
      business_name: businessName,
      account_name: accountName,
      bank_code: bankCode,
      account_number: accountNumber,
      split_type: "percentage",
      split_value: 0.03
    };

    const response = await axios.post("https://api.chapa.co/v1/subaccount", payload, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === "success") {
      return response.data.data.subaccount_id;
    } else {
      throw new Error(response.data.message || "Failed to create Chapa subaccount");
    }
  } catch (error) {
    console.error("Chapa Subaccount Error:", error.response?.data || error.message);
    throw new Error("Could not set up bank details with payment gateway.");
  }
};

export const getChapaBanks = async () => {
  try {
    const response = await axios.get("https://api.chapa.co/v1/banks", {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch Chapa banks");
    }
  } catch (error) {
    console.error("Chapa Banks Error:", error.response?.data || error.message);
    throw new Error("Could not fetch banks from payment gateway.");
  }
};

export const createPayment = async (requestId, amount, method) => {
  const [service] = await db.query(
    `SELECT u.*, sr.*, g.ChapaSubaccountID 
     FROM ServiceRequests sr 
     JOIN Vehicles v ON sr.VehicleID = v.VehicleID 
     JOIN Users u ON v.CustomerID = u.UserID 
     LEFT JOIN Garages g ON sr.GarageID = g.GarageID
     WHERE sr.RequestID = ?`,
    [requestId]
  );

  if (service.length === 0) {
    const error = new Error("Service request not found");
    error.status = 404;
    throw error;
  }

  const user = service[0];
  const tx_ref = `tx-${requestId}-${Date.now()}`;

  let redirectUrl = null;

  if (method === 'Cash') {
    // Cash payment: just record as Pending, manager will confirm receipt later
    await db.query(
      `INSERT INTO Payments (RequestID, Amount, PaymentMethod, PaymentStatus, PaymentDate, TransactionRef)
       VALUES (?, ?, 'Cash', 'Pending', NOW(), ?)
       ON DUPLICATE KEY UPDATE Amount=?, PaymentMethod='Cash', TransactionRef=?, PaymentStatus='Pending'`,
      [requestId, amount, tx_ref, amount, tx_ref]
    );

    // Notify the garage manager about cash payment
    try {
      const [garageInfo] = await db.query(
        `SELECT sr.GarageID, gm.UserID as ManagerUserID
         FROM ServiceRequests sr
         LEFT JOIN GarageManagers gm ON sr.GarageID = gm.GarageID
         WHERE sr.RequestID = ?`,
        [requestId]
      );
      if (garageInfo.length > 0 && garageInfo[0].ManagerUserID) {
        await db.query(
          `INSERT INTO Notifications (UserID, Title, Message) VALUES (?, ?, ?)`,
          [garageInfo[0].ManagerUserID, 'Cash Payment Pending', `Customer chose to pay ${amount} ETB in cash for Service Request #${requestId}. Please confirm when received.`]
        );
      }
    } catch (e) {
      console.error("Cash notification error:", e.message);
    }

    return { checkout_url: null, tx_ref, method: 'Cash', message: 'Cash payment recorded. Please pay at the garage.' };
  }

  if (method === 'Chapa') {
    // Sanitize phone number (strip spaces, +251, etc.)
    let sanitizedPhone = user.PhoneNumber ? user.PhoneNumber.replace(/\D/g, '') : '';
    if (sanitizedPhone.startsWith('251')) sanitizedPhone = '0' + sanitizedPhone.slice(3);

    // Only include phone_number if it strictly matches 10 digits starting with 09 or 07
    const isValidTestPhone = /^(09|07)\d{8}$/.test(sanitizedPhone);

    const payload = {
      amount: amount.toString(),
      currency: "ETB",
      email: user.Email,
      first_name: user.FullName.split(' ')[0],
      last_name: user.FullName.split(' ')[1] || '',
      ...(isValidTestPhone && { phone_number: sanitizedPhone }),
      tx_ref: tx_ref,
      reference: tx_ref,
      callback_url: process.env.PUBLIC_BACKEND_URL ? `${process.env.PUBLIC_BACKEND_URL}/api/payments/webhook` : `https://webhook.site/placeholder_for_chapa`,
      customization: {
        title: "Garage Service",
        description: `Payment for Service Request ${requestId}`
      }
    };

    // Split payment: route funds to garage subaccount with 3% platform commission.
    // Skip test-mode placeholder IDs (they start with "test-sub-")
    if (user.ChapaSubaccountID && !user.ChapaSubaccountID.startsWith('test-sub-')) {
      payload.subaccounts = {
        id: user.ChapaSubaccountID,
        split_type: "percentage",
        split_value: 0.03
      };
    }

    try {
      const response = await axios.post("https://api.chapa.co/v1/transaction/initialize", payload, {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === "success") {
        redirectUrl = response.data.data.checkout_url;
      } else {
        throw new Error(response.data.message || "Failed to initialize payment");
      }
    } catch (chapaError) {
      console.error("Chapa Init Error:", chapaError.response?.data || chapaError.message);
      console.error("Chapa Init Payload was:", JSON.stringify(payload, null, 2));
      const error = new Error("Failed connecting to payment gateway.");
      error.status = 502;
      throw error;
    }
  }

  // Insert Pending Payment record for Chapa
  await db.query(
    `INSERT INTO Payments (RequestID, Amount, PaymentMethod, PaymentStatus, PaymentDate, TransactionRef)
     VALUES (?, ?, ?, 'Pending', NOW(), ?)
     ON DUPLICATE KEY UPDATE Amount=?, PaymentMethod=?, TransactionRef=?, PaymentStatus='Pending'`,
    [requestId, amount, method, tx_ref, amount, method, tx_ref]
  );

  return { checkout_url: redirectUrl, tx_ref };
};

const finalizeRequestPayment = async (requestId, amountPaid) => {
  const [request] = await db.query("SELECT DepositAmount, IsDepositPaid FROM ServiceRequests WHERE RequestID = ?", [requestId]);
  if (request.length > 0) {
    const { DepositAmount, IsDepositPaid } = request[0];
    if (DepositAmount > 0 && !IsDepositPaid) {
      // If payment is primarily for deposit
      await db.query("UPDATE ServiceRequests SET IsDepositPaid = TRUE WHERE RequestID = ?", [requestId]);
    }
  }
};

export const verifyChapaPayment = async (tx_ref) => {
  try {
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success' && response.data.data.status === 'success') {
      // Mark payment as completed
      await db.query(
        "UPDATE Payments SET PaymentStatus = 'Completed', PaymentDate = NOW() WHERE TransactionRef = ?",
        [tx_ref]
      );

      // Fetch RequestID to finalize deposit logic
      const [[pmt]] = await db.query("SELECT RequestID, Amount FROM Payments WHERE TransactionRef = ?", [tx_ref]);
      if (pmt) {
        await finalizeRequestPayment(pmt.RequestID, pmt.Amount);
      }

      // Notify the garage manager that payment was received
      try {
        const [paymentInfo] = await db.query(
          `SELECT p.RequestID, p.Amount, sr.GarageID, gm.UserID as ManagerUserID
           FROM Payments p
           JOIN ServiceRequests sr ON p.RequestID = sr.RequestID
           LEFT JOIN GarageManagers gm ON sr.GarageID = gm.GarageID
           WHERE p.TransactionRef = ?`,
          [tx_ref]
        );
        if (paymentInfo.length > 0 && paymentInfo[0].ManagerUserID) {
          await db.query(
            `INSERT INTO Notifications (UserID, Title, Message) VALUES (?, ?, ?)`,
            [
              paymentInfo[0].ManagerUserID,
              'Payment Received',
              `Payment of ${paymentInfo[0].Amount} ETB received for Service Request #${paymentInfo[0].RequestID}.`
            ]
          );
        }
      } catch (notifErr) {
        console.error("Failed to send payment notification:", notifErr.message);
      }

      return { success: true, message: "Payment verified and completed" };
    } else {
      return { success: false, message: "Payment is pending or failed" };
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new Error("Failed to verify transaction with Chapa");
  }
};

export const cancelChapaPayment = async (tx_ref) => {
  try {
    const response = await axios.put(`https://api.chapa.co/v1/transaction/cancel/${tx_ref}`, {}, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success') {
      return { success: true, message: "Transaction cancelled successfully" };
    }
    return { success: false, message: "Could not cancel transaction" };
  } catch (error) {
    console.error("Cancel Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to cancel transaction");
  }
};

export const handleWebhook = async (reqBody) => {
  const { trx_ref, status } = reqBody;

  if (status === 'success') {
    // Idempotency: skip if already marked Completed
    const [existing] = await db.query("SELECT PaymentStatus FROM Payments WHERE TransactionRef = ?", [trx_ref]);
    if (existing.length > 0 && existing[0].PaymentStatus === 'Completed') {
      return; // Already processed
    }

    // Verify with Chapa officially before committing funds
    await verifyChapaPayment(trx_ref);
  }
};

export const confirmCashPayment = async (requestId, managerId) => {
  // Check the payment exists and is Cash + Pending
  const [payment] = await db.query(
    "SELECT * FROM Payments WHERE RequestID = ? AND PaymentMethod = 'Cash' AND PaymentStatus = 'Pending'",
    [requestId]
  );
  if (payment.length === 0) {
    const error = new Error("No pending cash payment found for this request.");
    error.status = 404;
    throw error;
  }

  // Verify this manager owns the garage for this request
  const [auth] = await db.query(
    `SELECT 1 FROM ServiceRequests sr
     JOIN GarageManagers gm ON sr.GarageID = gm.GarageID
     WHERE sr.RequestID = ? AND gm.UserID = ?`,
    [requestId, managerId]
  );
  if (auth.length === 0) {
    const error = new Error("Unauthorized: You don't manage this garage.");
    error.status = 403;
    throw error;
  }

  // Mark payment as Completed
  await db.query(
    "UPDATE Payments SET PaymentStatus = 'Completed' WHERE RequestID = ? AND PaymentMethod = 'Cash'",
    [requestId]
  );

  await finalizeRequestPayment(requestId, payment[0].Amount);

  // Notify the customer
  try {
    const [custInfo] = await db.query(
      `SELECT v.CustomerID FROM ServiceRequests sr
       JOIN Vehicles v ON sr.VehicleID = v.VehicleID
       WHERE sr.RequestID = ?`,
      [requestId]
    );
    if (custInfo.length > 0) {
      await db.query(
        "INSERT INTO Notifications (UserID, Title, Message) VALUES (?, ?, ?)",
        [custInfo[0].CustomerID, 'Cash Payment Confirmed', `Your cash payment of ${payment[0].Amount} ETB for Service Request #${requestId} has been confirmed.`]
      );
    }
  } catch (e) {
    console.error("Cash confirm notification error:", e.message);
  }

  return { message: "Cash payment confirmed successfully." };
};

export const confirmOnlinePayment = async (requestId, managerId) => {
  // Check the payment exists and is Chapa + Pending
  const [payment] = await db.query(
    "SELECT * FROM Payments WHERE RequestID = ? AND PaymentMethod = 'Chapa' AND PaymentStatus = 'Pending'",
    [requestId]
  );
  if (payment.length === 0) {
    const error = new Error("No pending online payment found for this request.");
    error.status = 404;
    throw error;
  }

  // Verify manager owns the garage
  const [auth] = await db.query(
    `SELECT 1 FROM ServiceRequests sr
     JOIN GarageManagers gm ON sr.GarageID = gm.GarageID
     WHERE sr.RequestID = ? AND gm.UserID = ?`,
    [requestId, managerId]
  );
  if (auth.length === 0) {
    const error = new Error("Unauthorized: You don't manage this garage.");
    error.status = 403;
    throw error;
  }

  // Try to verify with Chapa first
  const tx_ref = payment[0].TransactionRef;
  try {
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: { 'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}` }
    });
    if (response.data.status === 'success' && response.data.data.status === 'success') {
      await db.query("UPDATE Payments SET PaymentStatus = 'Completed' WHERE RequestID = ?", [requestId]);
      await finalizeRequestPayment(requestId, payment[0].Amount);
      return { message: "Payment verified with Chapa and confirmed." };
    }
  } catch (e) {
    console.log("Chapa verify failed, using manual confirm:", e.message);
  }

  // Manual confirm if Chapa verify fails (test mode)
  await db.query("UPDATE Payments SET PaymentStatus = 'Completed' WHERE RequestID = ?", [requestId]);
  await finalizeRequestPayment(requestId, payment[0].Amount);

  // Notify customer
  try {
    const [custInfo] = await db.query(
      `SELECT v.CustomerID FROM ServiceRequests sr
       JOIN Vehicles v ON sr.VehicleID = v.VehicleID
       WHERE sr.RequestID = ?`,
      [requestId]
    );
    if (custInfo.length > 0) {
      await db.query(
        "INSERT INTO Notifications (UserID, Title, Message) VALUES (?, ?, ?)",
        [custInfo[0].CustomerID, 'Payment Confirmed', `Your online payment of ${payment[0].Amount} ETB for Service Request #${requestId} has been confirmed.`]
      );
    }
  } catch (e) {
    console.error("Online confirm notification error:", e.message);
  }

  return { message: "Online payment confirmed successfully." };
};
