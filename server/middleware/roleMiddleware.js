/**
 * Restricts a route to specific roles.
 * Usage: router.post('/jobs', protect, allowRoles('admin', 'recruiter'), createJob)
 */
export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error("You do not have permission to perform this action.");
  }
  next();
};
