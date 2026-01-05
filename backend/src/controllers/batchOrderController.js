const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createBatchOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  type: z.enum(['LAB', 'RADIOLOGY', 'MIXED', 'NURSE', 'DENTAL']),
  instructions: z.string().optional(),
  assignedNurseId: z.string().optional(), // For nurse services
  services: z.array(z.object({
    serviceId: z.string(),
    investigationTypeId: z.number().optional(),
    instructions: z.string().optional()
  })).optional(), // Optional for new lab test system
  labTestIds: z.array(z.string().uuid()).optional() // New: array of lab test IDs
});

// Create a batch order
exports.createBatchOrder = async (req, res) => {
  try {
    // Batch order request
    const { visitId, patientId, type, instructions, services, assignedNurseId } = createBatchOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is in correct status
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow emergency patients or visits in correct status
    // AWAITING_RESULTS_REVIEW is allowed so doctor can order additional tests after reviewing initial results
    const allowedStatuses = ['WAITING_FOR_DOCTOR', 'IN_DOCTOR_QUEUE', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'NURSE_SERVICES_COMPLETED', 'AWAITING_RESULTS_REVIEW'];
    if (!visit.isEmergency && !allowedStatuses.includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, in doctor queue, under doctor review, awaiting results review, or sent to lab/radiology to create orders' });
    }

    // For emergency patients, use the assigned doctor's ID instead of requesting user's ID
    let actualDoctorId = doctorId;
    if (visit.isEmergency && visit.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: visit.assignmentId },
        select: { doctorId: true }
      });
      if (assignment) {
        actualDoctorId = assignment.doctorId;
        // Emergency patient - Using assigned doctor ID
      }
    } else {
      // Regular patient - Using requesting user ID
    }

    // For nurse services, validate assigned nurse
    if (type === 'NURSE' && assignedNurseId) {
      const assignedNurse = await prisma.user.findUnique({
        where: { id: assignedNurseId, role: 'NURSE', availability: true }
      });

      if (!assignedNurse) {
        return res.status(404).json({ error: 'Nurse not found or not available' });
      }
    }

    // Validate all services exist
    const serviceIds = services.map(s => s.serviceId);
    const uniqueServiceIds = [...new Set(serviceIds)]; // Get unique service IDs
    const investigationTypeIds = services.map(s => s.investigationTypeId).filter(Boolean);
    
    // Debug - service processing
    
    const [validServices, validInvestigationTypes] = await Promise.all([
      prisma.service.findMany({
        where: { id: { in: uniqueServiceIds } },
        select: { id: true, name: true, price: true, category: true }
      }),
      investigationTypeIds.length > 0 ? prisma.investigationType.findMany({
        where: { id: { in: investigationTypeIds } },
        select: { id: true, name: true, price: true, category: true, serviceId: true }
      }) : []
    ]);

    // Debug - validation complete

    // Check if all unique service IDs were found (not the total count, since we allow duplicates for quantities)
    if (validServices.length !== uniqueServiceIds.length) {
      const missingIds = uniqueServiceIds.filter(id => !validServices.find(s => s.id === id));
      console.error('❌ Missing service IDs:', missingIds);
      return res.status(404).json({ error: 'One or more services not found', missingIds });
    }

    if (investigationTypeIds.length > 0 && validInvestigationTypes.length !== investigationTypeIds.length) {
      return res.status(404).json({ error: 'One or more investigation types not found' });
    }

    // Calculate total amount
    const totalAmount = services.reduce((total, service) => {
      const serviceData = validServices.find(s => s.id === service.serviceId);
      const investigationData = service.investigationTypeId ? 
        validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
      
      // Use investigation type price if available, otherwise service price
      const price = investigationData ? investigationData.price : serviceData.price;
      return total + price;
    }, 0);

    // Check if there's already a batch order for this visit and type
    // For emergency patients, we want to group all orders together
    const existingBatchOrder = await prisma.batchOrder.findFirst({
      where: {
        visitId: visitId,
        type: type,
        status: visit.isEmergency ? 'QUEUED' : { in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED'] }
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        }
      }
    });

    let batchOrder;
    let newServicesAdded = [];

    if (existingBatchOrder) {
      // Add services to existing batch order
      // Adding services to existing batch order
      
      // Aggregate services by unique serviceId + investigationTypeId to avoid unique constraint violations
      const uniqueServicesToAdd = [];
      const serviceCounts = {};
      
      services.forEach(service => {
        const key = `${service.serviceId}-${service.investigationTypeId || 'null'}`;
        if (!serviceCounts[key]) {
          serviceCounts[key] = {
            serviceId: service.serviceId,
            investigationTypeId: service.investigationTypeId || null,
            instructions: service.instructions || null,
            count: 0
          };
          uniqueServicesToAdd.push(serviceCounts[key]);
        }
        serviceCounts[key].count++;
      });
      
      for (const service of uniqueServicesToAdd) {
        // Check if this service already exists in the batch order
        const existingService = existingBatchOrder.services.find(
          s => s.serviceId === service.serviceId && 
               s.investigationTypeId === (service.investigationTypeId || null)
        );
        
        if (existingService) {
          // Service already exists in batch order, skipping
          // Still add to newServicesAdded for billing calculation with count
          const serviceData = validServices.find(s => s.id === service.serviceId);
          const investigationData = service.investigationTypeId ? 
            validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
          const price = investigationData ? investigationData.price : serviceData.price;
          
          for (let i = 0; i < service.count; i++) {
            newServicesAdded.push({
              serviceId: service.serviceId,
              investigationTypeId: service.investigationTypeId || null,
              price: price
            });
          }
          continue;
        }
        
        const serviceData = validServices.find(s => s.id === service.serviceId);
        const investigationData = service.investigationTypeId ? 
          validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
        const price = investigationData ? investigationData.price : serviceData.price;
        
        const newService = await prisma.batchOrderService.create({
          data: {
            batchOrderId: existingBatchOrder.id,
            serviceId: service.serviceId,
            investigationTypeId: service.investigationTypeId,
            instructions: service.instructions,
            status: visit.isEmergency ? 'QUEUED' : 'UNPAID'
          },
          include: {
            service: true,
            investigationType: true
          }
        });
        
        // Add to newServicesAdded with count for billing calculation
        for (let i = 0; i < service.count; i++) {
          newServicesAdded.push({
            serviceId: service.serviceId,
            investigationTypeId: service.investigationTypeId || null,
            price: price
          });
        }
      }
      
      // Update the existing batch order
      batchOrder = await prisma.batchOrder.update({
        where: { id: existingBatchOrder.id },
        data: {
          instructions: instructions || existingBatchOrder.instructions
        },
        include: {
          services: {
            include: {
              service: true,
              investigationType: true
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          doctor: {
            select: {
              id: true,
              fullname: true
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
    } else {
      // Create new batch order
      // Creating new batch order
      
      // For dental services with quantities, we need to aggregate by unique serviceId
      // to avoid unique constraint violations on [batchOrderId, serviceId]
      const uniqueServices = [];
      const serviceCounts = {};
      
      services.forEach(service => {
        const key = `${service.serviceId}-${service.investigationTypeId || 'null'}`;
        if (!serviceCounts[key]) {
          serviceCounts[key] = {
            serviceId: service.serviceId,
            investigationTypeId: service.investigationTypeId || null,
            instructions: service.instructions || null,
            count: 0
          };
          uniqueServices.push(serviceCounts[key]);
        }
        serviceCounts[key].count++;
      });
      
      // Unique services after aggregation
      
      batchOrder = await prisma.batchOrder.create({
        data: {
          visitId,
          patientId,
          doctorId: actualDoctorId,
          type,
          instructions,
          status: visit.isEmergency ? 'QUEUED' : 'UNPAID', // Emergency patients go directly to queue
          services: {
            create: uniqueServices.map(service => ({
              serviceId: service.serviceId,
              investigationTypeId: service.investigationTypeId,
              instructions: service.instructions
            }))
          }
        },
        include: {
          services: {
            include: {
              service: true,
              investigationType: true
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          doctor: {
            select: {
              id: true,
              fullname: true
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
      
      // For new batch orders, we need to expand unique services back to include quantities for billing
      // The batchOrder.services only has unique entries, but billing needs quantity information
      newServicesAdded = [];
      batchOrder.services.forEach(batchService => {
        // Count how many times this service appears in the original services array
        const count = services.filter(s => 
          s.serviceId === batchService.serviceId && 
          (s.investigationTypeId || null) === (batchService.investigationTypeId || null)
        ).length;
        
        const serviceData = validServices.find(s => s.id === batchService.serviceId);
        const investigationData = batchService.investigationTypeId ? 
          validInvestigationTypes.find(i => i.id === batchService.investigationTypeId) : null;
        const price = investigationData ? investigationData.price : serviceData.price;
        
        // Add count times for billing calculation
        for (let i = 0; i < count; i++) {
          newServicesAdded.push({
            serviceId: batchService.serviceId,
            investigationTypeId: batchService.investigationTypeId || null,
            price: price
          });
        }
      });
    }

    // Handle billing based on visit type
    let billing;
    
    if (visit.isEmergency) {
      // For emergency patients, use the new unified emergency billing system
      console.log('Emergency patient detected - using unified emergency billing system');
      
      // Import the emergency controller function
      const { getOrCreateEmergencyBilling } = require('./emergencyController');
      
      try {
        // Get or create emergency billing
        billing = await getOrCreateEmergencyBilling(visitId);
        
        // Add services to emergency billing
        for (const service of newServicesAdded) {
          const serviceData = validServices.find(s => s.id === service.serviceId);
          const investigationData = service.investigationTypeId ? 
            validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
          const price = investigationData ? investigationData.price : serviceData.price;
          
          // Check if service already exists
          const existingService = await prisma.billingService.findFirst({
            where: {
              billingId: billing.id,
              serviceId: service.serviceId
            }
          });
          
          if (!existingService) {
            await prisma.billingService.create({
              data: {
                billingId: billing.id,
                serviceId: service.serviceId,
                quantity: 1,
                unitPrice: price,
                totalPrice: price
              }
            });
            
            // Update total amount
            await prisma.billing.update({
              where: { id: billing.id },
              data: {
                totalAmount: {
                  increment: price
                }
              }
            });
          }
        }
        
        console.log(`✅ Emergency services added to billing ${billing.id}`);
      } catch (error) {
        console.error('Error with emergency billing:', error);
        // Fallback to regular billing if emergency system fails
        billing = await prisma.billing.create({
          data: {
            patientId: visit.patientId,
            visitId: visitId,
            totalAmount: totalAmount,
            status: 'PENDING',
            notes: 'Emergency services - fallback billing'
          }
        });
      }
    } else {
      // For regular patients, check for ANY existing PENDING billing for this visit
      // This will merge all services (dental, lab, radiology) with nurse services or any other pending billing
      billing = await prisma.billing.findFirst({
        where: {
          visitId: visitId,
          status: 'PENDING'
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });

      if (type === 'DENTAL') {
        // Aggregate services by serviceId to handle quantities
        // Use newServicesAdded which already has the correct count from quantity expansion
        const serviceQuantities = {};
        const servicePrices = {};
        
        newServicesAdded.forEach(service => {
          if (!serviceQuantities[service.serviceId]) {
            serviceQuantities[service.serviceId] = 0;
            servicePrices[service.serviceId] = service.price;
          }
          serviceQuantities[service.serviceId]++;
        });

        // Create billing services array with aggregated quantities
        const billingServices = Object.keys(serviceQuantities).map(serviceId => ({
          serviceId: serviceId,
          quantity: serviceQuantities[serviceId],
          unitPrice: servicePrices[serviceId],
          totalPrice: servicePrices[serviceId] * serviceQuantities[serviceId]
        }));

        // Recalculate total with aggregated quantities
        const aggregatedTotal = billingServices.reduce((sum, bs) => sum + bs.totalPrice, 0);

        if (!billing) {
          // No existing billing - create new one
          billing = await prisma.billing.create({
            data: {
              patientId,
              visitId,
              totalAmount: aggregatedTotal,
              status: 'PENDING',
              notes: `Dental services: ${validServices.map(s => {
                const qty = serviceQuantities[s.id] || 0;
                return qty > 0 ? `${s.name} (×${qty})` : null;
              }).filter(Boolean).join(', ')}`,
              services: {
                create: billingServices
              }
            }
          });
          // Created new billing for dental services
        } else {
          // Merge with existing billing
          console.log(`🔄 Merging dental services into existing billing: ${billing.id}`);
          
          // Add new services to existing billing
          for (const serviceData of billingServices) {
            // Check if service already exists in billing
            const existingService = billing.services.find(
              bs => bs.serviceId === serviceData.serviceId
            );

            if (existingService) {
              // Update quantity and total for existing service
              await prisma.billingService.update({
                where: {
                  billingId_serviceId: {
                    billingId: billing.id,
                    serviceId: serviceData.serviceId
                  }
                },
                data: {
                  quantity: existingService.quantity + serviceData.quantity,
                  totalPrice: existingService.totalPrice + serviceData.totalPrice
                }
              });
            } else {
              // Create new billing service
              await prisma.billingService.create({
                data: {
                  billingId: billing.id,
                  ...serviceData
                }
              });
            }
          }

          // Update billing total and notes
          const dentalServiceNames = validServices.map(s => {
            const qty = serviceQuantities[s.id] || 0;
            return qty > 0 ? `${s.name} (×${qty})` : null;
          }).filter(Boolean).join(', ');
          
          const updatedNotes = billing.notes 
            ? `${billing.notes} + Dental services: ${dentalServiceNames}`
            : `Dental services: ${dentalServiceNames}`;

          billing = await prisma.billing.update({
            where: { id: billing.id },
            data: {
              totalAmount: {
                increment: aggregatedTotal
              },
              notes: updatedNotes
            }
          });

          // Dental services merged into existing billing
        }
      } else {
        // For lab/radiology, merge with existing billing if found
        if (!billing) {
          // Create new diagnostics billing
          billing = await prisma.billing.create({
            data: {
              patientId,
              visitId,
              totalAmount,
              status: 'PENDING',
              notes: 'Combined diagnostics billing - lab and radiology',
              services: {
                create: services.map(service => {
                  const serviceData = validServices.find(s => s.id === service.serviceId);
                  const investigationData = service.investigationTypeId ? 
                    validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
                  const price = investigationData ? investigationData.price : serviceData.price;
                  
                  return {
                    serviceId: service.serviceId,
                    quantity: 1,
                    unitPrice: price,
                    totalPrice: price
                  };
                })
              }
            }
          });
          // Created new billing for diagnostics
        } else {
          // Merge with existing billing
          console.log(`🔄 Merging diagnostics services into existing billing: ${billing.id}`);
          
          // Get existing billing services to check for duplicates
          const existingBillingServices = await prisma.billingService.findMany({
            where: { billingId: billing.id },
            select: { serviceId: true }
          });
          
          const existingServiceIds = existingBillingServices.map(s => s.serviceId);
          
          // Add only the new services to existing billing
          for (const service of newServicesAdded) {
            // Skip if service already exists in billing
            if (existingServiceIds.includes(service.serviceId)) {
              console.log(`Service ${service.serviceId} already exists in billing ${billing.id}, skipping`);
              continue;
            }
            
            const serviceData = validServices.find(s => s.id === service.serviceId);
            const investigationData = service.investigationTypeId ? 
              validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
            const price = investigationData ? investigationData.price : serviceData.price;
            
            await prisma.billingService.create({
              data: {
                billingId: billing.id,
                serviceId: service.serviceId,
                quantity: 1,
                unitPrice: price,
                totalPrice: price
              }
            });
          }
          
          // Update existing billing total with only the new services amount
          const newServicesAmount = newServicesAdded.reduce((total, service) => {
            const serviceData = validServices.find(s => s.id === service.serviceId);
            const investigationData = service.investigationTypeId ? 
              validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
            const price = investigationData ? investigationData.price : serviceData.price;
            return total + price;
          }, 0);
          
          const updatedNotes = billing.notes 
            ? `${billing.notes} + Diagnostics services`
            : 'Combined diagnostics billing - lab and radiology';

          billing = await prisma.billing.update({
            where: { id: billing.id },
            data: {
              totalAmount: {
                increment: newServicesAmount
              },
              notes: updatedNotes
            }
          });

          // Diagnostics services merged into existing billing
        }
      }
    }

    // Update visit status based on order type
    // Refresh visit status in case it changed during batch order creation
    const currentVisit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: { status: true, isEmergency: true }
    });
    
    let newStatus = currentVisit.status;
    
    // For emergency patients, keep them in UNDER_DOCTOR_REVIEW to allow more orders
    if (currentVisit.isEmergency) {
      newStatus = 'UNDER_DOCTOR_REVIEW';
    } else {
      // For regular patients, use existing logic
      if (currentVisit.status === 'UNDER_DOCTOR_REVIEW' || currentVisit.status === 'WAITING_FOR_DOCTOR') {
        if (type === 'LAB') {
          newStatus = 'SENT_TO_LAB';
        } else if (type === 'RADIOLOGY') {
          newStatus = 'SENT_TO_RADIOLOGY';
        } else if (type === 'MIXED') {
          newStatus = 'SENT_TO_BOTH';
        } else if (type === 'NURSE') {
          newStatus = 'NURSE_SERVICES_ORDERED';
        } else if (type === 'DENTAL') {
          newStatus = 'DENTAL_SERVICES_ORDERED';
        }
      } else if (currentVisit.status === 'IN_DOCTOR_QUEUE' && type === 'DENTAL') {
        // Patient returned from billing, ordering more dental services - remove from queue again
        newStatus = 'DENTAL_SERVICES_ORDERED';
      } else if (currentVisit.status === 'SENT_TO_LAB' && type === 'RADIOLOGY') {
        // If already sent to lab and now ordering radiology, change to mixed
        newStatus = 'SENT_TO_BOTH';
      } else if (currentVisit.status === 'SENT_TO_RADIOLOGY' && type === 'LAB') {
        // If already sent to radiology and now ordering lab, change to mixed
        newStatus = 'SENT_TO_BOTH';
      } else if (currentVisit.status === 'AWAITING_RESULTS_REVIEW') {
        // Doctor is reviewing results and ordering additional tests
        // Check if there are existing pending lab or radiology orders
        const existingLabOrders = await prisma.batchOrder.findFirst({
          where: {
            visitId: visitId,
            type: { in: ['LAB', 'MIXED'] },
            status: { in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'] }
          }
        });
        
        const existingRadiologyOrders = await prisma.batchOrder.findFirst({
          where: {
            visitId: visitId,
            type: { in: ['RADIOLOGY', 'MIXED'] },
            status: { in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'] }
          }
        });
        
        if (type === 'LAB') {
          // Ordering lab - check if radiology is pending
          if (existingRadiologyOrders) {
            newStatus = 'SENT_TO_BOTH';
          } else {
            newStatus = 'SENT_TO_LAB';
          }
        } else if (type === 'RADIOLOGY') {
          // Ordering radiology - check if lab is pending
          if (existingLabOrders) {
            newStatus = 'SENT_TO_BOTH';
          } else {
            newStatus = 'SENT_TO_RADIOLOGY';
          }
        } else if (type === 'MIXED') {
          newStatus = 'SENT_TO_BOTH';
        } else if (type === 'NURSE') {
          newStatus = 'NURSE_SERVICES_ORDERED';
        }
      }
      // For other cases (like IN_DOCTOR_QUEUE, NURSE_SERVICES_COMPLETED), keep the current status
    }

    // Always update visit status when ordering dental services to remove from queue
    // This ensures patients are removed from queue even if they're in IN_DOCTOR_QUEUE status
    if (type === 'DENTAL' && currentVisit.status === 'IN_DOCTOR_QUEUE') {
      newStatus = 'DENTAL_SERVICES_ORDERED';
      console.log(`🦷 Updating visit ${visitId} status from ${currentVisit.status} to ${newStatus} for dental services order`);
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });
    
    console.log(`✅ Visit ${visitId} status updated to: ${newStatus}`);

    // For nurse services, create nurse service assignments
    if (type === 'NURSE' && assignedNurseId) {
      const nurseServiceAssignments = [];
      for (const service of services) {
        const assignment = await prisma.nurseServiceAssignment.create({
          data: {
            visitId,
            serviceId: service.serviceId,
            assignedNurseId,
            assignedById: 'nurse-123', // Default nurse ID for doctor orders
            status: 'PENDING',
            notes: service.instructions || `Doctor ordered: ${validServices.find(s => s.id === service.serviceId)?.name}`,
            orderType: 'DOCTOR_ORDERED'
          },
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        });
        nurseServiceAssignments.push(assignment);
      }
    }

    res.status(201).json({
      message: 'Batch order created successfully',
      batchOrder,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount
      },
      visitStatus: newStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('❌ Error creating batch order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get batch orders for lab department
exports.getLabBatchOrders = async (req, res) => {
  try {
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'LAB' },
          { type: 'MIXED' }
        ],
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
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
            vitals: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ batchOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get batch orders for radiology department
exports.getRadiologyBatchOrders = async (req, res) => {
  try {
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'RADIOLOGY' },
          { type: 'MIXED' }
        ],
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
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
            vitals: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ batchOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update batch order results
exports.updateBatchOrderResults = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    const { result, additionalNotes, serviceResults } = req.body;

    // Update batch order
    const updatedBatchOrder = await prisma.batchOrder.update({
      where: { id: parseInt(batchOrderId) },
      data: {
        result: result || null,
        additionalNotes: additionalNotes || null,
        status: 'COMPLETED',
        updatedAt: new Date()
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true
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

    // Update individual service results if provided
    if (serviceResults && Array.isArray(serviceResults)) {
      for (const serviceResult of serviceResults) {
        if (serviceResult.batchOrderServiceId && serviceResult.result) {
          await prisma.batchOrderService.update({
            where: { id: serviceResult.batchOrderServiceId },
            data: {
              result: serviceResult.result,
              status: 'COMPLETED'
            }
          });
        }
      }
    }

    res.json({
      message: 'Batch order results updated successfully',
      batchOrder: updatedBatchOrder
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload attachment for batch order
exports.uploadBatchOrderAttachment = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the batch order to find the patientId
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(batchOrderId) },
      select: { patientId: true }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Batch order not found' });
    }

    const file = await prisma.file.create({
      data: {
        patientId: batchOrder.patientId,
        path: req.file.path,
        type: req.file.mimetype,
        batchOrderId: parseInt(batchOrderId),
        accessLog: [JSON.stringify({
          action: 'UPLOADED',
          timestamp: new Date().toISOString(),
          userId: req.user.id
        })]
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        path: file.path,
        type: file.type
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// NEW LAB TEST ORDER SYSTEM
// ============================================

// Create lab test orders (new system)
exports.createLabTestOrders = async (req, res) => {
  try {
    const { visitId, patientId, labTestIds, instructions } = req.body;
    const doctorId = req.user.id;

    if (!visitId || !patientId || !labTestIds || !Array.isArray(labTestIds) || labTestIds.length === 0) {
      return res.status(400).json({ error: 'visitId, patientId, and labTestIds (array) are required' });
    }

    // Validate visit
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Validate lab tests
    const labTests = await prisma.labTest.findMany({
      where: {
        id: { in: labTestIds },
        isActive: true
      },
      include: {
        service: true
      }
    });

    if (labTests.length !== labTestIds.length) {
      return res.status(404).json({ error: 'One or more lab tests not found or inactive' });
    }

    // Check for existing orders to avoid duplicates
    // Only block if there are unpaid or active orders (not completed ones - allow re-ordering)
    const existingOrders = await prisma.labTestOrder.findMany({
      where: {
        visitId: visitId,
        labTestId: { in: labTestIds },
        status: { in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'] } // Exclude COMPLETED - allow re-ordering
      },
      select: { labTestId: true, status: true }
    });

    const existingTestIds = new Set(existingOrders.map(o => o.labTestId));
    const newTestIds = labTestIds.filter(id => !existingTestIds.has(id));

    if (newTestIds.length === 0) {
      const completedTestIds = await prisma.labTestOrder.findMany({
        where: {
          visitId: visitId,
          labTestId: { in: labTestIds },
          status: 'COMPLETED'
        },
        select: { labTestId: true }
      });
      
      if (completedTestIds.length > 0 && completedTestIds.length === labTestIds.length) {
        return res.status(400).json({
          error: 'All selected lab tests have active orders. Completed tests can be re-ordered, but you have active (unpaid/queued) orders for all selected tests.',
          message: 'You have active orders for all selected tests. Please wait for them to be completed or pay for existing orders first.'
        });
      }
      
      return res.status(400).json({
        error: 'All selected lab tests have already been ordered for this visit',
        message: 'You have active orders for all selected tests. You can re-order completed tests, but please wait for active orders to be processed first.'
      });
    }
    
    console.log(`✅ [createLabTestOrders] Creating ${newTestIds.length} new orders (${labTestIds.length - newTestIds.length} already exist)`);

    // Create a batch order for grouping (optional, for compatibility)
    const batchOrder = await prisma.batchOrder.create({
      data: {
        visitId,
        patientId,
        doctorId,
        type: 'LAB',
        instructions: instructions || 'Lab tests ordered by doctor',
        status: 'UNPAID'
      }
    });

    // Create lab test orders
    const createdOrders = [];
    let totalAmount = 0;

    for (const testId of newTestIds) {
      const test = labTests.find(t => t.id === testId);
      if (!test) continue;

      const order = await prisma.labTestOrder.create({
        data: {
          labTestId: testId,
          batchOrderId: batchOrder.id,
          visitId,
          patientId,
          doctorId,
          instructions: instructions || `Lab test: ${test.name}`,
          status: visit.isEmergency ? 'QUEUED' : 'UNPAID',
          isWalkIn: false
        },
        include: {
          labTest: {
            include: {
              service: true,
              group: true
            }
          }
        }
      });

      createdOrders.push(order);
      totalAmount += test.price;
    }

    // Create billing entry
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        status: 'PENDING'
      }
    });

    if (!billing) {
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: 0,
          status: 'PENDING',
          notes: 'Diagnostics billing'
        }
      });
    }

    // Link all orders to this billing
    await prisma.labTestOrder.updateMany({
      where: {
        id: { in: createdOrders.map(o => o.id) }
      },
      data: {
        billingId: billing.id
      }
    });

    // Add services to billing
    for (const order of createdOrders) {
      if (order.labTest.serviceId) {
        const existingBillingService = await prisma.billingService.findFirst({
          where: {
            billingId: billing.id,
            serviceId: order.labTest.serviceId
          }
        });

        if (!existingBillingService) {
          await prisma.billingService.create({
            data: {
              billingId: billing.id,
              serviceId: order.labTest.serviceId,
              quantity: 1,
              unitPrice: order.labTest.price,
              totalPrice: order.labTest.price
            }
          });
        }
      }
    }

    // Update billing total
    const billingServices = await prisma.billingService.findMany({
      where: { billingId: billing.id }
    });
    const newTotal = billingServices.reduce((sum, bs) => sum + bs.totalPrice, 0);
    
    await prisma.billing.update({
      where: { id: billing.id },
      data: { totalAmount: newTotal }
    });

    // Update visit status - check if there are also radiology orders
    const hasRadiologyOrders = await prisma.radiologyOrder.count({
      where: {
        visitId: visitId,
        status: { in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED'] }
      }
    }) > 0;

    // Update visit status based on what was ordered
    let newVisitStatus = visit.status;
    if (hasRadiologyOrders) {
      newVisitStatus = 'SENT_TO_BOTH';
    } else {
      newVisitStatus = 'SENT_TO_LAB';
    }

    // Only update if status is not already one of the sent statuses
    if (!['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      await prisma.visit.update({
        where: { id: visitId },
        data: { status: newVisitStatus }
      });
      console.log(`✅ Updated visit ${visitId} status to ${newVisitStatus}`);
    }

    res.status(201).json({
      message: `${createdOrders.length} lab test order(s) created successfully`,
      orders: createdOrders,
      batchOrder,
      billing,
      totalAmount
    });

  } catch (error) {
    console.error('Error creating lab test orders:', error);
    res.status(500).json({ error: error.message });
  }
};
