import { getByAuthenticationKey } from "../models/user.js";

export default function auth(allowed_roles) {
  return function (req, res, next) {
    let authenticationKey;

    if (req.body && req.body.authenticationKey) {
      authenticationKey = req.body.authenticationKey;
    } else if (req.headers["authentication-key"]) {
      authenticationKey = req.headers["authentication-key"];
    }

    if (authenticationKey) {
      getByAuthenticationKey(authenticationKey)
        .then((user) => {
          if (allowed_roles.includes(user.role)) {
            next();
          } else {
            res.status(403).json({
              status: 403,
              message: "Access forbidden",
            });
          }
        })
        .catch((error) => {
          res.status(401).json({
            status: 401,
            message: "Authentication key invalid",
          });
        });
    } else {
      res.status(401).json({
        status: 401,
        message: "Authentication key missing",
      });
    }
  };
}
