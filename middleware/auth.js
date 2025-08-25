// Middleware to check role
const checkRole = (roles) => {
  return (req, res, next) => {
    const user = req.user; // assume req.user is set after login/auth
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

module.exports = { checkRole };

