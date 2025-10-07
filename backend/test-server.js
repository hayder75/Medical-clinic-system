const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Test users (in-memory for testing)
const testUsers = [
  {
    id: '1',
    username: 'doctor1',
    password: 'password123',
    fullname: 'Dr. John Smith',
    role: 'DOCTOR'
  },
  {
    id: '2',
    username: 'admin1',
    password: 'admin123',
    fullname: 'Admin User',
    role: 'ADMIN'
  },
  {
    id: '3',
    username: 'hayder',
    password: 'hayder123',
    fullname: 'Hayder User',
    role: 'DOCTOR'
  },
  {
    id: '4',
    username: 'pharmacy1',
    password: 'pharmacy123',
    fullname: 'Pharmacy Staff',
    role: 'PHARMACIST'
  },
  {
    id: '5',
    username: 'pharmacist',
    password: 'pharmacist123',
    fullname: 'Chief Pharmacist',
    role: 'PHARMACIST'
  }
];

// Test medications (in-memory for testing)
const testMedications = [
  {
    id: '1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'TABLETS',
    unitPrice: 2.50,
    availableQuantity: 1000,
    manufacturer: 'Ethio Pharma'
  },
  {
    id: '2',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosageForm: 'Capsule',
    strength: '500mg',
    category: 'CAPSULES',
    unitPrice: 5.00,
    availableQuantity: 500,
    manufacturer: 'Cadila Pharmaceuticals'
  },
  {
    id: '3',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosageForm: 'Tablet',
    strength: '400mg',
    category: 'TABLETS',
    unitPrice: 3.00,
    availableQuantity: 800,
    manufacturer: 'Ethio Pharma'
  },
  {
    id: '4',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'TABLETS',
    unitPrice: 4.50,
    availableQuantity: 600,
    manufacturer: 'Sun Pharma'
  },
  {
    id: '5',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    dosageForm: 'Tablet',
    strength: '5mg',
    category: 'TABLETS',
    unitPrice: 6.00,
    availableQuantity: 400,
    manufacturer: 'Pfizer'
  },
  {
    id: '6',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosageForm: 'Tablet',
    strength: '10mg',
    category: 'TABLETS',
    unitPrice: 5.50,
    availableQuantity: 350,
    manufacturer: 'Teva Pharmaceuticals'
  },
  {
    id: '7',
    name: 'Insulin',
    genericName: 'Human Insulin',
    dosageForm: 'Injection',
    strength: '100 units/ml',
    category: 'INJECTIONS',
    unitPrice: 25.00,
    availableQuantity: 50,
    manufacturer: 'Novo Nordisk'
  }
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = testUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        username: user.username, 
        fullname: user.fullname 
      }, 
      'test-secret-key', 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        role: user.role, 
        fullname: user.fullname,
        username: user.username
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Medication routes
app.get('/api/medications/search', (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    let medications = testMedications;
    
    if (query) {
      medications = testMedications.filter(med => 
        med.name.toLowerCase().includes(query.toLowerCase()) ||
        med.genericName.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      medications: medications.slice(0, parseInt(limit)),
      total: medications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search medications',
      details: error.message 
    });
  }
});

app.get('/api/medications/categories/list', (req, res) => {
  try {
    const categories = ['TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS'];
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get categories',
      details: error.message 
    });
  }
});

// Doctor routes
app.get('/api/doctors/queue', (req, res) => {
  try {
    // Mock patient queue
    const queue = [
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        patientIdNumber: 'P001',
        visitType: 'CONSULTATION',
        status: 'WAITING',
        chiefComplaint: 'Headache',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Jane Smith',
        patientIdNumber: 'P002',
        visitType: 'FOLLOW_UP',
        status: 'WAITING',
        chiefComplaint: 'Fever',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        patientId: '3',
        patientName: 'Ahmed Hassan',
        patientIdNumber: 'P003',
        visitType: 'FOLLOW_UP',
        status: 'IN_PROGRESS',
        chiefComplaint: 'Diabetes management - lab results ready',
        createdAt: new Date().toISOString(),
        hasResults: true
      },
      {
        id: '4',
        patientId: '4',
        patientName: 'Fatima Ali',
        patientIdNumber: 'P004',
        visitType: 'FOLLOW_UP',
        status: 'IN_PROGRESS',
        chiefComplaint: 'Hypertension - BP results ready',
        createdAt: new Date().toISOString(),
        hasResults: true
      },
      {
        id: '5',
        patientId: '5',
        patientName: 'Mohammed Ibrahim',
        patientIdNumber: 'P005',
        visitType: 'FOLLOW_UP',
        status: 'IN_PROGRESS',
        chiefComplaint: 'Infection treatment - lab results ready',
        createdAt: new Date().toISOString(),
        hasResults: true
      }
    ];
    
    res.json({
      success: true,
      queue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient queue',
      details: error.message
    });
  }
});

app.get('/api/doctors/results-queue', (req, res) => {
  try {
    // Mock results queue (lab/radiology results waiting for doctor review)
    const resultsQueue = [
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        patientIdNumber: 'P001',
        orderType: 'LAB',
        testName: 'Complete Blood Count',
        status: 'COMPLETED',
        result: 'Normal',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Jane Smith',
        patientIdNumber: 'P002',
        orderType: 'RADIOLOGY',
        testName: 'Chest X-Ray',
        status: 'COMPLETED',
        result: 'Clear lungs',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        patientId: '3',
        patientName: 'Ahmed Hassan',
        patientIdNumber: 'P003',
        orderType: 'LAB',
        testName: 'Blood Sugar (Fasting)',
        status: 'COMPLETED',
        result: 'High - 180 mg/dL (Normal: 70-100 mg/dL)',
        createdAt: new Date().toISOString(),
        visitId: '3',
        requiresMedication: true,
        suggestedMedications: ['Metformin 500mg', 'Insulin']
      },
      {
        id: '4',
        patientId: '4',
        patientName: 'Fatima Ali',
        patientIdNumber: 'P004',
        orderType: 'LAB',
        testName: 'Blood Pressure Reading',
        status: 'COMPLETED',
        result: 'High - 160/95 mmHg (Normal: <120/80 mmHg)',
        createdAt: new Date().toISOString(),
        visitId: '4',
        requiresMedication: true,
        suggestedMedications: ['Amlodipine 5mg', 'Lisinopril 10mg']
      },
      {
        id: '5',
        patientId: '5',
        patientName: 'Mohammed Ibrahim',
        patientIdNumber: 'P005',
        orderType: 'LAB',
        testName: 'Infection Panel',
        status: 'COMPLETED',
        result: 'Bacterial infection detected - WBC count elevated',
        createdAt: new Date().toISOString(),
        visitId: '5',
        requiresMedication: true,
        suggestedMedications: ['Amoxicillin 500mg', 'Ibuprofen 400mg']
      }
    ];
    
    res.json({
      success: true,
      resultsQueue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results queue',
      details: error.message
    });
  }
});

app.get('/api/doctors/patients/:patientId/history', (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Mock patient history
    const history = [
      {
        id: '1',
        visitDate: '2024-01-15',
        diagnosis: 'Hypertension',
        medications: ['Amlodipine 5mg'],
        notes: 'Blood pressure controlled'
      },
      {
        id: '2',
        visitDate: '2024-01-10',
        diagnosis: 'Diabetes Type 2',
        medications: ['Metformin 500mg'],
        notes: 'Blood sugar levels stable'
      }
    ];
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient history',
      details: error.message
    });
  }
});

// Prescription routes
app.post('/api/doctors/prescriptions/batch', (req, res) => {
  try {
    const { visitId, patientId, medications } = req.body;
    
    console.log('📝 Prescription received:', { visitId, patientId, medications });
    
    res.json({
      success: true,
      message: 'Prescription submitted successfully',
      ordersCreated: medications.length,
      visitId: parseInt(visitId),
      patientId,
      medications: medications.map(med => ({
        name: med.name,
        dosageForm: med.dosageForm,
        strength: med.strength,
        quantity: med.quantity
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create prescription',
      details: error.message
    });
  }
});

// Pharmacy routes
app.get('/api/pharmacy/orders', (req, res) => {
  try {
    // Mock medication orders for pharmacy
    const orders = [
      {
        id: '1',
        patientId: '3',
        patientName: 'Ahmed Hassan',
        patientIdNumber: 'P003',
        doctorId: '3',
        doctorName: 'Hayder User',
        medications: [
          {
            name: 'Metformin',
            dosageForm: 'Tablet',
            strength: '500mg',
            quantity: 30,
            instructions: 'Take 1 tablet twice daily with meals'
          },
          {
            name: 'Insulin',
            dosageForm: 'Injection',
            strength: '100 units/ml',
            quantity: 1,
            instructions: 'Inject 10 units before breakfast'
          }
        ],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        totalAmount: 29.50
      },
      {
        id: '2',
        patientId: '4',
        patientName: 'Fatima Ali',
        patientIdNumber: 'P004',
        doctorId: '3',
        doctorName: 'Hayder User',
        medications: [
          {
            name: 'Amlodipine',
            dosageForm: 'Tablet',
            strength: '5mg',
            quantity: 30,
            instructions: 'Take 1 tablet once daily'
          },
          {
            name: 'Lisinopril',
            dosageForm: 'Tablet',
            strength: '10mg',
            quantity: 30,
            instructions: 'Take 1 tablet once daily'
          }
        ],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        totalAmount: 11.50
      },
      {
        id: '3',
        patientId: '5',
        patientName: 'Mohammed Ibrahim',
        patientIdNumber: 'P005',
        doctorId: '3',
        doctorName: 'Hayder User',
        medications: [
          {
            name: 'Amoxicillin',
            dosageForm: 'Capsule',
            strength: '500mg',
            quantity: 21,
            instructions: 'Take 1 capsule three times daily for 7 days'
          },
          {
            name: 'Ibuprofen',
            dosageForm: 'Tablet',
            strength: '400mg',
            quantity: 20,
            instructions: 'Take 1 tablet every 8 hours as needed for pain'
          }
        ],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        totalAmount: 8.00
      }
    ];
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch medication orders',
      details: error.message
    });
  }
});

app.put('/api/pharmacy/orders/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`📦 Pharmacy order ${orderId} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: `Order ${orderId} status updated to ${status}`,
      orderId: parseInt(orderId),
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      details: error.message
    });
  }
});

app.get('/api/pharmacy/inventory', (req, res) => {
  try {
    res.json({
      success: true,
      medications: testMedications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📋 Test users:');
  testUsers.forEach(user => {
    console.log(`  - ${user.username} (${user.role}) - password: ${user.password}`);
  });
  console.log('💊 Test medications available for search');
});
