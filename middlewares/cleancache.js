const { clearHash } = require('../services/cache');

module.exports =  async (req, res, next) => {
 // this says we should we wait for the route handler and anytime the
 // route finishes the work it will come back to this middleware
 await next();
 clearHash(req.user.id);
}