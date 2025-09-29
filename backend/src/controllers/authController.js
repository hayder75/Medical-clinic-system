const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const validators = require('../utils/validators');

exports.login = async (req, res) => {
  try {
    const { username, password } = validators.loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, role: user.role, fullname: user.fullname } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

//what about logout 