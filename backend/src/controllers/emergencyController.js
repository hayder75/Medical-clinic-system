const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create emergency drug order (doctor side)
 */
exports.createEmergencyDrugOrder = async (req, res) => {
  try {
    const { visitId, patientId, serviceId, quantity, instructions, notes } = req.body;
    const doctorId = req.user.id;

    if (!patientId || !serviceId) {
      return res.status(400).json({ error: 'Patient ID and Service ID are required' });
    }

    // Validate service is EMERGENCY_DRUG category
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.category !== 'EMERGENCY_DRUG') {
      return res.status(400).json({ error: 'Service must be EMERGENCY_DRUG category' });
    }

    // Validate visit if provided
    if (visitId) {
      const visit = await prisma.visit.findUnique({
        where: { id: visitId }
      });
      if (!visit) {
        return res.status(404).json({ error: 'Visit not found' });
      }
    }

    // Create emergency drug order
    const order = await prisma.emergencyDrugOrder.create({
      data: {
        visitId: visitId || null,
        patientId,
        doctorId,
        serviceId,
        quantity: quantity || 1,
        instructions,
        notes,
        status: 'UNPAID'
      },
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // Check for existing PENDING billing for this visit/patient and add to it, or create new one
    const totalAmount = service.price * (quantity || 1);
    let billing = await prisma.billing.findFirst({
      where: {
        patientId,
        visitId: visitId || null,
        status: 'PENDING'
      },
      include: {
        services: true
      }
    });

    if (billing) {
      // Add service to existing billing
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: service.id,
          quantity: quantity || 1,
          unitPrice: service.price,
          totalPrice: totalAmount
        }
      });

      // Update billing total
      billing = await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: {
            increment: totalAmount
          },
          notes: billing.notes ? `${billing.notes}; Emergency drug: ${service.name}` : `Emergency drug: ${service.name}`
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });
    } else {
      // Create new billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId: visitId || null,
          totalAmount,
          status: 'PENDING',
          notes: `Emergency drug: ${service.name}`,
          services: {
            create: {
              serviceId: service.id,
              quantity: quantity || 1,
              unitPrice: service.price,
              totalPrice: totalAmount
            }
          }
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });
    }

    // Link order to billing
    await prisma.emergencyDrugOrder.update({
      where: { id: order.id },
      data: { billingId: billing.id }
    });

    res.status(201).json({
      success: true,
      order: {
        ...order,
        billingId: billing.id
      },
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount,
        status: billing.status
      },
      message: 'Emergency drug order created successfully'
    });
  } catch (error) {
    console.error('Error creating emergency drug order:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get emergency drug orders for doctor
 */
exports.getEmergencyDrugOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, visitId } = req.query;

    const where = {};

    // For doctors, show orders for the visit (don't filter by doctorId since doctor might not be assigned yet for triage)
    // If visitId is provided, show all orders for that visit; otherwise filter by doctorId
    if (userRole === 'DOCTOR') {
      if (visitId) {
        // For specific visit, show all orders for that visit (for triage patients)
        where.visitId = parseInt(visitId);
      } else {
        // If no visitId, filter by doctorId
        where.doctorId = userId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (visitId && userRole !== 'DOCTOR') {
      where.visitId = parseInt(visitId);
    }

    const orders = await prisma.emergencyDrugOrder.findMany({
      where,
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching emergency drug orders:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Complete emergency drug order
 */
exports.completeEmergencyDrugOrder = async (req, res) => {
  try {
    const { orderId, notes } = req.body;
    const doctorId = req.user.id;

    const order = await prisma.emergencyDrugOrder.findUnique({
      where: { id: orderId },
      include: {
        service: true,
        patient: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Emergency drug order not found' });
    }

    if (order.doctorId !== doctorId) {
      return res.status(403).json({ error: 'You are not authorized to complete this order' });
    }

    if (order.status !== 'PAID') {
      return res.status(400).json({ error: 'Order must be paid before completion' });
    }

    const updatedOrder = await prisma.emergencyDrugOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes || order.notes
      },
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        }
      }
    });

    res.json({
      message: 'Emergency drug order completed successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error completing emergency drug order:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create material needs order (nurse side)
 */
exports.createMaterialNeedsOrder = async (req, res) => {
  try {
    const { visitId, patientId, serviceId, quantity, instructions, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!patientId || !serviceId) {
      return res.status(400).json({ error: 'Patient ID and Service ID are required' });
    }

    // Validate service is MATERIAL_NEEDS category
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.category !== 'MATERIAL_NEEDS') {
      return res.status(400).json({ error: 'Service must be MATERIAL_NEEDS category' });
    }

    // Validate visit if provided
    if (visitId) {
      const visit = await prisma.visit.findUnique({
        where: { id: visitId }
      });
      if (!visit) {
        return res.status(404).json({ error: 'Visit not found' });
      }
    }

    // Create material needs order (nurseId field accepts both nurses and doctors)
    const order = await prisma.materialNeedsOrder.create({
      data: {
        visitId: visitId || null,
        patientId,
        nurseId: userId, // Use nurseId field for both nurses and doctors
        serviceId,
        quantity: quantity || 1,
        instructions,
        notes,
        status: 'UNPAID'
      },
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        },
        nurse: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // Check for existing PENDING billing for this visit/patient and add to it, or create new one
    const totalAmount = service.price * (quantity || 1);
    let billing = await prisma.billing.findFirst({
      where: {
        patientId,
        visitId: visitId || null,
        status: 'PENDING'
      },
      include: {
        services: true
      }
    });

    if (billing) {
      // Add service to existing billing
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: service.id,
          quantity: quantity || 1,
          unitPrice: service.price,
          totalPrice: totalAmount
        }
      });

      // Update billing total
      billing = await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: {
            increment: totalAmount
          },
          notes: billing.notes ? `${billing.notes}; Material needs: ${service.name}` : `Material needs: ${service.name}`
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });
    } else {
      // Create new billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId: visitId || null,
          totalAmount,
          status: 'PENDING',
          notes: `Material needs: ${service.name}`,
          services: {
            create: {
              serviceId: service.id,
              quantity: quantity || 1,
              unitPrice: service.price,
              totalPrice: totalAmount
            }
          }
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });
    }

    // Link order to billing
    await prisma.materialNeedsOrder.update({
      where: { id: order.id },
      data: { billingId: billing.id }
    });

    res.status(201).json({
      success: true,
      order: {
        ...order,
        billingId: billing.id
      },
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount,
        status: billing.status
      },
      message: 'Material needs order created successfully'
    });
  } catch (error) {
    console.error('Error creating material needs order:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get material needs orders for nurse
 */
exports.getMaterialNeedsOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, visitId } = req.query;

    const where = {};

    // For nurses, filter by nurseId; for doctors/admins, show all orders for the visit
    if (userRole === 'NURSE') {
      where.nurseId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (visitId) {
      where.visitId = parseInt(visitId);
    }

    const orders = await prisma.materialNeedsOrder.findMany({
      where,
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        },
        nurse: {
          select: {
            id: true,
            fullname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching material needs orders:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Complete material needs order
 */
exports.completeMaterialNeedsOrder = async (req, res) => {
  try {
    const { orderId, notes } = req.body;
    const nurseId = req.user.id;

    const order = await prisma.materialNeedsOrder.findUnique({
      where: { id: orderId },
      include: {
        service: true,
        patient: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Material needs order not found' });
    }

    if (order.nurseId !== nurseId) {
      return res.status(403).json({ error: 'You are not authorized to complete this order' });
    }

    if (order.status !== 'PAID') {
      return res.status(400).json({ error: 'Order must be paid before completion' });
    }

    const updatedOrder = await prisma.materialNeedsOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes || order.notes
      },
      include: {
        service: true,
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
          }
        }
      }
    });

    res.json({
      message: 'Material needs order completed successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error completing material needs order:', error);
    res.status(500).json({ error: error.message });
  }
};
