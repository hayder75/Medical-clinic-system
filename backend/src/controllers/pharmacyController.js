const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const dispenseSchema = z.object({
  orderId: z.number(),
  quantity: z.number(),
  notes: z.string().optional(),
});

const registerMedicationSchema = z.object({
  name: z.string(),
  dosageForm: z.string(),
  strength: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  supplier: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.medicationOrder.findMany({
      where: { status: 'QUEUED' },
      include: { 
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true
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
            status: true
          }
        },
        continuousInfusion: {
          include: {
            nurseTasks: {
              where: {
                completed: false
              },
              take: 1
            }
          }
        },
        dispenseLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });

    // Filter out orders that are continuous infusion and not ready for dispensing
    const filteredOrders = orders.filter(order => {
      if (order.continuousInfusion) {
        // For CSI orders, only show if they have pending nurse tasks
        return order.continuousInfusion.nurseTasks.length > 0;
      }
      return true; // Regular orders are always shown
    });

    res.json({ orders: filteredOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.dispense = async (req, res) => {
  try {
    const { orderId, quantity, notes } = dispenseSchema.parse(req.body);
    const pharmacyId = req.user.id;

    // Check if order exists and is in correct status
    const order = await prisma.medicationOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: true,
        visit: true,
        continuousInfusion: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Medication order not found' });
    }

    if (order.status !== 'QUEUED') {
      return res.status(400).json({ error: 'Order is not in queue for dispensing' });
    }

    // Check inventory availability
    const inventoryItem = await prisma.inventory.findFirst({ 
      where: { 
        name: { contains: order.name, mode: 'insensitive' },
        service: {
          category: 'MEDICATION'
        }
      },
      include: {
        service: true
      }
    });

    if (inventoryItem) {
      // Check if sufficient quantity is available
      if (inventoryItem.quantity < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient inventory', 
          available: inventoryItem.quantity,
          requested: quantity,
          medication: order.name
        });
      }
    } else {
      // If no inventory item found, check if medication is available in general
      const generalInventory = await prisma.inventory.findFirst({
        where: {
          name: { contains: order.name, mode: 'insensitive' }
        }
      });

      if (!generalInventory) {
        return res.status(400).json({ 
          error: 'Medication not available in inventory',
          medication: order.name
        });
      }
    }


    // Create dispense log
    const dispenseLog = await prisma.dispenseLog.create({
      data: { 
        orderId, 
        patientId: order.patientId,
        quantity, 
        notes, 
        pharmacyId 
      },
      include: {
        pharmacy: {
          select: {
            id: true,
            fullname: true
          }
        }
      }
    });

    // Update inventory if item exists
    if (inventoryItem) {
      await prisma.inventory.update({ 
        where: { id: inventoryItem.id }, 
        data: { quantity: { decrement: quantity } } 
      });
    }

    // Update order status to COMPLETED
    await prisma.medicationOrder.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    });

    // Create medical history entry
    await prisma.medicalHistory.create({
      data: {
        patientId: order.patientId,
        details: JSON.stringify({ 
          type: 'MEDICATION_DISPENSE',
          orderId: order.id,
          medication: order.name,
          serviceCode: inventoryItem?.service?.code,
          serviceName: inventoryItem?.service?.name,
          quantity: quantity,
          notes: notes,
          dispensedAt: new Date(),
          dispensedBy: pharmacyId
        })
      }
    });

    res.json({
      message: 'Medication dispensed successfully',
      dispenseLog
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDispenseHistory = async (req, res) => {
  try {
    const { patientId, orderId } = req.query;
    
    let whereClause = {};
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    if (orderId) {
      whereClause.orderId = parseInt(orderId);
    }

    const dispenseLogs = await prisma.dispenseLog.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            name: true,
            dosageForm: true,
            strength: true,
            visit: {
              select: {
                id: true,
                visitUid: true
              }
            }
          }
        },
        pharmacy: {
          select: {
            id: true,
            fullname: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ dispenseLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register new medication (for pharmacy billing officers)
exports.registerMedication = async (req, res) => {
  try {
    const data = registerMedicationSchema.parse(req.body);
    const pharmacyId = req.user.id;

    // Check if medication already exists
    const existingMedication = await prisma.inventory.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        strength: data.strength,
        dosageForm: data.dosageForm
      }
    });

    if (existingMedication) {
      return res.status(400).json({ 
        error: 'Medication already exists in inventory',
        existing: {
          id: existingMedication.id,
          name: existingMedication.name,
          strength: existingMedication.strength,
          quantity: existingMedication.quantity
        }
      });
    }

    // Create service for the medication
    const service = await prisma.service.create({
      data: {
        code: `MED-${Date.now()}`, // Generate unique code
        name: data.name,
        category: 'MEDICATION',
        price: data.price,
        description: `${data.name} ${data.strength} ${data.dosageForm}`
      }
    });

    // Create inventory item
    const inventoryItem = await prisma.inventory.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        category: data.dosageForm,
        dosageForm: data.dosageForm,
        strength: data.strength,
        price: data.price,
        supplier: data.supplier,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        serviceId: service.id,
        notes: data.notes
      },
      include: {
        service: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: pharmacyId,
        action: 'REGISTER_MEDICATION',
        entity: 'Inventory',
        entityId: inventoryItem.id,
        details: JSON.stringify({
          name: data.name,
          dosageForm: data.dosageForm,
          strength: data.strength,
          quantity: data.quantity,
          price: data.price,
          serviceId: service.id
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      message: 'Medication registered successfully',
      inventoryItem,
      service
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get inventory for pharmacy
exports.getInventory = async (req, res) => {
  try {
    const { lowStock, category } = req.query;
    
    let whereClause = {
      service: {
        category: 'MEDICATION'
      }
    };
    
    if (lowStock === 'true') {
      whereClause.quantity = { lt: 10 };
    }
    
    if (category) {
      whereClause.category = category;
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};