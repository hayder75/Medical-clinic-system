const prisma = require('../config/database');
const { z } = require('zod');
const PdfPrinter = require('pdfmake');
const fs = require('fs');

const fonts = {
  Roboto: {
    normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
    bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
  },
};

const printer = new PdfPrinter(fonts);

// Validation schemas
const paymentSchema = z.object({
  billingId: z.string(),
  amount: z.union([z.number(), z.string().transform(val => parseFloat(val))]),
  type: z.enum(['CASH', 'BANK', 'INSURANCE', 'CREDIT', 'CHARITY']),
  bankName: z.string().nullable().optional(),
  transNumber: z.string().nullable().optional(),
  insuranceId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const createBillingSchema = z.object({
  patientId: z.string(),
  visitId: z.number().optional(),
  insuranceId: z.string().optional(),
  services: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().positive().optional(),
  })),
  notes: z.string().optional(),
});

const addServiceToBillingSchema = z.object({
  billingId: z.string(),
  serviceId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive().optional(),
});

exports.registerPatient = async (req, res) => {
  try {
    const { name, type, dob, gender, mobile, email, address, emergencyContact, bloodType, maritalStatus, insuranceId } = req.body;
    
    const year = new Date().getFullYear();
    let id;
    
    if (type === 'EMERGENCY') {
      const lastTemp = await prisma.patient.findFirst({
        where: { id: { startsWith: `PAT-${year}-TEMP` } },
        orderBy: { id: 'desc' },
      });
      let tempNum = 1;
      if (lastTemp) {
        tempNum = parseInt(lastTemp.id.split('-')[3]) + 1;
      }
      id = `PAT-${year}-TEMP${tempNum.toString().padStart(2, '0')}`;
    } else {
      const lastPatient = await prisma.patient.findFirst({
        where: { id: { startsWith: `PAT-${year}-` } },
        orderBy: { id: 'desc' },
      });
      let nn = 1;
      if (lastPatient && !lastPatient.id.includes('TEMP')) {
        nn = parseInt(lastPatient.id.split('-')[2]) + 1;
      }
      id = `PAT-${year}-${nn.toString().padStart(2, '0')}`;
    }

    const patient = await prisma.patient.create({ 
      data: { 
        id, 
        name,
        type,
        dob: dob ? new Date(dob) : null,
        gender,
        mobile,
        email,
        address,
        emergencyContact,
        bloodType,
        maritalStatus,
        insuranceId,
        status: 'Active' 
      } 
    });

    // Create a visit record for tracking through the system
    const visitUid = `VISIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
    const visit = await prisma.visit.create({
      data: {
        visitUid: visitUid,
        patientId: patient.id,
        status: 'WAITING_FOR_TRIAGE',
        notes: `Patient registered via ${type === 'EMERGENCY' ? 'emergency' : 'regular'} registration`
      }
    });

    // Create entry fee billing for non-emergency patients
    let billing = null;
    if (type !== 'EMERGENCY') {
      try {
        // Find entry fee service
        const entryService = await prisma.service.findFirst({
          where: {
            code: 'ENTRY001',
            category: 'OTHER'
          }
        });

        if (entryService) {
          billing = await prisma.billing.create({
            data: {
              patientId: id,
              visitId: visit.id,
              insuranceId,
              totalAmount: entryService.price,
              status: 'PENDING',
              notes: `${type} patient entry fee`
            }
          });

          await prisma.billingService.create({
            data: {
              billingId: billing.id,
              serviceId: entryService.id,
              quantity: 1,
              unitPrice: entryService.price,
              totalPrice: entryService.price
            }
          });
        }
      } catch (error) {
        console.error('Error creating billing:', error);
      }
    }

    res.json({
      message: 'Patient registered successfully',
      patient,
      visit,
      billing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBilling = async (req, res) => {
  try {
    const { patientId, visitId, insuranceId, services, notes } = createBillingSchema.parse(req.body);
    
    // Get patient info to determine billing status
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { insurance: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const billingServices = [];

    for (const serviceData of services) {
      const service = await prisma.service.findUnique({
        where: { id: serviceData.serviceId }
      });

      if (!service) {
        return res.status(404).json({ error: `Service with ID ${serviceData.serviceId} not found` });
      }

      const unitPrice = serviceData.unitPrice || service.price;
      const totalPrice = unitPrice * serviceData.quantity;
      totalAmount += totalPrice;

      billingServices.push({
        serviceId: serviceData.serviceId,
        quantity: serviceData.quantity,
        unitPrice,
        totalPrice
      });
    }

    // Determine billing status based on patient type
    let billingStatus = 'PENDING';
    if (patient.type === 'EMERGENCY') {
      billingStatus = 'EMERGENCY_PENDING';
    } else if (patient.type === 'INSURANCE' && patient.insuranceId) {
      billingStatus = 'PENDING_INSURANCE';
    }
    
    const billing = await prisma.billing.create({ 
      data: {
        patientId,
        visitId,
        insuranceId,
        totalAmount,
        status: billingStatus,
        notes
      }
    });

    // Create billing services
    for (const serviceData of billingServices) {
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          ...serviceData
        }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_BILLING',
        entity: 'Billing',
        entityId: billing.id,
        details: JSON.stringify({
          patientId: billing.patientId,
          visitId: billing.visitId,
          totalAmount: billing.totalAmount,
          status: billing.status,
          services: billingServices
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    const billingWithServices = await prisma.billing.findUnique({
      where: { id: billing.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        insurance: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    res.json({
      message: 'Billing created successfully',
      billing: billingWithServices
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInsurances = async (req, res) => {
  try {
    const insurances = await prisma.insurance.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ insurances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    console.log('Payment request body:', JSON.stringify(req.body, null, 2));
    // Remove Zod validation completely for testing
    const { billingId, amount, type, bankName, transNumber, insuranceId, notes } = req.body;
    
    // Convert amount to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    console.log('Amount conversion:', { original: amount, converted: numericAmount });

    // Get billing with all related data
    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: { 
        patient: true, 
        services: {
          include: {
            service: true
          }
        },
        payments: true,
        visit: {
          include: {
            labOrders: true,
            radiologyOrders: true,
            medicationOrders: true
          }
        },
        insurance: true
      }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    if (billing.status === 'PAID') {
      return res.status(400).json({ error: 'Billing already paid' });
    }

    // For entry fees, we only allow one payment of the full amount
    if (billing.payments.length > 0) {
      return res.status(400).json({ error: 'Billing already has a payment' });
    }

    // For entry fees, payment amount should match the total amount
    if (numericAmount !== billing.totalAmount) {
      return res.status(400).json({ error: `Payment amount must be exactly ${billing.totalAmount} ETB` });
    }

    // Create payment
    const payment = await prisma.billPayment.create({
      data: {
        billingId,
        patientId: billing.patientId,
        amount: numericAmount,
        type,
        bankName,
        transNumber,
        insuranceId,
        notes
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PROCESS_PAYMENT',
        entity: 'BillPayment',
        entityId: 0, // Using 0 as placeholder since entityId expects int
        details: JSON.stringify({
          billingId,
          patientId: billing.patientId,
          paymentId: payment.id,
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

    // Check if billing is fully paid
    const newTotalPaid = numericAmount; // For entry fees, this is the only payment
    const isFullyPaid = newTotalPaid >= billing.totalAmount;

    if (isFullyPaid) {
      // Update billing status to PAID
      await prisma.billing.update({ 
        where: { id: billingId }, 
        data: { status: 'PAID' } 
      });

      // Update related orders based on billing type
      if (billing.visit) {
        await prisma.$transaction(async (tx) => {
          // Check if this is diagnostics billing (lab/radiology)
          // Look for lab/radiology services in the billing
          const hasLabServices = billing.services.some(service => 
            service.service.category === 'LAB'
          );
          const hasRadiologyServices = billing.services.some(service => 
            service.service.category === 'RADIOLOGY'
          );
          const isDiagnosticsBilling = hasLabServices || hasRadiologyServices;

          if (isDiagnosticsBilling) {
            // Update batch orders (new system)
            await tx.batchOrder.updateMany({
              where: {
                visitId: billing.visit.id,
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });

            // Update batch order services
            await tx.batchOrderService.updateMany({
              where: {
                batchOrder: {
                  visitId: billing.visit.id
                },
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });

            // Also update old individual orders for backward compatibility
            await tx.labOrder.updateMany({
              where: {
                visitId: billing.visit.id,
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });

            await tx.radiologyOrder.updateMany({
              where: {
                visitId: billing.visit.id,
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });
          } else {
            // This is medication billing
            // Update medication orders
            await tx.medicationOrder.updateMany({
              where: {
                visitId: billing.visit.id,
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });

            // Update continuous infusion status
            await tx.continuousInfusion.updateMany({
              where: {
                medicationOrder: {
                  visitId: billing.visit.id
                },
                status: 'UNPAID'
              },
              data: { status: 'QUEUED' }
            });
          }
        });
      }
    }

    // Generate PDF receipt
    const docDefinition = {
      content: [
        { text: 'Payment Receipt', style: 'header' },
        { text: `Patient: ${billing.patient.name} (${billing.patient.id})`, margin: [0, 10] },
        { text: `Billing Total: ${billing.totalAmount} ETB`, margin: [0, 5] },
        { text: `Amount Paid: ${numericAmount} ETB`, margin: [0, 5] },
        { text: `Payment Type: ${type}`, margin: [0, 5] },
        { text: bankName ? `Bank: ${bankName}, Transaction: ${transNumber}` : '', margin: [0, 5] },
        { text: `Remaining Balance: ${billing.totalAmount - newTotalPaid} ETB`, margin: [0, 5] },
        { text: 'Services:', margin: [0, 10] },
        { ul: billing.services.map(bs => `${bs.service.name} (${bs.quantity}x): ${bs.totalPrice} ETB`) },
      ],
      styles: { header: { fontSize: 18, bold: true } },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const filePath = `uploads/receipt-${billingId}-${Date.now()}.pdf`;
    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.end();

    res.json({ 
      message: 'Payment processed successfully',
      payment,
      billingStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      remainingBalance: billing.totalAmount - newTotalPaid,
      receiptUrl: `/uploads/receipt-${billingId}-${Date.now()}.pdf`
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getBillings = async (req, res) => {
  try {
    const { status, patientId, visitId } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    if (visitId) {
      whereClause.visitId = parseInt(visitId);
    }

    const billings = await prisma.billing.findMany({
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
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true,
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true
          }
        },
        insurance: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ billings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnpaidBillings = async (req, res) => {
  try {
    const { type } = req.query; // 'diagnostics' or 'medications'
    
    let whereClause = { status: 'PENDING' };
    
    if (type === 'diagnostics') {
      whereClause.notes = {
        contains: 'diagnostics'
      };
    } else if (type === 'medications') {
      whereClause.notes = {
        contains: 'medication'
      };
    }

    const billings = await prisma.billing.findMany({
      where: whereClause,
      include: { 
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true
          } 
        },
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true,
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true
          }
        },
        insurance: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ billings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addServiceToBilling = async (req, res) => {
  try {
    const { billingId, serviceId, quantity, unitPrice } = addServiceToBillingSchema.parse(req.body);

    // Check if billing exists
    const billing = await prisma.billing.findUnique({
      where: { id: billingId }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    if (billing.status === 'PAID') {
      return res.status(400).json({ error: 'Cannot add services to paid billing' });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const finalUnitPrice = unitPrice || service.price;
    const totalPrice = finalUnitPrice * quantity;

    // Check if service already exists in billing
    const existingBillingService = await prisma.billingService.findUnique({
      where: {
        billingId_serviceId: {
          billingId,
          serviceId
        }
      }
    });

    if (existingBillingService) {
      // Update existing service
      await prisma.billingService.update({
        where: {
          billingId_serviceId: {
            billingId,
            serviceId
          }
        },
        data: {
          quantity: existingBillingService.quantity + quantity,
          totalPrice: existingBillingService.totalPrice + totalPrice
        }
      });
    } else {
      // Create new billing service
      await prisma.billingService.create({
        data: {
          billingId,
          serviceId,
          quantity,
          unitPrice: finalUnitPrice,
          totalPrice
        }
      });
    }

    // Update billing total amount
    const newTotalAmount = billing.totalAmount + totalPrice;
    await prisma.billing.update({
      where: { id: billingId },
      data: { totalAmount: newTotalAmount }
    });

    res.json({
      message: 'Service added to billing successfully',
      billingId,
      serviceId,
      quantity,
      totalPrice
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmergencyPatientId = async (req, res) => {
  try {
    const { tempId } = req.body;
    const year = new Date().getFullYear();
    const lastPatient = await prisma.patient.findFirst({
      where: { id: { startsWith: `PAT-${year}-` } },
      orderBy: { id: 'desc' },
    });
    let nn = 1;
    if (lastPatient && !lastPatient.id.includes('TEMP')) {
      nn = parseInt(lastPatient.id.split('-')[2]) + 1;
    }
    const newId = `PAT-${year}-${nn.toString().padStart(2, '0')}`;
    const patient = await prisma.patient.update({ where: { id: tempId }, data: { id: newId } });
    res.json({
      message: 'Patient ID updated successfully',
      patient
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get insurance pending billings
exports.getInsuranceBillings = async (req, res) => {
  try {
    const billings = await prisma.billing.findMany({
      where: { status: 'PENDING_INSURANCE' },
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
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        insurance: {
          select: {
            name: true,
            code: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ billings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get emergency pending billings
exports.getEmergencyBillings = async (req, res) => {
  try {
    const billings = await prisma.billing.findMany({
      where: { status: 'EMERGENCY_PENDING' },
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
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ billings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process insurance payment
exports.processInsurancePayment = async (req, res) => {
  try {
    const { billingId, amount, notes } = req.body;

    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: { patient: true }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    if (billing.status !== 'PENDING_INSURANCE') {
      return res.status(400).json({ error: 'Billing is not pending insurance' });
    }

    // Update billing status
    await prisma.billing.update({
      where: { id: billingId },
      data: { status: 'INSURANCE_CLAIMED' }
    });

    // Create payment record
    await prisma.billPayment.create({
      data: {
        billingId,
        patientId: billing.patientId,
        amount,
        type: 'INSURANCE',
        notes: notes || 'Insurance payment processed'
      }
    });

    res.json({
      message: 'Insurance payment processed successfully',
      billing: {
        id: billing.id,
        status: 'INSURANCE_CLAIMED'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process emergency payment
exports.processEmergencyPayment = async (req, res) => {
  try {
    const { billingId, amount, type, notes } = req.body;

    const billing = await prisma.billing.findUnique({
      where: { id: billingId },
      include: { patient: true }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    if (billing.status !== 'EMERGENCY_PENDING') {
      return res.status(400).json({ error: 'Billing is not emergency pending' });
    }

    // Update billing status
    await prisma.billing.update({
      where: { id: billingId },
      data: { status: 'PAID' }
    });

    // Create payment record
    await prisma.billPayment.create({
      data: {
        billingId,
        patientId: billing.patientId,
        amount,
        type: type || 'CASH',
        notes: notes || 'Emergency payment processed'
      }
    });

    res.json({
      message: 'Emergency payment processed successfully',
      billing: {
        id: billing.id,
        status: 'PAID'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};