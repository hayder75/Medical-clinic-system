module.exports = (roles) => (req, res, next) => {
  console.log('===== ROLEGUARD DEBUG =====');
  console.log('Required roles:', roles);
  console.log('User role:', req.user?.role);
  console.log('User has access:', roles.includes(req.user?.role));
  
  if (!roles.includes(req.user?.role)) {
    console.log('ACCESS DENIED - Role not in allowed list');
    return res.status(403).json({ error: 'Forbidden' });
  }
  console.log('ACCESS GRANTED');
  next();
};