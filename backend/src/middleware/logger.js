const prisma = require('../config/database');

module.exports = async (req, res, next) => {
  const { method, url, body, user } = req;
  const oldSend = res.send;
  res.send = async (data) => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: method + ' ' + url,
          entity: url.split('/')[2] || 'Unknown',
          entityId: body?.id || 0,
          details: JSON.stringify(body || {}),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch (error) {
      console.error('Audit log error:', error.message);
    }
    oldSend.call(res, data);
  };
  next();
};