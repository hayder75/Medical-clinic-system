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