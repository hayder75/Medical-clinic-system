const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const addEmergencyServiceSchema = z.object({
  visitId: z.number().int().positive(),
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional()
});

const acknowledgeEmergencyPaymentSchema = z.object({
  billingId: z.string().uuid(),
  notes: z.string().optional()
});

// Get or create emergency billing for a visit
async function getOrCreateEmergencyBilling(visitId) {
  try {
    // Check if emergency billing already exists
    let emergencyBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        billingType: 'EMERGENCY',
        status: 'EMERGENCY_PENDING'
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!emergencyBilling) {
      // Get visit details
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: { patient: true }
      });

      if (!visit) {
        throw new Error('Visit not found');
      }

      if (!visit.isEmergency) {
        throw new Error('Visit is not marked as emergency');
      }

      // Create new emergency billing
      emergencyBilling = await prisma.billing.create({
        data: {
          patientId: visit.patientId,
          visitId: visitId,
          totalAmount: 0,
          status: 'EMERGENCY_PENDING',
          billingType: 'EMERGENCY',
          notes: 'Emergency services - payment deferred'
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });

      console.log(`✅ Created emergency billing ${emergencyBilling.id} for visit ${visitId}`);
    }

    return emergencyBilling;
  } catch (error) {
    console.error('Error in getOrCreateEmergencyBilling:', error);
    throw error;
  }
}

// Add service to emergency billing
exports.addEmergencyService = async (req, res) => {
  try {
    const validatedData = addEmergencyServiceSchema.parse(req.body);
    const userId = req.user.id;

    // Get or create emergency billing
    const emergencyBilling = await getOrCreateEmergencyBilling(validatedData.visitId);

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.isActive) {
      return res.status(400).json({ error: 'Service is not active' });
    }

    // Check if service already exists in billing
    const existingService = await prisma.billingService.findFirst({
      where: {
        billingId: emergencyBilling.id,
        serviceId: validatedData.serviceId
      }
    });

    let billingService;
    if (existingService) {
      // Update quantity
      billingService = await prisma.billingService.update({
        where: { id: existingService.id },
        data: {
          quantity: existingService.quantity + validatedData.quantity,
          totalPrice: (existingService.quantity + validatedData.quantity) * service.price
        }
      });
    } else {
      // Create new service entry
      billingService = await prisma.billingService.create({
        data: {
          billingId: emergencyBilling.id,
          serviceId: validatedData.serviceId,
          quantity: validatedData.quantity,
          unitPrice: service.price,
          totalPrice: validatedData.quantity * service.price
        }
      });
    }

    // Update total amount
    const allServices = await prisma.billingService.findMany({
      where: { billingId: emergencyBilling.id }
    });

    const totalAmount = allServices.reduce((sum, service) => sum + service.totalPrice, 0);

    await prisma.billing.update({
      where: { id: emergencyBilling.id },
      data: { totalAmount }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'EMERGENCY_SERVICE_ADDED',
        entity: 'BillingService',
        entityId: billingService.id,
        userId: userId,
        details: `Added ${validatedData.quantity}x ${service.name} (${service.code}) to emergency billing for visit ${validatedData.visitId}. Total: ETB ${billingService.totalPrice}`
      }
    });

    res.json({
      billingService,
      totalAmount,
      message: `Service added successfully. New total: ETB ${totalAmount}`
    });
  } catch (error) {
    console.error('Error adding emergency service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get emergency billing for a visit
exports.getEmergencyBilling = async (req, res) => {
  try {
    const { visitId } = req.params;
    const visitIdNum = parseInt(visitId);

    if (isNaN(visitIdNum)) {
      return res.status(400).json({ error: 'Invalid visit ID' });
    }

    const emergencyBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitIdNum,
        billingType: 'EMERGENCY'
      },
      include: {
        patient: true,
        visit: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!emergencyBilling) {
      return res.status(404).json({ error: 'No emergency billing found for this visit' });
    }

    res.json(emergencyBilling);
  } catch (error) {
    console.error('Error getting emergency billing:', error);
    res.status(500).json({ error: error.message });
  }
};

// Acknowledge emergency payment (mark as accepted)
exports.acknowledgeEmergencyPayment = async (req, res) => {
  try {
    const validatedData = acknowledgeEmergencyPaymentSchema.parse(req.body);
    const userId = req.user.id;

    // Get the billing record
    const billing = await prisma.billing.findUnique({
      where: { id: validatedData.billingId },
      include: {
        patient: true,
        visit: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Emergency billing not found' });
    }

    if (billing.billingType !== 'EMERGENCY') {
      return res.status(400).json({ error: 'This is not an emergency billing record' });
    }

    if (billing.status === 'PAID') {
      return res.status(400).json({ error: 'Payment already acknowledged' });
    }

    // Update billing status to PAID
    await prisma.billing.update({
      where: { id: validatedData.billingId },
      data: {
        status: 'PAID',
        notes: validatedData.notes || billing.notes
      }
    });

    // Update visit status to COMPLETED
    await prisma.visit.update({
      where: { id: billing.visitId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'EMERGENCY_PAYMENT_ACKNOWLEDGED',
        entity: 'Billing',
        entityId: 0, // billingId is string UUID, entityId expects int
        userId: userId,
        details: `Emergency payment acknowledged for patient ${billing.patient.name} (${billing.patient.id}). Total amount: ETB ${billing.totalAmount}. Notes: ${validatedData.notes || 'None'}`
      }
    });

    res.json({
      message: 'Emergency payment acknowledged successfully',
      billing: {
        id: billing.id,
        status: 'PAID',
        totalAmount: billing.totalAmount
      }
    });
  } catch (error) {
    console.error('Error acknowledging emergency payment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all emergency patients with their billing
exports.getEmergencyPatients = async (req, res) => {
  try {
    const emergencyBillings = await prisma.billing.findMany({
      where: {
        billingType: 'EMERGENCY',
        status: { in: ['EMERGENCY_PENDING', 'PAID'] }
      },
      include: {
        patient: true,
        visit: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(emergencyBillings);
  } catch (error) {
    console.error('Error getting emergency patients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get emergency dashboard stats
exports.getEmergencyStats = async (req, res) => {
  try {
    const stats = await prisma.billing.groupBy({
      by: ['status'],
      where: {
        billingType: 'EMERGENCY'
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    const totalStats = await prisma.billing.aggregate({
      where: {
        billingType: 'EMERGENCY'
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      stats: stats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalAmount: stat._sum.totalAmount || 0
      })),
      total: {
        count: totalStats._count.id,
        totalAmount: totalStats._sum.totalAmount || 0
      }
    });
  } catch (error) {
    console.error('Error getting emergency stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export the helper function for use in other controllers
exports.getOrCreateEmergencyBilling = getOrCreateEmergencyBilling;

module.exports = exports;
