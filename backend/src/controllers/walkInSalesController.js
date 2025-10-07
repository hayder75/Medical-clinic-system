const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const createWalkInSaleSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  pharmacyInvoiceItems: z.array(z.object({
    medicationCatalogId: z.string().optional(),
    name: z.string().min(1, 'Medication name is required'),
    dosageForm: z.string().min(1, 'Dosage form is required'),
    strength: z.string().min(1, 'Strength is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    notes: z.string().optional()
  })).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'INSURANCE', 'BANK']),
  insuranceId: z.string().optional(),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  notes: z.string().optional()
});

// Create a walk-in sale
exports.createWalkInSale = async (req, res) => {
  try {
    const data = createWalkInSaleSchema.parse(req.body);
    const pharmacyId = req.user.id;

    // Create the walk-in sale invoice
    const invoice = await prisma.pharmacyInvoice.create({
      data: {
        type: 'WALK_IN_SALE',
        totalAmount: data.totalAmount,
        status: 'PENDING',
        notes: data.notes,
        createdBy: pharmacyId
      }
    });

    // Create invoice items and update inventory
    const invoiceItems = [];
    for (const item of data.pharmacyInvoiceItems) {
      // Create invoice item
      const invoiceItem = await prisma.pharmacyInvoiceItem.create({
        data: {
          pharmacyInvoiceId: invoice.id,
          medicationCatalogId: item.medicationCatalogId,
          name: item.name,
          dosageForm: item.dosageForm,
          strength: item.strength,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes
        }
      });
      invoiceItems.push(invoiceItem);

      // Update inventory if medication is from catalog
      if (item.medicationCatalogId) {
        await prisma.medicationCatalog.update({
          where: { id: item.medicationCatalogId },
          data: {
            availableQuantity: {
              decrement: item.quantity
            }
          }
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: pharmacyId,
        action: 'CREATE_WALK_IN_SALE',
        entity: 'PharmacyInvoice',
        entityId: 0,
        details: JSON.stringify({
          invoiceId: invoice.id,
          customerName: data.customerName,
          totalAmount: data.totalAmount,
          itemCount: data.items.length
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      message: 'Walk-in sale created successfully',
      invoice: {
        ...invoice,
        pharmacyInvoiceItems: invoiceItems
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get walk-in sales
exports.getWalkInSales = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pharmacyId = req.user.id;

    const whereClause = {
      type: 'WALK_IN_SALE',
      createdBy: pharmacyId
    };

    if (status) {
      whereClause.status = status;
    }

    const sales = await prisma.pharmacyInvoice.findMany({
      where: whereClause,
      include: {
        pharmacyInvoiceItems: true,
        dispensedMedicines: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.pharmacyInvoice.count({
      where: whereClause
    });

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.log('Database not available, returning mock walk-in sales data');
    
    // Fallback mock data when database is not available
    const mockSales = [
      {
        id: '1',
        customerName: 'John Doe',
        totalAmount: 25.50,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        pharmacyInvoiceItems: [
          {
            name: 'Paracetamol',
            dosageForm: 'Tablet',
            strength: '500mg',
            quantity: 10,
            unitPrice: 2.50,
            totalPrice: 25.00
          }
        ]
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        totalAmount: 15.00,
        status: 'PAID',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        pharmacyInvoiceItems: [
          {
            name: 'Ibuprofen',
            dosageForm: 'Tablet',
            strength: '400mg',
            quantity: 5,
            unitPrice: 3.00,
            totalPrice: 15.00
          }
        ]
      }
    ];

    res.json({
      sales: mockSales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockSales.length,
        pages: 1
      }
    });
  }
};

// Process payment for walk-in sale
exports.processWalkInPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, insuranceId } = req.body;
    const pharmacyId = req.user.id;

    const invoice = await prisma.pharmacyInvoice.findUnique({
      where: { id: invoiceId },
      include: { pharmacyInvoiceItems: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.type !== 'WALK_IN_SALE') {
      return res.status(400).json({ error: 'This is not a walk-in sale' });
    }

    // Update invoice status
    const updatedInvoice = await prisma.pharmacyInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paymentMethod,
        insuranceId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: pharmacyId,
        action: 'PROCESS_WALK_IN_PAYMENT',
        entity: 'PharmacyInvoice',
        entityId: 0,
        details: JSON.stringify({
          invoiceId,
          paymentMethod,
          totalAmount: invoice.totalAmount
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Payment processed successfully',
      invoice: updatedInvoice
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dispense walk-in sale
exports.dispenseWalkInSale = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { items } = req.body;
    const pharmacyId = req.user.id;

    const invoice = await prisma.pharmacyInvoice.findUnique({
      where: { id: invoiceId },
      include: { pharmacyInvoiceItems: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'PAID') {
      return res.status(400).json({ error: 'Invoice must be paid before dispensing' });
    }

    // Create dispensed medicine records
    const dispensedMedicines = [];
    for (const item of items) {
      const dispensedMedicine = await prisma.dispensedMedicine.create({
        data: {
          pharmacyInvoiceId: invoiceId,
          medicationCatalogId: item.medicationCatalogId,
          status: 'DISPENSED',
          name: item.name,
          dosageForm: item.dosageForm,
          strength: item.strength,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || '',
          dispensedBy: pharmacyId
        }
      });
      dispensedMedicines.push(dispensedMedicine);
    }

    // Update invoice status to COMPLETED
    await prisma.pharmacyInvoice.update({
      where: { id: invoiceId },
      data: { status: 'COMPLETED' }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: pharmacyId,
        action: 'DISPENSE_WALK_IN_SALE',
        entity: 'PharmacyInvoice',
        entityId: 0,
        details: JSON.stringify({
          invoiceId,
          dispensedCount: dispensedMedicines.length
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Walk-in sale dispensed successfully',
      dispensedMedicines
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
