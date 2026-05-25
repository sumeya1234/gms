export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.Role;

    if (!userRole || !roles.some(role => role.toLowerCase() === userRole.toLowerCase())) {
      console.warn(`[Authorize] Access denied for role: ${userRole}. Required: ${roles.join(', ')}`);
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};