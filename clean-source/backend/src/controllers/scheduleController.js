const prisma = require('../config/database');

exports.toggleAvailability = async (req, res) => {
  try {
    const { userId, availability } = req.body;
    const user = await prisma.user.update({ where: { id: userId }, data: { availability } });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: { patient: { select: { id: true, name: true } } },
    });
    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};