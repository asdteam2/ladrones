function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    return next();
  };
}

module.exports = requireRole;
