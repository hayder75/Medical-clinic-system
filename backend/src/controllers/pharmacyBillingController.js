const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const processPharmacyPaymentSchema = z.object({
  pharmacyInvoiceId: z.string(),
  amount: z.number(),
  type: z.enum(['CASH', 'BANK', 'INSURANCE', 'CREDIT', 'CHARITY']),
  bankName: z.string().optional(),
  transNumber: z.string().optional(),
  notes: z.string().optional(),
});

const dispenseMedicationSchema = z.object({
  pharmacyInvoiceId: z.string(),
  medicationOrderId: z.number(),
  status: z.enum(['DISPENSED', 'NOT_AVAILABLE', 'PARTIAL_DISPENSED']),
  quantity: z.number().optional(),
  notes: z.string().optional(),
});

// Get pharmacy invoices (billing queue)
exports.getPharmacyInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const invoices = await prisma.pharmacyInvoice.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true
          }
        },
        dispensedMedicines: {
          include: {
            medicationOrder: {
              select: {
                id: true,
                name: true,
                dosageForm: true,
                strength: true,
                quantity: true,
                instructions: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process pharmacy payment
exports.processPharmacyPayment = async (req, res) => {
  try {
    const { pharmacyInvoiceId, amount, type, bankName, transNumber, notes } = processPharmacyPaymentSchema.parse(req.body);
    const processedBy = req.user.id;

    // Get pharmacy invoice
    const invoice = await prisma.pharmacyInvoice.findUnique({
      where: { id: pharmacyInvoiceId },
      include: {
        patient: true,
        visit: {
          include: {
            medicationOrders: {
              where: { status: 'UNPAID' }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Pharmacy invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    // Update invoice status
    await prisma.pharmacyInvoice.update({
      where: { id: pharmacyInvoiceId },
      data: {
        status: 'PAID',
        processedBy,
        processedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: processedBy,
        action: 'PROCESS_PHARMACY_PAYMENT',
        entity: 'PharmacyInvoice',
        entityId: pharmacyInvoiceId,
        details: JSON.stringify({
          pharmacyInvoiceId,
          amount,
          type,
          bankName,
          transNumber,
          notes
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Update medication orders to QUEUED
    await prisma.medicationOrder.updateMany({
      where: {
        visitId: invoice.visitId,
        status: 'UNPAID'
      },
      data: { status: 'QUEUED' }
    });

    res.json({
      message: 'Pharmacy payment processed successfully',
      invoice: {
        id: invoice.id,
        totalAmount: invoice.totalAmount,
        status: 'PAID'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Dispense medication
exports.dispenseMedication = async (req, res) => {
  try {
    const { pharmacyInvoiceId, medicationOrderId, status, quantity, notes } = dispenseMedicationSchema.parse(req.body);
    const dispensedBy = req.user.id;

    // Check if invoice is paid
    const invoice = await prisma.pharmacyInvoice.findUnique({
      where: { id: pharmacyInvoiceId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Pharmacy invoice not found' });
    }

    if (invoice.status !== 'PAID') {
      return res.status(400).json({ error: 'Invoice must be paid before dispensing' });
    }

    // Get medication order
    const medicationOrder = await prisma.medicationOrder.findUnique({
      where: { id: medicationOrderId }
    });

    if (!medicationOrder) {
      return res.status(404).json({ error: 'Medication order not found' });
    }

    // Create dispensed medicine record
    const dispensedMedicine = await prisma.dispensedMedicine.create({
      data: {
        pharmacyInvoiceId,
        medicationOrderId,
        status,
        quantity: quantity || medicationOrder.quantity,
        notes,
        dispensedBy
      },
      include: {
        medicationOrder: {
          select: {
            id: true,
            name: true,
            dosageForm: true,
            strength: true,
            instructions: true
          }
        }
      }
    });

    // Update medication order status based on dispensed status
    let orderStatus = 'COMPLETED';
    if (status === 'NOT_AVAILABLE') {
      orderStatus = 'CANCELLED';
    } else if (status === 'PARTIAL_DISPENSED') {
      orderStatus = 'IN_PROGRESS';
    }

    await prisma.medicationOrder.update({
      where: { id: medicationOrderId },
      data: { status: orderStatus }
    });

    // Create medical history entry
    await prisma.medicalHistory.create({
      data: {
        patientId: invoice.patientId,
        details: JSON.stringify({
          type: 'MEDICATION_DISPENSE',
          pharmacyInvoiceId,
          medicationOrderId,
          medication: medicationOrder.name,
          status,
          quantity: quantity || medicationOrder.quantity,
          notes,
          dispensedAt: new Date(),
          dispensedBy: req.user.fullname
        })
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dispensedBy,
        action: 'DISPENSE_MEDICATION',
        entity: 'DispensedMedicine',
        entityId: dispensedMedicine.id,
        details: JSON.stringify({
          pharmacyInvoiceId,
          medicationOrderId,
          medication: medicationOrder.name,
          status,
          quantity: quantity || medicationOrder.quantity,
          notes
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Medication dispensed successfully',
      dispensedMedicine
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get dispensed medicines for a patient
exports.getDispensedMedicines = async (req, res) => {
  try {
    const { patientId, visitId } = req.query;
    
    let whereClause = {};
    if (patientId) {
      whereClause.pharmacyInvoice = {
        patientId
      };
    }
    if (visitId) {
      whereClause.pharmacyInvoice = {
        ...whereClause.pharmacyInvoice,
        visitId: parseInt(visitId)
      };
    }

    const dispensedMedicines = await prisma.dispensedMedicine.findMany({
      where: whereClause,
      include: {
        pharmacyInvoice: {
          select: {
            id: true,
            patientId: true,
            visitId: true,
            totalAmount: true,
            status: true
          }
        },
        medicationOrder: {
          select: {
            id: true,
            name: true,
            dosageForm: true,
            strength: true,
            quantity: true,
            instructions: true,
            visit: {
              select: {
                id: true,
                visitUid: true
              }
            }
          }
        }
      },
      orderBy: { dispensedAt: 'desc' }
    });

    res.json({ dispensedMedicines });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
