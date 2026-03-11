import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

export const generateJWTToken = (payload) => {
  const { id, role } = payload;
  return jwt.sign({ id, role }, process.env.SECRETE_KEY, {
    expiresIn: process.env.EXPIRESIN,
  });
};

export const generateJWTTokenForgotPassForms = (payload) => {
  const { id, role } = payload;
  return jwt.sign({ id, role }, process.env.SECRETE_KEY, {
    expiresIn: process.env.EXPIEDFORMIN,
  });
};

export const verifyForForgotPassForms = (req, res, next) => {
  const { token } = req.query;
  if (!token) return res.status(403).json({ message: "Your Not Authorized" });
  jwt.verify(token, process.env.SECRETE_KEY, (err, user) => {
    if (!user || err)
      return res.status(403).json({ message: "Token is not valide" });
    req.user = user;
    next();
  });
};

export const verify = (req, res, next) => {
  const { secureToken } = req.cookies;
  if (!secureToken)
    return res.status(403).json({ message: "Your Not Authorized" });
  jwt.verify(secureToken, process.env.SECRETE_KEY, (err, user) => {
    if (!user || err)
      return res.status(403).json({ message: "Token is not valide" });
    req.user = user;

    next();
  });
};

export const resetPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many password reset attempts. Please try again after 30 minutes.",
      retryAfterSeconds: Math.ceil(
        (req.rateLimit.resetTime - new Date()) / 1000
      ),
    });
  },

  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message: "Too many login attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // default keyGenerator uses ipKeyGenerator internally
});

export const passwordUpdateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // allow 10 password updates per 10 minutes
  message: {
    status: 429,
    message: "Too many password update requests. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id, // per user
});
