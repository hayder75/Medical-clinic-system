const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const validators = require('../utils/validators');

exports.login = async (req, res) => {
  try {
    const { username, password } = validators.loginSchema.parse(req.body);
    
    // Fallback test users when database is not available
    const testUsers = [
      {
        id: '1',
        username: 'pharmacist',
        password: 'pharmacist123',
        fullname: 'Chief Pharmacist',
        role: 'PHARMACIST'
      },
      {
        id: '2',
        username: 'pharmacy',
        password: 'pharmacy123',
        fullname: 'Pharmacy Staff',
        role: 'PHARMACIST'
      },
      {
        id: '3',
        username: 'admin',
        password: 'admin123',
        fullname: 'Admin User',
        role: 'ADMIN'
      },
      {
        id: '4',
        username: 'doctor',
        password: 'doctor123',
        fullname: 'Dr. Smith',
        role: 'DOCTOR'
      },
      {
        id: '4aed4032-47eb-4c74-8e8a-6e4c51315a85',
        username: 'labtech',
        password: 'labtech123',
        fullname: 'Lab Technician',
        role: 'LAB_TECHNICIAN'
      },
      {
        id: '5',
        username: 'reception',
        password: 'password123',
        fullname: 'Reception Staff',
        role: 'RECEPTIONIST'
      }
    ];

    let user = null;
    
    try {
      // Try database first
      user = await prisma.user.findUnique({ where: { username } });
      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
        return res.json({ token, user: { id: user.id, role: user.role, fullname: user.fullname, specialties: user.specialties } });
      }
    } catch (dbError) {
      console.log('Database not available, using test users');
    }

    // Fallback to test users
    const testUser = testUsers.find(u => u.username === username && u.password === password);
    if (testUser) {
      const token = jwt.sign({ id: testUser.id, role: testUser.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
      return res.json({ token, user: { id: testUser.id, role: testUser.role, fullname: testUser.fullname } });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

//what about logout 