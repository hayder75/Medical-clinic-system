const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const processPharmacyPaymentSchema = z.object({
  pharmacyInvoiceId: z.string(),
  amount: z.number(),
  type: z.enum(['CASH', 'BANK', 'INSURANCE', 'CREDIT', 'CHARITY']),
  bankName: z.string().optional(),
  transNumber: z.string().optional(),
  insuranceId: z.string().optional(),
  notes: z.string().optional(),
});

const dispenseMedicationSchema = z.object({
  pharmacyInvoiceId: z.string(),
  medicationOrderId: z.number(),
  status: z.enum(['DISPENSED', 'NOT_AVAILABLE', 'PARTIAL_DISPENSED']),
  quantity: z.number().optional(),
  notes: z.string().optional(),
});

const createInvoiceSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
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
        pharmacyInvoiceItems: true,
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

// Create pharmacy invoice from medication orders
exports.createPharmacyInvoice = async (req, res) => {
  try {
    const { visitId, patientId } = createInvoiceSchema.parse(req.body);
    
    // Check if invoice already exists for this visit
    const existingInvoice = await prisma.pharmacyInvoice.findFirst({
      where: { visitId, patientId }
    });
    
    if (existingInvoice) {
      return res.status(400).json({ 
        error: 'Pharmacy invoice already exists for this visit',
        invoiceId: existingInvoice.id
      });
    }
    
    // Get unpaid medication orders for this visit
    const medicationOrders = await prisma.medicationOrder.findMany({
      where: {
        visitId,
        patientId,
        status: 'UNPAID'
      },
      include: {
        medicationCatalog: true
      }
    });
    
    if (medicationOrders.length === 0) {
      return res.status(400).json({ 
        error: 'No unpaid medication orders found for this visit' 
      });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    const invoiceItems = [];
    
    for (const order of medicationOrders) {
      const unitPrice = order.medicationCatalog?.unitPrice || order.unitPrice || 0;
      const itemTotal = unitPrice * order.quantity;
      totalAmount += itemTotal;
      
      invoiceItems.push({
        medicationOrderId: order.id, // Add the medication order ID
        medicationCatalogId: order.medicationCatalogId,
        name: order.name,
        dosageForm: order.dosageForm,
        strength: order.strength,
        quantity: order.quantity,
        unitPrice,
        totalPrice: itemTotal,
        notes: order.instructions
      });
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create pharmacy invoice with items
    const pharmacyInvoice = await prisma.pharmacyInvoice.create({
      data: {
        patientId,
        visitId,
        type: 'DOCTOR_PRESCRIPTION',
        invoiceNumber,
        totalAmount,
        status: 'PENDING',
        pharmacyInvoiceItems: {
          create: invoiceItems
        }
      },
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
        pharmacyInvoiceItems: {
          include: {
            medicationCatalog: {
              select: {
                id: true,
                name: true,
                dosageForm: true,
                strength: true,
                unitPrice: true
              }
            }
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Pharmacy invoice created successfully',
      invoice: pharmacyInvoice
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get insurance companies
exports.getInsuranceCompanies = async (req, res) => {
  try {
    const insuranceCompanies = await prisma.insurance.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        contactInfo: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ insuranceCompanies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process pharmacy payment
exports.processPharmacyPayment = async (req, res) => {
  try {
    const { pharmacyInvoiceId, amount, type, bankName, transNumber, insuranceId, notes } = processPharmacyPaymentSchema.parse(req.body);
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

    // Update medication orders status to QUEUED for pharmacy dispensing
    await prisma.medicationOrder.updateMany({
      where: {
        visitId: invoice.visitId,
        patientId: invoice.patientId,
        status: 'UNPAID'
      },
      data: {
        status: 'QUEUED'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: processedBy,
        action: 'PROCESS_PHARMACY_PAYMENT',
        entity: 'PharmacyInvoice',
        entityId: 0, // AuditLog expects integer, using 0 for pharmacy invoices
        details: JSON.stringify({
          pharmacyInvoiceId,
          amount,
          type,
          bankName,
          transNumber,
          insuranceId,
          notes
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Update medication orders to QUEUED
    // Get the medication order IDs from the invoice items
    const invoiceItems = await prisma.pharmacyInvoiceItem.findMany({
      where: { pharmacyInvoiceId: pharmacyInvoiceId },
      select: { medicationOrderId: true }
    });
    
    const medicationOrderIds = invoiceItems
      .map(item => item.medicationOrderId)
      .filter(id => id !== null);
    
    if (medicationOrderIds.length > 0) {
      await prisma.medicationOrder.updateMany({
        where: {
          id: { in: medicationOrderIds },
          status: 'UNPAID'
        },
        data: { status: 'QUEUED' }
      });
    }

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
        medicationCatalogId: medicationOrder.medicationCatalogId,
        status,
        name: medicationOrder.name,
        dosageForm: medicationOrder.dosageForm,
        strength: medicationOrder.strength,
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
