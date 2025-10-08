const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const dentalRecordSchema = z.object({
  patientId: z.string(),
  visitId: z.number().optional(),
  doctorId: z.string().optional(),
  toothChart: z.record(z.string(), z.object({
    status: z.enum(['HEALTHY', 'DECAY', 'FILLED', 'ROOT_CANAL', 'MISSING', 'IMPACTED', 'EXTRACTED']),
    notes: z.string().optional(),
    surfaces: z.array(z.string()).optional()
  })).optional(),
  painFlags: z.record(z.string(), z.object({
    level: z.number().min(1).max(10),
    type: z.string()
  })).optional(),
  gumCondition: z.string().optional(),
  oralHygiene: z.string().optional(),
  treatmentPlan: z.record(z.string(), z.array(z.number())).optional(),
  notes: z.string().optional()
});

// Get all dentists (doctors with dental specialty)
exports.getDentists = async (req, res) => {
  try {
    const dentists = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        specialties: {
          has: 'Dentist'
        },
        availability: true
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        specialties: true,
        consultationFee: true
      }
    });

    res.json({ dentists });
  } catch (error) {
    console.error('Error fetching dentists:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get dental record for a patient
exports.getDentalRecord = async (req, res) => {
  try {
    const { patientId, visitId } = req.params;

    const dentalRecord = await prisma.dentalRecord.findFirst({
      where: {
        patientId,
        visitId: visitId ? parseInt(visitId) : undefined
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            dob: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true,
            specialties: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            date: true,
            status: true
          }
        }
      }
    });

    if (!dentalRecord) {
      return res.status(404).json({ error: 'Dental record not found' });
    }

    res.json({ dentalRecord });
  } catch (error) {
    console.error('Error fetching dental record:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create or update dental record
exports.saveDentalRecord = async (req, res) => {
  try {
    const data = dentalRecordSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if dental record exists
    const existingRecord = await prisma.dentalRecord.findFirst({
      where: {
        patientId: data.patientId,
        visitId: data.visitId
      }
    });

    let dentalRecord;

    if (existingRecord) {
      // Update existing record
      dentalRecord = await prisma.dentalRecord.update({
        where: { id: existingRecord.id },
        data: {
          ...data,
          doctorId,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              dob: true,
              gender: true
            }
          },
          doctor: {
            select: {
              id: true,
              fullname: true,
              specialties: true
            }
          }
        }
      });
    } else {
      // Create new record
      dentalRecord = await prisma.dentalRecord.create({
        data: {
          ...data,
          doctorId
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              dob: true,
              gender: true
            }
          },
          doctor: {
            select: {
              id: true,
              fullname: true,
              specialties: true
            }
          }
        }
      });
    }

    res.json({ dentalRecord });
  } catch (error) {
    console.error('Error saving dental record:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get dental history for a patient
exports.getDentalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const dentalHistory = await prisma.dentalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            id: true,
            fullname: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            date: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ dentalHistory });
  } catch (error) {
    console.error('Error fetching dental history:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get tooth information
exports.getToothInfo = async (req, res) => {
  try {
    const { toothNumber } = req.params;

    const tooth = await prisma.tooth.findFirst({
      where: { number: parseInt(toothNumber) }
    });

    if (!tooth) {
      return res.status(404).json({ error: 'Tooth information not found' });
    }

    res.json({ tooth });
  } catch (error) {
    console.error('Error fetching tooth info:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create dental lab/radiology order from tooth selection
exports.createDentalOrder = async (req, res) => {
  try {
    const { visitId, patientId, toothNumbers, orderType, instructions } = req.body;
    const doctorId = req.user.id;

    // Validate order type
    if (!['LAB', 'RADIOLOGY'].includes(orderType)) {
      return res.status(400).json({ error: 'Invalid order type. Must be LAB or RADIOLOGY' });
    }

    // Create batch order for dental procedure
    const batchOrder = await prisma.batchOrder.create({
      data: {
        visitId: parseInt(visitId),
        patientId,
        doctorId,
        type: orderType,
        instructions: `Dental ${orderType.toLowerCase()} for teeth: ${toothNumbers.join(', ')}. ${instructions || ''}`,
        status: 'UNPAID'
      }
    });

    // Add services to the batch order
    const services = [];
    for (const toothNumber of toothNumbers) {
      // Find appropriate investigation type based on order type
      let investigationType;
      if (orderType === 'RADIOLOGY') {
        investigationType = await prisma.investigationType.findFirst({
          where: {
            name: {
              contains: 'X-Ray',
              mode: 'insensitive'
            }
          }
        });
      } else {
        investigationType = await prisma.investigationType.findFirst({
          where: {
            name: {
              contains: 'Dental',
              mode: 'insensitive'
            }
          }
        });
      }

      if (investigationType) {
        const service = await prisma.batchOrderService.create({
          data: {
            batchOrderId: batchOrder.id,
            serviceId: investigationType.serviceId,
            investigationTypeId: investigationType.id,
            result: null,
            status: 'UNPAID'
          }
        });
        services.push(service);
      }
    }

    res.json({ 
      batchOrder, 
      services,
      message: `Dental ${orderType.toLowerCase()} order created for teeth: ${toothNumbers.join(', ')}`
    });
  } catch (error) {
    console.error('Error creating dental order:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
