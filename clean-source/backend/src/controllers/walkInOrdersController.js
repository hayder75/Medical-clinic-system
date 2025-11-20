const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create a walk-in lab order for an outsider (non-patient)
 */
const createWalkInLabOrder = async (req, res) => {
  try {
    const { name, phone, testTypes, serviceIds, notes } = req.body;
    const services = serviceIds || testTypes; // Support both
    
    // Generate unique ID: LAB-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Get today's unique ID
    let outsiderId;
    let attempt = 1;
    let patient;
    
    do {
      const todaysLabOrders = await prisma.labOrder.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
            isWalkIn: true
          }
        });
      
      outsiderId = `LAB-${dateStr}-${String(todaysLabOrders + attempt).padStart(3, '0')}`;
      
      // Check if patient ID already exists
      const existing = await prisma.patient.findUnique({
        where: { id: outsiderId }
      });
      
      if (!existing) {
        // Create "patient" (outsider)
        patient = await prisma.patient.create({
          data: {
            id: outsiderId,
            name,
            mobile: phone,
            type: 'REGULAR',
            status: 'Active',
            cardStatus: 'INACTIVE'
          }
        });
        break;
      }
      attempt++;
    } while (true);
    
    // Create billing record for walk-in services
    const serviceList = await prisma.service.findMany({
      where: { id: { in: services } }
    });
    
    if (serviceList.length === 0) {
      return res.status(404).json({ message: 'No valid services found' });
    }
    
    const totalAmount = serviceList.reduce((sum, service) => sum + service.price, 0);
    
    const billing = await prisma.billing.create({
      data: {
        patientId: outsiderId,
        totalAmount: totalAmount,
        status: 'PENDING',
        notes: notes || 'Walk-in lab order',
        services: {
          create: serviceList.map(service => ({
            serviceId: service.id,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price
          }))
        }
      },
      include: { services: { include: { service: true } } }
    });
    
    // Create lab orders and link to billing
    const createdOrders = [];
    for (const serviceId of services) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { investigationTypes: true }
      });
      
      if (service && service.investigationTypes.length > 0) {
        const investigationType = service.investigationTypes[0];
        
        const labOrder = await prisma.labOrder.create({
          data: {
            patientId: outsiderId,
            typeId: investigationType.id,
            instructions: notes,
            isWalkIn: true,
            status: 'UNPAID',
            billingId: billing.id
          }
        });
        
        createdOrders.push(labOrder);
      }
    }
    
    res.status(201).json({
      success: true,
      outsider: patient,
      billing,
      orders: createdOrders,
      message: 'Walk-in lab order created successfully'
    });
    
  } catch (error) {
    console.error('Error creating walk-in lab order:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a walk-in radiology order for an outsider (non-patient)
 */
const createWalkInRadiologyOrder = async (req, res) => {
  try {
    const { name, phone, testTypes, notes } = req.body;
    
    // Generate unique ID: RAD-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Get today's unique ID
    let outsiderId;
    let attempt = 1;
    let patient;
    
    do {
      const todaysRadOrders = await prisma.radiologyOrder.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          isWalkIn: true
        }
      });
      
      outsiderId = `RAD-${dateStr}-${String(todaysRadOrders + attempt).padStart(3, '0')}`;
      
      // Check if patient ID already exists
      const existing = await prisma.patient.findUnique({
        where: { id: outsiderId }
      });
      
      if (!existing) {
        // Create "patient" (outsider)
        patient = await prisma.patient.create({
          data: {
            id: outsiderId,
            name,
            mobile: phone,
            type: 'REGULAR',
            status: 'Active',
            cardStatus: 'INACTIVE'
          }
        });
        break;
      }
      attempt++;
    } while (true);
    
    // Create radiology orders
    const createdOrders = [];
    for (const testTypeId of testTypes) {
      const investigationType = await prisma.investigationType.findUnique({
        where: { id: testTypeId }
      });
      
      if (!investigationType) {
        return res.status(404).json({ message: `Test type ${testTypeId} not found` });
      }
      
      const radiologyOrder = await prisma.radiologyOrder.create({
        data: {
          patientId: outsiderId,
          typeId: testTypeId,
          instructions: notes,
          isWalkIn: true,
          status: 'UNPAID'
        }
      });
      
      createdOrders.push(radiologyOrder);
    }
    
    res.status(201).json({
      success: true,
      outsider: patient,
      orders: createdOrders,
      message: 'Walk-in radiology order created successfully'
    });
    
  } catch (error) {
    console.error('Error creating walk-in radiology order:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWalkInLabOrder,
  createWalkInRadiologyOrder
};
