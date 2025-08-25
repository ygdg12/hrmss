// middleware/checkRole.js
module.exports = function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: "Server error in role check" });
    }
  };
};
