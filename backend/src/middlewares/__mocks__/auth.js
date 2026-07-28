module.exports = {
  authenticate: (req, _res, next) => {
    req.user = { id: 'test-user-id', email: 'test@test.com' };
    next();
  },
  authorize: (...roles) => (req, _res, next) => {
    req.userRole = roles[0] || 'super_admin';
    next();
  },
};
