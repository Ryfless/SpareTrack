function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection?.remoteAddress || '');
  return ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip;
}

module.exports = { getClientIp };
