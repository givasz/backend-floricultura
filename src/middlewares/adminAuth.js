const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
const ADMIN_USER = process.env.ADMIN_USER || null;
const ADMIN_PASS = process.env.ADMIN_PASS || null;

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
      return next();
    }
  }

  if (auth && auth.startsWith("Basic ")) {
    const b64 = auth.split(" ")[1];
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const [user, pass] = decoded.split(":");

    if (ADMIN_USER && ADMIN_PASS && user === ADMIN_USER && pass === ADMIN_PASS) {
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized (admin only)" });
}

module.exports = adminAuth;
