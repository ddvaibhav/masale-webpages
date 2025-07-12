
function authMiddleware(req, res, next) {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.redirect("/accounts/login");
  }
};

module.exports = authMiddleware;
