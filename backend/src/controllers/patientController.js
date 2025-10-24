const prisma = require('../config/database');
const validators = require('../utils/validators');

exports.getPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, type: true, status: true },
    });
    res.json(patients);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { vitals: true, history: true, appointments: true, files: true },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Search patients by various criteria
exports.searchPatients = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const searchTerm = query.trim();
    let whereClause = {
      status: 'Active'
    };

    // Build search conditions based on search type
    if (type === 'id') {
      whereClause.id = {
        contains: searchTerm,
        mode: 'insensitive'
      };
    } else if (type === 'phone') {
      whereClause.mobile = {
        contains: searchTerm,
        mode: 'insensitive'
      };
    } else {
      // Default to name search or general search
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          id: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          mobile: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Search patients directly
    let patients = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        type: true,
        mobile: true,
        email: true,
        dob: true,
        gender: true,
        bloodType: true,
        status: true,
        cardStatus: true,
        cardActivatedAt: true,
        cardExpiryDate: true,
        createdAt: true
      },
      orderBy: { name: 'asc' },
      take: 20
    });

    // If no patients found, try searching by visit ID
    if (patients.length === 0) {
      const visits = await prisma.visit.findMany({
        where: {
          visitUid: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              type: true,
              mobile: true,
              email: true,
              dob: true,
              gender: true,
              bloodType: true,
              status: true,
              cardStatus: true,
              cardActivatedAt: true,
              cardExpiryDate: true,
              createdAt: true
            }
          }
        },
        take: 20
      });

      patients = visits.map(visit => visit.patient).filter(patient => patient.status === 'Active');
    }


    res.json({ 
      patients,
      count: patients.length,
      query: searchTerm,
      type: type || 'general'
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get patient with recent visits for returning patient workflow
exports.getPatientForVisit = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        type: true,
        mobile: true,
        email: true,
        dob: true,
        gender: true,
        bloodType: true,
        maritalStatus: true,
        address: true,
        emergencyContact: true,
        insuranceId: true,
        status: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get recent visits (last 5)
    const recentVisits = await prisma.visit.findMany({
      where: { patientId },
      select: {
        id: true,
        visitUid: true,
        status: true,
        createdAt: true,
        completedAt: true,
        notes: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      patient,
      recentVisits,
      message: 'Patient found successfully'
    });
  } catch (error) {
    console.error('Error getting patient for visit:', error);
    res.status(500).json({ error: error.message });
  }
};