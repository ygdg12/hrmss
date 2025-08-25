const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecret"); // Use the same secret as signin route
    req.user = decoded; // attach user info
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
