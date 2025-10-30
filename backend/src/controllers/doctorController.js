const prisma = require('../config/database');
const { z } = require('zod');
const { checkMedicationOrderingAllowed } = require('../utils/investigationUtils');

// Get all services (for doctors to order)
exports.getAllServices = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else {
      whereClause.isActive = true; // Default to active services only
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
};

// Validation schemas
const labOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  typeId: z.number(),
  instructions: z.string().optional(),
});

const multipleLabOrdersSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  orders: z.array(z.object({
    typeId: z.number(),
    instructions: z.string().optional(),
  })).min(1, 'At least one order is required'),
});

const radiologyOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  typeId: z.number(),
  instructions: z.string().optional(),
});

const createMultipleRadiologyOrdersSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  orders: z.array(z.object({
    typeId: z.number(),
    instructions: z.string().optional(),
  })).min(1, 'At least one radiology order is required'),
});

const medicationOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  name: z.string(),
  dosageForm: z.string(),
  strength: z.string(),
  quantity: z.string(), // Changed to string to accept any input
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string(),
  additionalNotes: z.string().optional(),
  category: z.enum(['TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS']).optional(),
  isContinuousInfusion: z.boolean().optional(),
  continuousInfusionDays: z.number().optional(),
  dailyDose: z.string().optional(),
});

const selectVisitSchema = z.object({
  visitId: z.number(),
});

const updateVisitSchema = z.object({
  diagnosis: z.string().optional(),
  diagnosisDetails: z.string().optional(),
  instructions: z.string().optional(),
});

const completeVisitSchema = z.object({
  visitId: z.number(),
  diagnosis: z.string().optional(), // Will be extracted from diagnosis notes
  diagnosisDetails: z.string().optional(), // Rich text diagnosis details
  instructions: z.string().optional(), // Patient instructions
  finalNotes: z.string().optional(),
  needsAppointment: z.boolean().optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  appointmentNotes: z.string().optional(),
});

exports.getInvestigationTypes = async (req, res) => {
  try {
    const investigationTypes = await prisma.investigationType.findMany({
      include: {
        service: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json({ investigationTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get visits assigned to this doctor that are waiting for doctor review or returned with results
    // AND have paid their consultation fee
    const queue = await prisma.visit.findMany({
      where: { 
        status: {
          in: ['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'NURSE_SERVICES_COMPLETED']
        },
        assignmentId: {
          not: null
        },
        // Ensure consultation fee is paid
        bills: {
          some: {
            status: 'PAID',
            OR: [
              {
                services: {
                  some: {
                    service: {
                      category: 'CONSULTATION'
                    }
                  }
                }
              },
              { billingType: 'CONSULTATION' }
            ]
          }
        }
      },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            },
            attachments: true
          }
        },
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        appointments: {
          where: {
            visitId: { not: null }
          },
          select: {
            id: true,
            type: true,
            reason: true,
            notes: true,
            appointmentDate: true,
            appointmentTime: true
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });

    res.json({ queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResultsQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;
    console.log('🔍 getResultsQueue - Doctor ID:', doctorId);
    
    // Get visits assigned to this doctor that have results ready for review
    const resultsQueue = await prisma.visit.findMany({
      where: { 
        status: 'AWAITING_RESULTS_REVIEW',
        queueType: 'RESULTS_REVIEW',
        OR: [
          { assignmentId: { not: null } },
          { batchOrders: { some: { doctorId: doctorId } } }
        ]
      },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            },
            attachments: true
          }
        },
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        appointments: {
          where: {
            visitId: { not: null }
          },
          select: {
            id: true,
            type: true,
            reason: true,
            notes: true,
            appointmentDate: true,
            appointmentTime: true
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });

    // Add result type labels and include radiology/lab results for each visit
    const queueWithLabels = await Promise.all(resultsQueue.map(async (visit) => {
      let resultLabels = [];
      
      if (visit.labOrders.some(order => order.labResults.length > 0)) {
        resultLabels.push('Lab Results Available');
      }
      
      if (visit.radiologyOrders.some(order => order.radiologyResults.length > 0)) {
        resultLabels.push('Radiology Results Available');
      }
      
      if (visit.batchOrders.some(order => order.status === 'COMPLETED')) {
        resultLabels.push('Batch Results Available');
      }

      // Add radiology and lab results to batch orders
      const batchOrdersWithResults = await Promise.all(visit.batchOrders.map(async (batchOrder) => {
        let radiologyResults = [];
        let labResults = [];
        
        if (batchOrder.type === 'RADIOLOGY') {
          radiologyResults = await prisma.radiologyResult.findMany({
            where: { batchOrderId: batchOrder.id },
            include: {
              testType: true,
              attachments: true
            }
          });
          
          // Also add batch order level results if individual results don't exist
          if (radiologyResults.length === 0 && batchOrder.result) {
            radiologyResults.push({
              id: `batch-${batchOrder.id}`,
              testType: { name: 'Radiology Tests' },
              resultText: batchOrder.result,
              additionalNotes: batchOrder.additionalNotes || '',
              status: batchOrder.status,
              attachments: batchOrder.attachments || [],
              createdAt: batchOrder.updatedAt || batchOrder.createdAt
            });
          }
        }
        
        if (batchOrder.type === 'LAB') {
          // Get detailed lab results from DetailedLabResult table
          const detailedLabResults = await prisma.detailedLabResult.findMany({
            where: {
              labOrderId: batchOrder.id
            },
            include: {
              template: true
            },
            orderBy: { createdAt: 'desc' }
          });

          // Group results by service for better organization
          const resultsByService = {};
          detailedLabResults.forEach(result => {
            const serviceKey = result.serviceId || 'unknown';
            if (!resultsByService[serviceKey]) {
              resultsByService[serviceKey] = [];
            }
            resultsByService[serviceKey].push(result);
          });

          // Convert detailed lab results to the expected format, grouped by service
          Object.keys(resultsByService).forEach(serviceId => {
            const serviceResults = resultsByService[serviceId];
            serviceResults.forEach(result => {
              // Get service name from batch order services
              const service = batchOrder.services.find(s => s.id === parseInt(serviceId));
              const serviceName = service ? service.service.name : 'Unknown Service';
              
              labResults.push({
                id: result.id,
                serviceId: result.serviceId,
                serviceName: serviceName,
                testType: {
                  name: result.template.name,
                  category: result.template.category
                },
                resultText: `Detailed results for ${result.template.name}`,
                detailedResults: result.results, // Include the actual detailed results
                additionalNotes: result.additionalNotes || '',
                status: result.status,
                attachments: [], // Detailed lab results don't have separate attachments
                createdAt: result.createdAt,
                verifiedBy: result.verifiedBy,
                verifiedAt: result.verifiedAt,
                template: result.template
              });
            });
          });

          // If no detailed results, fall back to batch order result
          if (labResults.length === 0) {
            labResults.push({
              id: `batch-${batchOrder.id}`,
              testType: { name: 'Lab Tests' },
              resultText: batchOrder.result || 'No result provided',
              additionalNotes: batchOrder.additionalNotes || '',
              status: batchOrder.status,
              attachments: batchOrder.attachments || [],
              createdAt: batchOrder.updatedAt || batchOrder.createdAt,
              services: batchOrder.services.map(service => ({
                name: service.investigationType?.name || service.service?.name || 'Test',
                result: service.result || 'No result'
              }))
            });
          }
        }
        
        return {
          ...batchOrder,
          radiologyResults,
          labResults
        };
      }));

      return {
        ...visit,
        batchOrders: batchOrdersWithResults,
        resultLabels
      };
    }));

    // Filter to only show visits assigned to this doctor
    const doctorAssignments = await prisma.assignment.findMany({
      where: {
        doctorId: doctorId,
        status: {
          in: ['Active', 'Pending']
        }
      },
      select: { id: true }
    });

    console.log('🔍 Doctor assignments:', doctorAssignments);
    console.log('🔍 Raw results queue count:', resultsQueue.length);

    const assignmentIds = doctorAssignments.map(a => a.id);
    const filteredQueue = queueWithLabels.filter(visit => 
      assignmentIds.includes(visit.assignmentId)
    );

    console.log('🔍 Filtered queue count:', filteredQueue.length);
    console.log('🔍 Assignment IDs:', assignmentIds);

    res.json({ queue: filteredQueue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all doctors' queue status for load balancing
exports.getDoctorsQueueStatus = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { 
        role: 'DOCTOR',
        availability: true 
      },
      select: {
        id: true,
        fullname: true,
        specialties: true,
        consultationFee: true
      }
    });

    const doctorsWithQueueCount = await Promise.all(
      doctors.map(async (doctor) => {
        // Get assignment IDs for this doctor
        const assignments = await prisma.assignment.findMany({
          where: {
            doctorId: doctor.id
          },
          select: {
            id: true,
            status: true
          }
        });

        const assignmentIds = assignments.map(a => a.id);
        const pendingAssignments = assignments.filter(a => a.status === 'Pending').length;

        // Count all active visits for this doctor (excluding completed and cancelled)
        const activeVisits = await prisma.visit.count({
          where: {
            assignmentId: {
              in: assignmentIds
            },
            status: {
              notIn: ['COMPLETED', 'CANCELLED']
            }
          }
        });

        // Count visits in progress for this doctor
        const inProgressVisits = await prisma.visit.count({
          where: {
            assignmentId: {
              in: assignmentIds
            },
            status: 'UNDER_DOCTOR_REVIEW'
          }
        });

        // Count visits awaiting results for this doctor
        const awaitingResultsCount = await prisma.visit.count({
          where: {
            assignmentId: {
              in: assignmentIds
            },
            status: 'AWAITING_RESULTS_REVIEW'
          }
        });

        // Count visits waiting for doctor (new patients)
        const waitingForDoctor = await prisma.visit.count({
          where: {
            assignmentId: {
              in: assignmentIds
            },
            status: {
              in: ['WAITING_FOR_DOCTOR', 'IN_DOCTOR_QUEUE', 'NURSE_SERVICES_COMPLETED']
            }
          }
        });

        return {
          ...doctor,
          queueCount: waitingForDoctor + inProgressVisits,
          newPatientsCount: waitingForDoctor,
          resultsCount: awaitingResultsCount,
          totalWorkload: activeVisits
        };
      })
    );

    // Sort by workload (ascending - least busy first)
    doctorsWithQueueCount.sort((a, b) => a.totalWorkload - b.totalWorkload);

    res.json({
      doctors: doctorsWithQueueCount,
      totalPatients: doctorsWithQueueCount.reduce((sum, doc) => sum + doc.totalWorkload, 0),
      averageWorkload: doctorsWithQueueCount.length > 0 
        ? Math.round(doctorsWithQueueCount.reduce((sum, doc) => sum + doc.totalWorkload, 0) / doctorsWithQueueCount.length)
        : 0
    });
  } catch (error) {
    console.error('Error fetching doctors queue status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get patient assignments and doctor information
exports.getPatientAssignments = async (req, res) => {
  try {
    const { search } = req.query;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        dob: true,
        gender: true,
        assignments: {
          select: {
            id: true,
            status: true,
            doctor: {
              select: {
                id: true,
                fullname: true,
                specialties: true
              }
            }
          }
        },
        visits: {
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED']
            }
          },
          select: {
            id: true,
            visitUid: true,
            status: true,
            date: true,
            assignmentId: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      take: 20 // Limit results for performance
    });

    // Format the response
    const formattedPatients = patients.map(patient => {
      const activeAssignment = patient.assignments.find(a => 
        a.status === 'Pending' || a.status === 'In Progress'
      );
      
      // Find the current visit (most recent active visit)
      const currentVisit = patient.visits.length > 0 ? patient.visits[0] : null;
      
      return {
        id: patient.id,
        name: patient.name,
        phone: patient.mobile,
        email: patient.email,
        dateOfBirth: patient.dob,
        gender: patient.gender,
        assignedDoctor: activeAssignment?.doctor || null,
        currentVisit: currentVisit,
        assignmentStatus: activeAssignment?.status || 'Unassigned'
      };
    });

    res.json({
      patients: formattedPatients,
      total: formattedPatients.length
    });
  } catch (error) {
    console.error('Error fetching patient assignments:', error);
    res.status(500).json({ error: error.message });
  }
};

// Unified Queue - combines patient queue and results queue with priority system
exports.getUnifiedQueue = async (req, res) => {
  try {
    // Use doctorId from query parameter if provided (for reception), otherwise use logged-in user's ID (for doctor)
    const doctorId = req.query.doctorId || req.user.id;
    console.log('🔍 getUnifiedQueue - Doctor ID:', doctorId);
    
    // Get doctor assignments
    const doctorAssignments = await prisma.assignment.findMany({
      where: { doctorId: doctorId },
      select: { id: true }
    });
    
    const assignmentIds = doctorAssignments.map(a => a.id);
    console.log('🔍 Assignment IDs:', assignmentIds);
    
    // Get all visits assigned to this doctor (both new consultations and results)
    // Include emergency patients and paid patients only
    const allVisits = await prisma.visit.findMany({
      where: { 
        status: {
          in: ['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'NURSE_SERVICES_COMPLETED', 'AWAITING_RESULTS_REVIEW', 'IN_DOCTOR_QUEUE']
        },
        AND: [
          {
            OR: [
              { assignmentId: { in: assignmentIds } },
              { batchOrders: { some: { doctorId: doctorId } } }
            ]
          },
          {
            OR: [
              { isEmergency: true }, // Emergency patients bypass payment check
              { 
                // Regular patients must have paid consultation fee
                bills: {
                  some: {
                    status: 'PAID',
                    OR: [
                      {
                        services: {
                          some: {
                            service: {
                              category: 'CONSULTATION'
                            }
                          }
                        }
                      },
                      { billingType: 'CONSULTATION' }
                    ]
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            },
            attachments: true
          }
        },
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        dentalRecords: true,
        nurseServiceAssignments: {
          where: {
            status: 'COMPLETED'
          },
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('🔍 Found visits:', allVisits.length);
    allVisits.forEach(visit => {
      console.log(`  - Visit ${visit.id}: ${visit.patient.name}, Status: ${visit.status}, AssignmentId: ${visit.assignmentId}`);
    });

    // Additional safety check: Find visits from appointments that might not be properly linked
    // First, find appointments for this doctor that are in progress and have a visitId
    const appointmentVisits = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        status: 'IN_PROGRESS',
        visitId: { not: null }
      },
      include: {
        patient: true
      }
    });

    // Get the visitIds from appointments
    const appointmentVisitIds = appointmentVisits.map(apt => apt.visitId).filter(id => id !== null);
    
    // Get the actual visits for these appointment visitIds
    const visitsToFix = await prisma.visit.findMany({
      where: {
        id: { in: appointmentVisitIds },
        status: {
          in: ['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'NURSE_SERVICES_COMPLETED', 'AWAITING_RESULTS_REVIEW', 'IN_DOCTOR_QUEUE']
        },
        assignmentId: null // Missing assignment link
      },
      include: {
        patient: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (visitsToFix.length > 0) {
      console.log(`🔧 Found ${visitsToFix.length} appointment visits missing assignment links - fixing...`);
      
      for (const visit of visitsToFix) {
        // Find or create assignment
        let assignment = await prisma.assignment.findFirst({
          where: {
            patientId: visit.patientId,
            doctorId: doctorId,
            status: 'Pending'
          }
        });

        if (!assignment) {
          assignment = await prisma.assignment.create({
            data: {
              patientId: visit.patientId,
              doctorId: doctorId,
              status: 'Pending'
            }
          });
        }

        // Link the visit to the assignment
        await prisma.visit.update({
          where: { id: visit.id },
          data: { assignmentId: assignment.id }
        });

        console.log(`✅ Fixed visit ${visit.id} - linked to assignment ${assignment.id}`);
      }
    }

    // All visits are already filtered by assignmentId and batchOrders in the query
    const filteredVisits = allVisits;

    // Add priority and queue type to each visit
    // Get appointment information for visits that have appointments
    const visitIds = filteredVisits.map(v => v.id);
    const visitAppointments = await prisma.appointment.findMany({
      where: {
        visitId: { in: visitIds },
        doctorId: doctorId
      },
      select: {
        visitId: true,
        type: true,
        reason: true,
        notes: true,
        appointmentDate: true,
        appointmentTime: true
      }
    });

    // Create a map of visitId to appointment for quick lookup
    const appointmentMap = {};
    visitAppointments.forEach(apt => {
      appointmentMap[apt.visitId] = apt;
    });

    const unifiedQueue = filteredVisits.map(visit => {
      let priority = 3; // Default: New consultation
      let queueType = 'NEW_CONSULTATION';
      let priorityReason = 'New consultation';
      let appointmentLabel = null;

      // Check if this visit is from an appointment
      const appointment = appointmentMap[visit.id];
      if (appointment) {
        appointmentLabel = {
          type: appointment.type,
          reason: appointment.reason,
          notes: appointment.notes,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        };
        
        // Set queue type based on appointment type
        if (appointment.type === 'FOLLOW_UP') {
          queueType = 'FOLLOW_UP_APPOINTMENT';
          priorityReason = 'Follow-up appointment';
        } else if (appointment.type === 'CONSULTATION') {
          queueType = 'CONSULTATION_APPOINTMENT';
          priorityReason = 'Consultation appointment';
        }
      }

      // Determine priority based on status and urgency
      if (visit.status === 'AWAITING_RESULTS_REVIEW') {
        priority = 2;
        queueType = 'RESULTS_READY';
        priorityReason = 'Results ready for review';
      } else if (['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
        priority = 3;
        queueType = 'AWAITING_RESULTS';
        priorityReason = 'Awaiting lab/radiology results';
      }

      // Check for urgent cases (high triage priority)
      if (visit.vitals && visit.vitals.length > 0) {
        const latestVitals = visit.vitals[0];
        if (latestVitals.triagePriority === 'High' || 
            (latestVitals.bloodPressure && latestVitals.bloodPressure.includes('High')) ||
            (latestVitals.temperature && latestVitals.temperature > 38.5) ||
            (latestVitals.heartRate && latestVitals.heartRate > 100)) {
          priority = 1;
          queueType = 'URGENT';
          priorityReason = 'Urgent case - high priority';
        }
      }

      return {
        ...visit,
        priority,
        queueType,
        priorityReason,
        appointmentLabel,
        // Add timestamp for sorting within same priority
        priorityTimestamp: visit.status === 'AWAITING_RESULTS_REVIEW' 
          ? visit.updatedAt || visit.createdAt 
          : visit.createdAt
      };
    });

    // Sort by priority (1=urgent, 2=results, 3=new), then by timestamp
    unifiedQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.priorityTimestamp) - new Date(b.priorityTimestamp);
    });

    console.log('🔍 Unified queue count:', unifiedQueue.length);
    console.log('🔍 Queue breakdown:', {
      urgent: unifiedQueue.filter(v => v.priority === 1).length,
      results: unifiedQueue.filter(v => v.priority === 2).length,
      new: unifiedQueue.filter(v => v.priority === 3 && v.queueType === 'NEW_CONSULTATION').length,
      awaiting: unifiedQueue.filter(v => v.priority === 3 && v.queueType === 'AWAITING_RESULTS').length
    });

    res.json({
      success: true,
      queue: unifiedQueue,
      stats: {
        total: unifiedQueue.length,
        urgent: unifiedQueue.filter(v => v.priority === 1).length,
        results: unifiedQueue.filter(v => v.priority === 2).length,
        new: unifiedQueue.filter(v => v.priority === 3 && v.queueType === 'NEW_CONSULTATION').length,
        awaiting: unifiedQueue.filter(v => v.priority === 3 && v.queueType === 'AWAITING_RESULTS').length
      }
    });

  } catch (error) {
    console.error('Error fetching unified queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified queue',
      details: error.message
    });
  }
};

// Get single visit details for consultation page
exports.getVisitDetails = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;
    
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            },
            attachments: true,
            detailedResults: {
              include: {
                template: true
              }
            }
          }
        },
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true,
        nurseServiceAssignments: {
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        }
      }
    });
    
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Check if doctor has access to this visit
    const assignment = await prisma.assignment.findFirst({
      where: { 
        patientId: visit.patientId,
        doctorId: doctorId
      }
    });
    
    const hasBatchOrder = visit.batchOrders.some(order => order.doctorId === doctorId);
    
    if (!assignment && !hasBatchOrder) {
      return res.status(403).json({ error: 'Access denied to this visit' });
    }
    
    // Fetch detailed lab results for batch orders
    const labBatchOrderIds = visit.batchOrders
      .filter(bo => bo.type === 'LAB')
      .map(bo => bo.id);
    
    if (labBatchOrderIds.length > 0) {
      const detailedLabResults = await prisma.detailedLabResult.findMany({
        where: {
          labOrderId: {
            in: labBatchOrderIds
          }
        },
        include: {
          template: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Attach detailed lab results to batch orders
      visit.batchOrders.forEach(batchOrder => {
        if (batchOrder.type === 'LAB') {
          batchOrder.detailedLabResults = detailedLabResults.filter(
            result => result.labOrderId === batchOrder.id
          );
        }
      });
    }
    
    // Fetch radiology results for batch orders
    const radiologyBatchOrderIds = visit.batchOrders
      .filter(bo => bo.type === 'RADIOLOGY')
      .map(bo => bo.id);
    
    if (radiologyBatchOrderIds.length > 0) {
      const radiologyResults = await prisma.radiologyResult.findMany({
        where: {
          batchOrderId: {
            in: radiologyBatchOrderIds
          }
        },
        include: {
          testType: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Attach radiology results to batch orders
      visit.batchOrders.forEach(batchOrder => {
        if (batchOrder.type === 'RADIOLOGY') {
          batchOrder.radiologyResults = radiologyResults.filter(
            result => result.batchOrderId === batchOrder.id
          );
        }
      });
    }
    
    // Process attached images to return relative paths
    if (visit.attachedImages) {
      visit.attachedImages = visit.attachedImages.map(image => ({
        ...image,
        filePath: image.filePath.replace(/^.*\/uploads\//, 'uploads/')
      }));
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.selectVisit = async (req, res) => {
  try {
    const { visitId } = selectVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is in correct status
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        vitals: true,
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        appointments: {
          where: {
            visitId: { not: null }
          },
          select: {
            id: true,
            type: true,
            reason: true,
            notes: true,
            appointmentDate: true,
            appointmentTime: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['WAITING_FOR_DOCTOR', 'RETURNED_WITH_RESULTS', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'AWAITING_LAB_RESULTS', 'AWAITING_RADIOLOGY_RESULTS', 'UNDER_DOCTOR_REVIEW'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit is not available for doctor review' });
    }

    // Check if the visit is assigned to this doctor
    if (visit.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: visit.assignmentId },
        select: { doctorId: true }
      });
      
      if (!assignment || assignment.doctorId !== doctorId) {
        return res.status(403).json({ error: 'You are not assigned to this patient' });
      }
    } else {
      return res.status(400).json({ error: 'Visit is not assigned to any doctor' });
    }

    // Update visit status to under doctor review
    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'UNDER_DOCTOR_REVIEW' }
    });

    // Determine stage based on existing orders
    const hasLabOrders = visit.labOrders.length > 0;
    const hasRadiologyOrders = visit.radiologyOrders.length > 0;
    const hasCompletedLab = visit.labOrders.some(order => order.status === 'COMPLETED');
    const hasCompletedRadiology = visit.radiologyOrders.some(order => order.status === 'COMPLETED');
    
    const stage = (hasLabOrders || hasRadiologyOrders) && (hasCompletedLab || hasCompletedRadiology) 
      ? 'POST_DIAGNOSTICS' 
      : 'PRE_DIAGNOSTICS';

    res.json({
      message: 'Visit selected for review',
      visit: updatedVisit,
      stage,
      canOrderMedications: stage === 'POST_DIAGNOSTICS'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { diagnosis, diagnosisDetails, instructions } = updateVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'RETURNED_WITH_RESULTS', 'AWAITING_LAB_RESULTS', 'AWAITING_RADIOLOGY_RESULTS'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit is not available for doctor review' });
    }

    // Update visit with diagnosis and instructions
    const updatedVisit = await prisma.visit.update({
      where: { id: parseInt(visitId) },
      data: {
        diagnosis,
        diagnosisDetails,
        instructions,
        status: 'UNDER_DOCTOR_REVIEW'
      },
      include: {
        patient: true,
        vitals: true,
        labOrders: true,
        radiologyOrders: true,
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        appointments: {
          where: {
            visitId: { not: null }
          },
          select: {
            id: true,
            type: true,
            reason: true,
            notes: true,
            appointmentDate: true,
            appointmentTime: true
          }
        }
      }
    });

    res.json({
      message: 'Visit updated successfully',
      visit: updatedVisit
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createLabOrder = async (req, res) => {
  try {
    const { visitId, patientId, typeId, instructions } = labOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Get investigation type with service
    const investigation = await prisma.investigationType.findUnique({ 
      where: { id: typeId, category: 'LAB' },
      include: { service: true }
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Lab investigation type not found' });
    }

    if (!investigation.service) {
      return res.status(400).json({ error: 'Investigation type is not linked to a service' });
    }

    // Create lab order
    const order = await prisma.labOrder.create({
      data: { 
        visitId,
        doctorId, 
        patientId, 
        typeId, 
        instructions,
        status: 'UNPAID'
      },
      include: {
        type: {
          include: {
            service: true
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

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.service.price,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + investigation.service.price
        }
      });
    }

    // Add service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: investigation.service.id,
        quantity: 1,
        unitPrice: investigation.service.price,
        totalPrice: investigation.service.price
      }
    });

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_LAB';
    if (visitWithOrders.radiologyOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        action: 'CREATE_LAB_ORDER',
        entity: 'LabOrder',
        entityId: order.id,
        details: JSON.stringify({
          visitId,
          patientId,
          typeId,
          instructions,
          investigationType: order.type.name,
          serviceCode: order.type.service.code,
          servicePrice: order.type.service.price
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Lab order created successfully',
      order,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount
      },
      visitStatus: newStatus
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createMultipleLabOrders = async (req, res) => {
  try {
    const { visitId, patientId, orders } = multipleLabOrdersSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Check if consultation fee has been paid
    const consultationBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        services: {
          some: {
            service: {
              code: 'CONS001' // Consultation service code
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!consultationBilling || consultationBilling.status !== 'PAID') {
      return res.status(400).json({ error: 'Consultation fee must be paid before ordering lab tests' });
    }

    // Check for existing lab orders to prevent duplicates
    const existingLabOrders = await prisma.labOrder.findMany({
      where: {
        visitId: visitId,
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        type: true
      }
    });

    const existingBatchOrders = await prisma.batchOrder.findMany({
      where: {
        visitId: visitId,
        type: 'LAB',
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            investigationType: true
          }
        }
      }
    });

    // Get all already ordered lab test types
    const alreadyOrderedTypes = new Set();
    
    // Add from individual lab orders
    existingLabOrders.forEach(order => {
      alreadyOrderedTypes.add(order.typeId);
    });
    
    // Add from batch orders
    existingBatchOrders.forEach(batchOrder => {
      batchOrder.services.forEach(service => {
        if (service.investigationType && service.investigationType.category === 'LAB') {
          alreadyOrderedTypes.add(service.investigationType.id);
        }
      });
    });

    // Check for duplicates in the new orders
    const duplicateTypes = orders.filter(order => alreadyOrderedTypes.has(order.typeId));
    const newOrders = orders.filter(order => !alreadyOrderedTypes.has(order.typeId));

    if (duplicateTypes.length > 0) {
      const duplicateTypeNames = await prisma.investigationType.findMany({
        where: { id: { in: duplicateTypes.map(o => o.typeId) } },
        select: { id: true, name: true }
      });
      
      return res.status(400).json({ 
        error: 'Some lab tests have already been ordered',
        duplicates: duplicateTypeNames.map(t => t.name),
        message: `The following lab tests are already ordered: ${duplicateTypeNames.map(t => t.name).join(', ')}. Please remove them and try again.`,
        alreadyOrdered: duplicateTypeNames.map(t => ({ id: t.id, name: t.name }))
      });
    }

    if (newOrders.length === 0) {
      return res.status(400).json({ 
        error: 'All selected lab tests have already been ordered',
        message: 'All the lab tests you selected have already been ordered for this patient.'
      });
    }

    // Get the correct service IDs for each investigation type (only new orders)
    const investigationTypes = await prisma.investigationType.findMany({
      where: { 
        id: { in: newOrders.map(o => o.typeId) },
        category: 'LAB'
      },
      select: { id: true, serviceId: true }
    });

    // Convert individual orders to batch order format (only new orders)
    const batchOrderData = {
      visitId,
      patientId,
      type: 'LAB',
      instructions: 'Lab tests ordered by doctor',
      services: newOrders.map(order => {
        const investigation = investigationTypes.find(i => i.id === order.typeId);
        if (!investigation || !investigation.serviceId) {
          throw new Error(`Investigation type ${order.typeId} not found or not linked to a service`);
        }
        return {
          serviceId: investigation.serviceId,
          investigationTypeId: order.typeId,
          instructions: order.instructions || 'Lab test'
        };
      })
    };

    // Create batch order using the batch order controller
    const batchOrderController = require('./batchOrderController');
    req.body = batchOrderData;
    return await batchOrderController.createBatchOrder(req, res);

    // Validate all investigation types
    const investigationIds = orders.map(order => order.typeId);
    const investigations = await prisma.investigationType.findMany({
      where: { 
        id: { in: investigationIds },
        category: 'LAB'
      },
      include: { service: true }
    });

    if (investigations.length !== investigationIds.length) {
      return res.status(404).json({ error: 'One or more lab investigation types not found' });
    }

    // Check all investigations have services
    const missingServices = investigations.filter(inv => !inv.service);
    if (missingServices.length > 0) {
      return res.status(400).json({ error: 'One or more investigation types are not linked to services' });
    }

    // Create all lab orders
    const createdOrders = [];
    for (const orderData of orders) {
      const investigation = investigations.find(inv => inv.id === orderData.typeId);
      
      const order = await prisma.labOrder.create({
        data: { 
          visitId,
          doctorId, 
          patientId, 
          typeId: orderData.typeId, 
          instructions: orderData.instructions,
          status: 'UNPAID'
        },
        include: {
          type: {
            include: {
              service: true
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
      createdOrders.push(order);
    }

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    const totalAmount = investigations.reduce((sum, inv) => sum + inv.service.price, 0);

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + totalAmount
        }
      });
    }

    // Add services to billing (handle duplicates)
    for (const investigation of investigations) {
      // Check if service already exists in billing
      const existingService = await prisma.billingService.findFirst({
        where: {
          billingId: billing.id,
          serviceId: investigation.service.id
        }
      });

      if (existingService) {
        // Update quantity if service already exists
        await prisma.billingService.update({
          where: { id: existingService.id },
          data: {
            quantity: existingService.quantity + 1,
            totalPrice: (existingService.quantity + 1) * investigation.service.price
          }
        });
      } else {
        // Create new service entry
        await prisma.billingService.create({
          data: {
            billingId: billing.id,
            serviceId: investigation.service.id,
            quantity: 1,
            unitPrice: investigation.service.price,
            totalPrice: investigation.service.price
          }
        });
      }
    }

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_LAB';
    if (visitWithOrders.radiologyOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    res.json({
      message: 'Multiple lab orders created successfully',
      orders: createdOrders,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount
      },
      visitStatus: newStatus
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createRadiologyOrder = async (req, res) => {
  try {
    const { visitId, patientId, typeId, instructions } = radiologyOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Get investigation type with service
    const investigation = await prisma.investigationType.findUnique({ 
      where: { id: typeId, category: 'RADIOLOGY' },
      include: { service: true }
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Radiology investigation type not found' });
    }

    if (!investigation.service) {
      return res.status(400).json({ error: 'Investigation type is not linked to a service' });
    }

    // Create radiology order
    const order = await prisma.radiologyOrder.create({
      data: { 
        visitId,
        doctorId, 
        patientId, 
        typeId, 
        instructions,
        status: 'UNPAID'
      },
      include: {
        type: {
          include: {
            service: true
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

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.service.price,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + investigation.service.price
        }
      });
    }

    // Add service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: investigation.service.id,
        quantity: 1,
        unitPrice: investigation.service.price,
        totalPrice: investigation.service.price
      }
    });

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_RADIOLOGY';
    if (visitWithOrders.labOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    res.json({
      message: 'Radiology order created successfully',
      order,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount
      },
      visitStatus: newStatus
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createMultipleRadiologyOrders = async (req, res) => {
  try {
    const { visitId, patientId, orders } = createMultipleRadiologyOrdersSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Check if consultation fee has been paid
    const consultationBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        services: {
          some: {
            service: {
              code: 'CONS001' // Consultation service code
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!consultationBilling || consultationBilling.status !== 'PAID') {
      return res.status(400).json({ error: 'Consultation fee must be paid before ordering radiology tests' });
    }

    // Check for existing radiology orders to prevent duplicates
    const existingRadiologyOrders = await prisma.radiologyOrder.findMany({
      where: {
        visitId: visitId,
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        type: true
      }
    });

    const existingBatchOrders = await prisma.batchOrder.findMany({
      where: {
        visitId: visitId,
        type: 'RADIOLOGY',
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            investigationType: true
          }
        }
      }
    });

    // Get all already ordered radiology test types
    const alreadyOrderedTypes = new Set();
    
    // Add from individual radiology orders
    existingRadiologyOrders.forEach(order => {
      alreadyOrderedTypes.add(order.typeId);
    });
    
    // Add from batch orders
    existingBatchOrders.forEach(batchOrder => {
      batchOrder.services.forEach(service => {
        if (service.investigationType && service.investigationType.category === 'RADIOLOGY') {
          alreadyOrderedTypes.add(service.investigationType.id);
        }
      });
    });

    // Check for duplicates in the new orders
    const duplicateTypes = orders.filter(order => alreadyOrderedTypes.has(order.typeId));
    const newOrders = orders.filter(order => !alreadyOrderedTypes.has(order.typeId));

    if (duplicateTypes.length > 0) {
      const duplicateTypeNames = await prisma.investigationType.findMany({
        where: { id: { in: duplicateTypes.map(o => o.typeId) } },
        select: { id: true, name: true }
      });
      
      return res.status(400).json({ 
        error: 'Some radiology tests have already been ordered',
        duplicates: duplicateTypeNames.map(t => t.name),
        message: `The following radiology tests are already ordered: ${duplicateTypeNames.map(t => t.name).join(', ')}. Please remove them and try again.`,
        alreadyOrdered: duplicateTypeNames.map(t => ({ id: t.id, name: t.name }))
      });
    }

    if (newOrders.length === 0) {
      return res.status(400).json({ 
        error: 'All selected radiology tests have already been ordered',
        message: 'All the radiology tests you selected have already been ordered for this patient.'
      });
    }

    // Get the correct service IDs for each investigation type (only new orders)
    const investigationTypes = await prisma.investigationType.findMany({
      where: { 
        id: { in: newOrders.map(o => o.typeId) },
        category: 'RADIOLOGY'
      },
      select: { id: true, serviceId: true }
    });

    // Convert individual orders to batch order format (only new orders)
    const batchOrderData = {
      visitId,
      patientId,
      type: 'RADIOLOGY',
      instructions: 'Radiology tests ordered by doctor',
      services: newOrders.map(order => {
        const investigation = investigationTypes.find(i => i.id === order.typeId);
        if (!investigation || !investigation.serviceId) {
          throw new Error(`Investigation type ${order.typeId} not found or not linked to a service`);
        }
        return {
          serviceId: investigation.serviceId,
          investigationTypeId: order.typeId,
          instructions: order.instructions || 'Radiology test'
        };
      })
    };

    // Create batch order using the batch order controller
    const batchOrderController = require('./batchOrderController');
    req.body = batchOrderData;
    return await batchOrderController.createBatchOrder(req, res);

    // Validate all investigation types
    const investigationIds = orders.map(order => order.typeId);
    const investigations = await prisma.investigationType.findMany({
      where: { 
        id: { in: investigationIds },
        category: 'RADIOLOGY'
      },
      include: { service: true }
    });

    if (investigations.length !== investigationIds.length) {
      return res.status(400).json({ error: 'One or more invalid radiology investigation types' });
    }

    // Create all radiology orders
    const radiologyOrders = [];
    let totalAmount = 0;

    for (const order of orders) {
      const investigation = investigations.find(inv => inv.id === order.typeId);
      
      const radiologyOrder = await prisma.radiologyOrder.create({
        data: {
          visitId,
          patientId,
          doctorId,
          typeId: order.typeId,
          instructions: order.instructions || null,
          status: 'UNPAID'
        },
        include: {
          type: {
            include: { service: true }
          },
          visit: {
            select: { id: true, visitUid: true }
          }
        }
      });

      radiologyOrders.push(radiologyOrder);
      totalAmount += investigation.price;
    }

    // Create separate billings for each radiology order to avoid unique constraint
    const billings = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const investigation = investigations.find(inv => inv.id === order.typeId);
      
      const billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.price,
          status: 'PENDING',
          notes: `Radiology order - ${investigation.name}`
        }
      });
      
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: investigation.serviceId,
          quantity: 1,
          unitPrice: investigation.price,
          totalPrice: investigation.price
        }
      });
      
      billings.push(billing);
    }

    // Update visit status to sent to radiology
    await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'SENT_TO_RADIOLOGY' }
    });

    res.json({
      message: 'Multiple radiology orders created successfully',
      orders: radiologyOrders,
      billings: billings.map(b => ({
        id: b.id,
        totalAmount: b.totalAmount
      })),
      totalAmount: totalAmount,
      visitStatus: 'SENT_TO_RADIOLOGY'
    });

  } catch (error) {
    console.error('Multiple radiology orders creation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createMedicationOrder = async (req, res) => {
  try {
    console.log('🔍 Medication Order Request Body:', JSON.stringify(req.body, null, 2));
    
    const data = medicationOrderSchema.parse(req.body);
    console.log('✅ Parsed medication order data:', JSON.stringify(data, null, 2));
    
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, sent to lab, or awaiting results review
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'AWAITING_RESULTS_REVIEW'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, sent to lab/radiology, or awaiting results review to create orders' });
    }

    // Check if medication ordering is allowed based on investigation completion
    const medicationCheck = await checkMedicationOrderingAllowed(data.visitId);
    
    if (!medicationCheck.allowed) {
      return res.status(400).json({ 
        error: medicationCheck.reason
      });
    }

    // Create medication order
    const order = await prisma.medicationOrder.create({
      data: { 
        visitId: data.visitId,
        doctorId, 
        patientId: data.patientId, 
        name: data.name,
        dosageForm: data.dosageForm,
        strength: data.strength,
        quantity: data.quantity,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
        additionalNotes: data.additionalNotes,
        category: data.category,
        status: 'UNPAID'
      },
      include: {
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // Update inventory if medication is from catalog
    // Try to find the medication in the catalog and update its quantity
    try {
      const medicationCatalog = await prisma.medicationCatalog.findFirst({
        where: {
          name: {
            contains: data.name,
            mode: 'insensitive'
          },
          strength: data.strength,
          dosageForm: data.dosageForm
        }
      });

      if (medicationCatalog) {
        // Parse quantity to number for inventory update
        const orderedQuantity = parseInt(data.quantity) || 0;
        
        if (orderedQuantity > 0 && medicationCatalog.availableQuantity >= orderedQuantity) {
          // Update inventory
          await prisma.medicationCatalog.update({
            where: { id: medicationCatalog.id },
            data: {
              availableQuantity: {
                decrement: orderedQuantity
              }
            }
          });

          // Link the order to the catalog and set the price
          await prisma.medicationOrder.update({
            where: { id: order.id },
            data: {
              medicationCatalogId: medicationCatalog.id,
              unitPrice: medicationCatalog.unitPrice
            }
          });

          console.log(`Updated inventory for ${data.name}: -${orderedQuantity} units`);
        } else {
          console.warn(`Insufficient inventory for ${data.name}. Available: ${medicationCatalog.availableQuantity}, Ordered: ${orderedQuantity}`);
        }
      } else {
        console.log(`Medication ${data.name} not found in catalog - custom medication`);
      }
    } catch (inventoryError) {
      console.warn('Failed to update inventory:', inventoryError.message);
      // Don't fail the order if inventory update fails
    }

    // If it's a continuous infusion, create the infusion record and nurse tasks
    if (data.isContinuousInfusion && data.continuousInfusionDays && data.dailyDose) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.continuousInfusionDays);

      const continuousInfusion = await prisma.continuousInfusion.create({
        data: {
          medicationOrderId: order.id,
          startDate,
          endDate,
          dailyDose: data.dailyDose,
          frequency: data.frequency,
          days: data.continuousInfusionDays,
          status: 'UNPAID'
        }
      });

      // Create nurse administration tasks for each day
      const nurseTasks = [];
      for (let i = 0; i < data.continuousInfusionDays; i++) {
        const scheduledFor = new Date(startDate);
        scheduledFor.setDate(scheduledFor.getDate() + i);
        scheduledFor.setHours(9, 0, 0, 0); // Default to 9 AM

        nurseTasks.push({
          continuousInfusionId: continuousInfusion.id,
          scheduledFor,
          completed: false
        });
      }

      await prisma.nurseAdministration.createMany({
        data: nurseTasks
      });
    }

    // Create pharmacy invoice for medications (without service catalog requirement)
    // Medications are handled differently - they don't need to be in service catalog
    const pharmacyInvoice = await prisma.pharmacyInvoice.create({
        data: {
          patientId: data.patientId,
          visitId: data.visitId,
          totalAmount: 0, // Will be calculated by pharmacy when dispensing
          status: 'PENDING',
          notes: data.isContinuousInfusion ? 'Continuous infusion medication billing' : 'Medication order billing'
        }
    });

    // Create pharmacy invoice item for the medication
    // Fetch the updated order to get the correct unitPrice
    const updatedOrder = await prisma.medicationOrder.findUnique({
      where: { id: order.id }
    });
    
    // Set default price for custom medications (not in catalog)
    const unitPrice = updatedOrder.unitPrice || (updatedOrder.medicationCatalogId ? 0 : 5.0); // Default 5 ETB for custom medications
    const quantity = parseInt(order.quantity) || 1;
    const totalPrice = unitPrice * quantity;
    
    const pharmacyInvoiceItem = await prisma.pharmacyInvoiceItem.create({
      data: {
        pharmacyInvoiceId: pharmacyInvoice.id,
        medicationOrderId: order.id,
        medicationCatalogId: updatedOrder.medicationCatalogId,
        name: order.name,
        dosageForm: order.dosageForm,
        strength: order.strength,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      }
    });

    // Update pharmacy invoice total amount
    await prisma.pharmacyInvoice.update({
      where: { id: pharmacyInvoice.id },
      data: { 
        totalAmount: totalPrice,
        notes: `${pharmacyInvoiceItem.name} - ${pharmacyInvoiceItem.quantity} ${pharmacyInvoiceItem.dosageForm}`
      }
    });

    // For continuous infusion, create daily billing services
    if (data.isContinuousInfusion && data.continuousInfusionDays && data.dailyDose) {
      // Note: Continuous infusion billing is handled by the pharmacy when dispensing
      // The daily administration tasks are created above for nurse tracking
      console.log(`Continuous infusion created for ${data.continuousInfusionDays} days`);
    }

    // Update visit status to SENT_TO_PHARMACY after medication order
    await prisma.visit.update({
      where: { id: data.visitId },
      data: { status: 'SENT_TO_PHARMACY' }
    });

    res.json({
      message: 'Medication order created successfully',
      order,
      pharmacyInvoice: {
        id: pharmacyInvoice.id,
        totalAmount: totalPrice
      }
    });
  } catch (error) {
    console.error('❌ Error creating medication order:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.errors);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors ? error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) : error.issues ? error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) : [{ field: 'unknown', message: 'Validation error' }]
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// Check if medication ordering is allowed for a visit
exports.checkMedicationOrdering = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;
    
    // Import the utility function
    const { checkMedicationOrderingAllowed } = require('../utils/investigationUtils');
    
    const result = await checkMedicationOrderingAllowed(parseInt(visitId));
    
    res.json(result);
  } catch (error) {
    console.error('Error checking medication ordering:', error);
    res.status(500).json({ 
      allowed: false,
      reason: 'Error checking medication ordering status',
      error: error.message 
    });
  }
};

// Create doctor service order (for custom services like Booth Cleaning, Special Treatments, etc.)
exports.createDoctorServiceOrder = async (req, res) => {
  try {
    console.log('🔍 Doctor Service Order Request Body:', JSON.stringify(req.body, null, 2));
    
    const { visitId, patientId, serviceIds, assignedNurseId, instructions } = req.body;
    const doctorId = req.user.id;

    // Validate required fields
    if (!visitId || !patientId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: visitId, patientId, serviceIds' });
    }

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, awaiting results review, or sent to lab/radiology
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'AWAITING_RESULTS_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, awaiting results review, or sent to lab/radiology to create service orders' });
    }

    // Check if consultation fee has been paid
    const consultationBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        services: {
          some: {
            service: {
              code: 'CONS001' // Consultation service code
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!consultationBilling || consultationBilling.status !== 'PAID') {
      return res.status(400).json({ error: 'Consultation fee must be paid before ordering services' });
    }

    // Check if all services exist and are nurse services (or other services that can be handled by nurses)
    const services = await prisma.service.findMany({
      where: { 
        id: { in: serviceIds },
        category: { in: ['NURSE', 'PROCEDURE', 'OTHER'] }, // Allow nurse, procedure, and other services
        isActive: true
      }
    });

    if (services.length !== serviceIds.length) {
      return res.status(404).json({ error: 'One or more services not found or not available nurse services' });
    }

    // Check if assigned nurse exists and is available
    const assignedNurse = await prisma.user.findUnique({
      where: { id: assignedNurseId, role: 'NURSE', availability: true }
    });

    if (!assignedNurse) {
      return res.status(404).json({ error: 'Nurse not found or not available' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create doctor service assignments for each service
      const doctorServiceAssignments = [];
      for (const serviceId of serviceIds) {
        const assignment = await tx.nurseServiceAssignment.create({
          data: {
            visitId,
            serviceId,
            assignedNurseId,
            assignedById: 'nurse-123', // Use a default nurse ID for doctor orders
            status: 'PENDING',
            notes: instructions || `Doctor ordered: ${services.find(s => s.id === serviceId)?.name}`,
            orderType: 'DOCTOR_ORDERED' // New field to distinguish from triage-ordered services
          },
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        });
        doctorServiceAssignments.push(assignment);
      }

      // DON'T update visit status - keep patient in doctor's queue
      // The visit status will only change when nurse completes the services
      // This allows doctor to continue ordering lab/radiology tests

      // Calculate total amount for all services
      const totalAmount = services.reduce((sum, service) => sum + service.price, 0);

      // Create single billing entry for all services
      const billing = await tx.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount,
          status: 'PENDING',
          notes: `Doctor ordered services: ${services.map(s => s.name).join(', ')}`
        }
      });

      // Add all services to the single billing entry
      for (const service of services) {
        await tx.billingService.create({
          data: {
            billingId: billing.id,
            serviceId: service.id,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price
          }
        });
      }

      return { doctorServiceAssignments, billing };
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: null, // Temporarily set to null to avoid constraint issue
        action: 'CREATE_DOCTOR_SERVICE_ORDER',
        entity: 'NurseServiceAssignment',
        entityId: result.doctorServiceAssignments[0]?.id || 0, // Use first assignment ID
        details: JSON.stringify({
          visitId,
          patientId,
          serviceIds,
          assignedNurseId,
          instructions,
          orderType: 'DOCTOR_ORDERED',
          totalAmount: result.billing.totalAmount,
          doctorId: doctorId // Include doctor ID in details instead
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: `${serviceIds.length} service(s) ordered successfully`,
      assignments: result.doctorServiceAssignments,
      billing: {
        id: result.billing.id,
        totalAmount: result.billing.totalAmount,
        status: result.billing.status
      },
      visitStatus: visit.status // Keep current status, don't change it
    });

  } catch (error) {
    console.error('Error creating doctor service order:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get comprehensive patient history
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        insurance: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all visits with complete details
    const visits = await prisma.visit.findMany({
      where: { patientId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        radiologyOrders: {
          include: {
            type: true,
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        medicationOrders: {
          include: {
            continuousInfusion: {
              include: {
                nurseTasks: {
                  include: {
                    administeredBy: {
                      select: {
                        id: true,
                        fullname: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        pharmacyInvoices: {
          include: {
            dispensedMedicines: {
              include: {
                medicationOrder: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                investigationType: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true,
        diagnosisNotes: {
          include: {
            doctor: {
              select: {
                id: true,
                fullname: true,
                role: true
              }
            }
          }
        },
        galleryImages: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                fullname: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        nurseServiceAssignments: {
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get medical history
    const medicalHistory = await prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });

    // Add radiology and lab results to each visit
    const visitsWithResults = await Promise.all(visits.map(async (visit) => {
      // Get radiology results for batch orders
      const radiologyResults = await prisma.radiologyResult.findMany({
        where: {
          batchOrderId: {
            in: visit.batchOrders
              .filter(bo => bo.type === 'RADIOLOGY')
              .map(bo => bo.id)
          }
        },
        include: {
          testType: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get detailed lab results from DetailedLabResult table
      const batchOrderIds = visit.batchOrders
        .filter(bo => bo.type === 'LAB')
        .map(bo => bo.id);
      
      const detailedLabResults = await prisma.detailedLabResult.findMany({
        where: {
          labOrderId: {
            in: batchOrderIds
          }
        },
        include: {
          template: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Convert detailed lab results to the expected format
      const labResults = detailedLabResults.map(result => {
        // Get template fields
        const templateFields = result.template.fields || {};
        
        // Convert results object to array format
        let detailedResultsArray = [];
        if (result.results && typeof result.results === 'object') {
          // If results is an object (key-value pairs), convert to array
          detailedResultsArray = Object.entries(templateFields).map(([fieldName, fieldConfig]) => ({
            testName: fieldName,
            result: result.results[fieldName] || null,
            unit: fieldConfig.unit || '',
            referenceRange: fieldConfig.referenceRange || ''
          }));
        }
        
        return {
          id: result.id,
          testType: {
            name: result.template.name,
            category: result.template.category
          },
          resultText: detailedResultsArray.length > 0 ? `Detailed results for ${result.template.name}` : null,
          detailedResults: detailedResultsArray,
          additionalNotes: result.additionalNotes || '',
          status: result.status,
          attachments: [], // Detailed lab results don't have separate attachments
          createdAt: result.createdAt,
          verifiedBy: result.verifiedBy,
          verifiedAt: result.verifiedAt
        };
      });

      // Also include lab orders from batch order services (both filled and unfilled)
      for (const batchOrder of visit.batchOrders) {
        if (batchOrder.type === 'LAB') {
          for (const service of batchOrder.services) {
            // Check if we already have a detailed result for this service
            const hasDetailedResult = detailedLabResults.some(dr => 
              dr.labOrderId === batchOrder.id
            );
            
            // If no detailed result exists, still show the order
            if (!hasDetailedResult) {
              labResults.push({
                id: `batch-${batchOrder.id}-${service.id}`,
                testType: service.investigationType || { name: 'Lab Test', category: 'GENERAL' },
                resultText: service.result || null,
                detailedResults: [],
                additionalNotes: service.additionalNotes || '',
                status: service.status,
                attachments: [],
                createdAt: batchOrder.createdAt
              });
            }
          }
        }
      }

      return {
        ...visit,
        radiologyResults,
        labResults
      };
    }));

    res.json({
      patient,
      visits: visitsWithResults,
      medicalHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeVisit = async (req, res) => {
  try {
    const { visitId, diagnosis, diagnosisDetails, instructions, finalNotes, needsAppointment, appointmentDate, appointmentTime, appointmentNotes } = completeVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    console.log('🔍 Completing visit:', visitId, 'by doctor:', doctorId);

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        vitals: true,
        labOrders: true,
        radiologyOrders: true,
        medicationOrders: {
          include: {
            continuousInfusion: true
          }
        },
        batchOrders: {
          include: {
            detailedResults: {
              include: {
                template: true
              }
            },
            attachments: true,
            services: {
              include: {
                service: true,
                investigationType: true
              }
            }
          }
        },
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true,
        diagnosisNotes: true,
        nurseServiceAssignments: {
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['UNDER_DOCTOR_REVIEW', 'SENT_TO_PHARMACY', 'AWAITING_RESULTS_REVIEW', 'NURSE_SERVICES_COMPLETED'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be under doctor review, sent to pharmacy, awaiting results review, or nurse services completed to complete' });
    }

    // Fetch detailed lab and radiology results
    const detailedLabResults = await prisma.detailedLabResult.findMany({
      where: {
        labOrder: {
          visitId: visitId
        }
      },
      include: {
        labOrder: true,
        template: true
      }
    });

    const radiologyResults = await prisma.radiologyResult.findMany({
      where: {
        batchOrder: {
          visitId: visitId
        }
      },
      include: {
        batchOrder: true
      }
    });

    // Extract diagnosis information from diagnosis notes if available
    let extractedDiagnosis = diagnosis;
    let extractedDiagnosisDetails = diagnosisDetails;
    let extractedInstructions = instructions;
    let extractedFinalNotes = finalNotes;

    if (visit.diagnosisNotes.length > 0) {
      const notes = visit.diagnosisNotes[0];
      // Extract primary diagnosis from assessment and diagnosis field
      if (notes.assessmentAndDiagnosis && notes.assessmentAndDiagnosis.trim()) {
        extractedDiagnosis = notes.assessmentAndDiagnosis;
      }
      // Extract diagnosis details from investigation findings and assessment
      if (notes.investigationFindings && notes.investigationFindings.trim()) {
        extractedDiagnosisDetails = notes.investigationFindings;
      }
      // Extract instructions from treatment plan and medication issued
      if (notes.treatmentPlan && notes.treatmentPlan.trim()) {
        extractedInstructions = notes.treatmentPlan;
      }
      // Extract final notes from prognosis and additional fields
      if (notes.prognosis && notes.prognosis.trim()) {
        extractedFinalNotes = notes.prognosis;
      }
    }

    // Create comprehensive medical history snapshot
    const medicalHistoryData = {
      visitId: visit.id,
      visitUid: visit.visitUid,
      patientId: visit.patientId,
      visitDate: visit.date,
      completedDate: new Date(),
      doctorId: doctorId,
      
      // Diagnosis & Notes (extracted from diagnosis notes)
      diagnosis: extractedDiagnosis,
      diagnosisDetails: extractedDiagnosisDetails,
      instructions: extractedInstructions,
      finalNotes: extractedFinalNotes,
      
      // Vitals
      vitals: visit.vitals.map(vital => ({
        id: vital.id,
        temperature: vital.temperature,
        bloodPressure: vital.bloodPressure,
        heartRate: vital.heartRate,
        respiratoryRate: vital.respiratoryRate,
        oxygenSaturation: vital.oxygenSaturation,
        weight: vital.weight,
        height: vital.height,
        bmi: vital.bmi,
        recordedAt: vital.recordedAt,
        recordedBy: vital.recordedBy
      })),
      
      // Lab Orders & Results
      labOrders: visit.labOrders.map(order => ({
        id: order.id,
        type: order.type,
        result: order.result,
        status: order.status,
        attachments: order.attachments,
        createdAt: order.createdAt
      })),
      
      // Detailed Lab Results
      detailedLabResults: detailedLabResults.map(result => ({
        id: result.id,
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        referenceRange: result.referenceRange,
        status: result.status,
        notes: result.notes,
        attachments: result.attachments,
        createdAt: result.createdAt
      })),
      
      // Radiology Orders & Results
      radiologyOrders: visit.radiologyOrders.map(order => ({
        id: order.id,
        type: order.type,
        result: order.result,
        status: order.status,
        attachments: order.attachments,
        createdAt: order.createdAt
      })),
      
      // Radiology Results
      radiologyResults: radiologyResults.map(result => ({
        id: result.id,
        testName: result.testName,
        findings: result.findings,
        impression: result.impression,
        recommendations: result.recommendations,
        attachments: result.attachments,
        createdAt: result.createdAt
      })),
      
      // Medication Orders
      medicationOrders: visit.medicationOrders.map(order => ({
        id: order.id,
        name: order.name,
        dosageForm: order.dosageForm,
        strength: order.strength,
        quantity: order.quantity,
        frequency: order.frequency,
        duration: order.duration,
        instructions: order.instructions,
        additionalNotes: order.additionalNotes,
        status: order.status,
        createdAt: order.createdAt
      })),
      
      // Dental Records
      dentalRecords: visit.dentalRecords.map(record => ({
        id: record.id,
        toothChart: record.toothChart,
        painFlags: record.painFlags,
        gumCondition: record.gumCondition,
        oralHygiene: record.oralHygiene,
        notes: record.notes,
        createdAt: record.createdAt
      })),
      
      // Dental Photos
      dentalPhotos: visit.dentalPhotos.map(photo => ({
        id: photo.id,
        toothNumber: photo.toothNumber,
        photoType: photo.photoType,
        fileName: photo.fileName,
        filePath: photo.filePath,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        uploadedAt: photo.uploadedAt
      })),
      
      // Patient Attached Images
      attachedImages: visit.attachedImages.map(image => ({
        id: image.id,
        fileName: image.fileName,
        filePath: image.filePath.replace(/^.*\/uploads\//, 'uploads/'),
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        uploadedAt: image.uploadedAt
      })),
      
      // Diagnosis Notes
      diagnosisNotes: visit.diagnosisNotes.map(note => ({
        id: note.id,
        diagnosis: note.assessmentAndDiagnosis,
        notes: note.additional || note.treatmentPlan || '',
        chiefComplaint: note.chiefComplaint,
        historyOfPresentIllness: note.historyOfPresentIllness,
        pastMedicalHistory: note.pastMedicalHistory,
        allergicHistory: note.allergicHistory,
        physicalExamination: note.physicalExamination,
        investigationFindings: note.investigationFindings,
        assessmentAndDiagnosis: note.assessmentAndDiagnosis,
        treatmentPlan: note.treatmentPlan,
        treatmentGiven: note.treatmentGiven,
        medicationIssued: note.medicationIssued,
        additional: note.additional,
        prognosis: note.prognosis,
        doctor: note.doctor,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      })),
      
      // Nurse Services
      nurseServices: visit.nurseServiceAssignments.map(assignment => ({
        id: assignment.id,
        serviceName: assignment.service.name,
        serviceCode: assignment.service.code,
        servicePrice: assignment.service.price,
        serviceDescription: assignment.service.description,
        assignedNurse: assignment.assignedNurse.fullname,
        assignedBy: assignment.assignedBy.fullname,
        status: assignment.status,
        notes: assignment.notes,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt
      })),
      
      // Bills & Payments
      bills: visit.bills.map(bill => ({
        id: bill.id,
        total: bill.total,
        status: bill.status,
        services: bill.services.map(service => ({
          serviceName: service.service.name,
          serviceCode: service.service.code,
          quantity: service.quantity,
          unitPrice: service.unitPrice,
          totalPrice: service.totalPrice
        })),
        payments: bill.payments,
        createdAt: bill.createdAt
      })),
      
      completedAt: new Date(),
      completedBy: doctorId
    };

    // Update visit status and create medical history
    await prisma.$transaction(async (tx) => {
      // Create appointment if needed
      let appointment = null;
      if (needsAppointment && appointmentDate && appointmentTime) {
        appointment = await tx.appointment.create({
          data: {
            patientId: visit.patientId,
            doctorId: doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime: appointmentTime,
            type: 'FOLLOW_UP',
            status: 'SCHEDULED',
            notes: appointmentNotes || 'Follow-up appointment',
            createdById: doctorId
          }
        });
      }

      // Update visit
      await tx.visit.update({
        where: { id: visitId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          diagnosis: extractedDiagnosis,
          diagnosisDetails: extractedDiagnosisDetails,
          instructions: extractedInstructions,
          notes: extractedFinalNotes ? `${visit.notes || ''}\n\nFinal Notes: ${extractedFinalNotes}` : visit.notes
        }
      });

      // Add appointment to medical history data
      if (appointment) {
        medicalHistoryData.appointment = {
          id: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes
        };
      }

      // Create medical history with comprehensive data
      await tx.medicalHistory.create({
        data: {
          patientId: visit.patientId,
          visitId: visit.id,
          doctorId: doctorId,
          visitUid: visit.visitUid,
          visitDate: visit.date,
          completedDate: new Date(),
          details: JSON.stringify(medicalHistoryData),
          diagnosis: extractedDiagnosis,
          diagnosisDetails: extractedDiagnosisDetails,
          instructions: extractedInstructions,
          finalNotes: extractedFinalNotes,
          needsAppointment: needsAppointment || false,
          appointmentId: appointment ? appointment.id : null
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: doctorId,
          action: 'COMPLETE_VISIT',
          entity: 'Visit',
          entityId: visitId,
          details: JSON.stringify({
            visitId,
            diagnosis,
            diagnosisDetails,
            instructions,
            finalNotes,
            needsAppointment,
            appointmentDate,
            appointmentTime,
            appointmentNotes
          }),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Update medication orders to QUEUED if they're PAID
      await tx.medicationOrder.updateMany({
        where: {
          visitId: visitId,
          status: 'PAID'
        },
        data: {
          status: 'QUEUED'
        }
      });
    });

    res.json({
      message: 'Visit completed successfully',
      visitId: visit.id,
      visitUid: visit.visitUid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get patient vitals data for doctor
exports.getPatientVitals = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    // Check if doctor is assigned to this visit
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if doctor is assigned to this patient
    const assignment = await prisma.assignment.findFirst({
      where: {
        patientId: visit.patientId,
        doctorId: doctorId,
        status: {
          in: ['Active', 'Pending']
        }
      }
    });

    // For now, allow any doctor to access vitals (for testing purposes)
    // TODO: Re-enable assignment check in production
    // if (!assignment) {
    //   return res.status(403).json({ error: 'You are not assigned to this patient' });
    // }

    // Get the most recent vitals for this visit
    const vitals = await prisma.vitalSign.findFirst({
      where: {
        visitId: parseInt(visitId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!vitals) {
      return res.status(404).json({ error: 'No vitals recorded for this visit' });
    }

    res.json({
      vitals: {
        // Basic Vitals
        bloodPressure: vitals.bloodPressure,
        temperature: vitals.temperature,
        heartRate: vitals.heartRate,
        height: vitals.height,
        weight: vitals.weight,
        bmi: vitals.bmi,
        oxygenSaturation: vitals.oxygenSaturation,
        condition: vitals.condition,
        notes: vitals.notes,
        
        // Chief Complaint & History
        chiefComplaint: vitals.chiefComplaint,
        historyOfPresentIllness: vitals.historyOfPresentIllness,
        onsetOfSymptoms: vitals.onsetOfSymptoms,
        durationOfSymptoms: vitals.durationOfSymptoms,
        severityOfSymptoms: vitals.severityOfSymptoms,
        associatedSymptoms: vitals.associatedSymptoms,
        relievingFactors: vitals.relievingFactors,
        aggravatingFactors: vitals.aggravatingFactors,
        
        // Physical Examination
        generalAppearance: vitals.generalAppearance,
        headAndNeck: vitals.headAndNeck,
        cardiovascularExam: vitals.cardiovascularExam,
        respiratoryExam: vitals.respiratoryExam,
        abdominalExam: vitals.abdominalExam,
        extremities: vitals.extremities,
        neurologicalExam: vitals.neurologicalExam,
        
        createdAt: vitals.createdAt
      },
      patient: visit.patient
    });
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get current order status for a visit (to show which tests are already ordered)
exports.getVisitOrderStatus = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Get existing lab orders
    const existingLabOrders = await prisma.labOrder.findMany({
      where: {
        visitId: parseInt(visitId),
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        type: true
      }
    });

    // Get existing radiology orders
    const existingRadiologyOrders = await prisma.radiologyOrder.findMany({
      where: {
        visitId: parseInt(visitId),
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        type: true
      }
    });

    // Get existing batch orders
    const existingBatchOrders = await prisma.batchOrder.findMany({
      where: {
        visitId: parseInt(visitId),
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            investigationType: true
          }
        }
      }
    });

    // Extract ordered test types
    const orderedLabTypes = new Set();
    const orderedRadiologyTypes = new Set();

    // Add from individual lab orders
    existingLabOrders.forEach(order => {
      orderedLabTypes.add(order.typeId);
    });

    // Add from individual radiology orders
    existingRadiologyOrders.forEach(order => {
      orderedRadiologyTypes.add(order.typeId);
    });

    // Add from batch orders
    existingBatchOrders.forEach(batchOrder => {
      batchOrder.services.forEach(service => {
        if (service.investigationType) {
          if (service.investigationType.category === 'LAB') {
            orderedLabTypes.add(service.investigationType.id);
          } else if (service.investigationType.category === 'RADIOLOGY') {
            orderedRadiologyTypes.add(service.investigationType.id);
          }
        }
      });
    });

    res.json({
      visitId: parseInt(visitId),
      orderedLabTypes: Array.from(orderedLabTypes),
      orderedRadiologyTypes: Array.from(orderedRadiologyTypes),
      labOrders: existingLabOrders.map(order => ({
        id: order.id,
        typeId: order.typeId,
        typeName: order.type.name,
        status: order.status,
        instructions: order.instructions,
        createdAt: order.createdAt
      })),
      radiologyOrders: existingRadiologyOrders.map(order => ({
        id: order.id,
        typeId: order.typeId,
        typeName: order.type.name,
        status: order.status,
        instructions: order.instructions,
        createdAt: order.createdAt
      })),
      batchOrders: existingBatchOrders.map(batchOrder => ({
        id: batchOrder.id,
        type: batchOrder.type,
        status: batchOrder.status,
        services: batchOrder.services.map(service => ({
          id: service.id,
          investigationTypeId: service.investigationType?.id,
          investigationTypeName: service.investigationType?.name,
          category: service.investigationType?.category
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching visit order status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Batch prescription submission
exports.createBatchPrescription = async (req, res) => {
  try {
    console.log('🔍 createBatchPrescription - Request body:', req.body);
    const { visitId, patientId, medications } = req.body;
    const doctorId = req.user.id;
    console.log('🔍 createBatchPrescription - Extracted:', { visitId, patientId, medications, doctorId });

    // Validate required fields
    if (!visitId || !patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: visitId, patientId, and medications array'
      });
    }

    // Validate each medication
    const medicationSchema = z.object({
      medicationCatalogId: z.string().nullable().optional(),
      name: z.string().min(1, 'Medication name is required'),
      genericName: z.string().nullable().optional(),
      dosageForm: z.string().min(1, 'Dosage form is required'),
      strength: z.string().min(1, 'Strength is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      frequency: z.string().nullable().optional(),
      duration: z.string().nullable().optional(),
      instructions: z.string().nullable().optional(),
      additionalNotes: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      type: z.string().default('Prescription'),
      unitPrice: z.number().nullable().optional()
    });

    // Validate all medications
    for (const medication of medications) {
      try {
        medicationSchema.parse(medication);
      } catch (validationError) {
        console.log('🔍 Validation error:', validationError);
        return res.status(400).json({
          success: false,
          error: `Invalid medication data: ${validationError.errors?.[0]?.message || validationError.message}`,
          details: validationError.errors || [validationError.message]
        });
      }
    }

    // Check if visit exists and doctor is assigned
    console.log('🔍 createBatchPrescription - Looking up visit:', parseInt(visitId));
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: true
      }
    });
    console.log('🔍 createBatchPrescription - Visit found:', !!visit);

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    // Check if doctor is assigned to this patient
    const assignment = await prisma.assignment.findFirst({
      where: {
        patientId: visit.patientId,
        doctorId: doctorId,
        status: { in: ['Active', 'Pending'] }
      }
    });
    console.log('🔍 createBatchPrescription - Assignment found:', !!assignment);

    if (!assignment) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this patient'
      });
    }

    // Validate medication catalog IDs if provided
    const catalogIds = medications
      .map(m => m.medicationCatalogId)
      .filter(Boolean);

    if (catalogIds.length > 0) {
      const existingMedications = await prisma.medicationCatalog.findMany({
        where: { id: { in: catalogIds } },
        select: { id: true, name: true, availableQuantity: true }
      });

      const existingIds = existingMedications.map(m => m.id);
      const missingIds = catalogIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Medications not found in catalog: ${missingIds.join(', ')}`
        });
      }

      // Check stock availability
      const lowStockMedications = existingMedications.filter(med => {
        const requestedMed = medications.find(m => m.medicationCatalogId === med.id);
        return requestedMed && med.availableQuantity < requestedMed.quantity;
      });

      if (lowStockMedications.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock for some medications',
          lowStock: lowStockMedications.map(med => {
            const requestedMed = medications.find(m => m.medicationCatalogId === med.id);
            return {
              id: med.id,
              name: med.name,
              available: med.availableQuantity,
              requested: requestedMed ? requestedMed.quantity : 0
            };
          })
        });
      }
    }

    // Create medication orders
    console.log('🔍 createBatchPrescription - Creating medication orders...');
    const medicationData = medications.map(medication => ({
      visitId: parseInt(visitId),
      patientId,
      doctorId,
      medicationCatalogId: medication.medicationCatalogId || null,
      name: medication.name,
      genericName: medication.genericName || null,
      dosageForm: medication.dosageForm,
      strength: medication.strength,
      quantity: medication.quantity,
      frequency: medication.frequency || null,
      duration: medication.duration || null,
      instructions: medication.instructions || null,
      additionalNotes: medication.additionalNotes || null,
      category: medication.category || null,
      type: medication.type || 'Prescription',
      unitPrice: medication.unitPrice || null,
      status: 'UNPAID'
    }));
    console.log('🔍 createBatchPrescription - Medication data:', medicationData);
    
    const createdOrders = await prisma.medicationOrder.createMany({
      data: medicationData
    });
    console.log('🔍 createBatchPrescription - Created orders:', createdOrders);

    // Create pharmacy invoice for the medications
    const totalAmount = medications.reduce((total, med) => {
      return total + ((med.unitPrice || 0) * med.quantity);
    }, 0);

    const pharmacyInvoice = await prisma.pharmacyInvoice.create({
      data: {
        patientId,
        visitId: parseInt(visitId),
        totalAmount,
        status: 'PENDING',
        notes: 'Doctor prescribed medications',
        type: 'DOCTOR_PRESCRIPTION'
      }
    });

    // Get the created medication orders to link them to invoice items
    const createdOrderIds = await prisma.medicationOrder.findMany({
      where: { 
        visitId: parseInt(visitId),
        patientId,
        doctorId
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
      take: medications.length
    });

    // Create pharmacy invoice items for each medication
    const invoiceItems = await prisma.pharmacyInvoiceItem.createMany({
      data: medications.map((medication, index) => ({
        pharmacyInvoiceId: pharmacyInvoice.id,
        medicationOrderId: createdOrderIds[index]?.id || null, // Use createdOrderIds instead of createdOrders
        medicationCatalogId: medication.medicationCatalogId || null,
        name: medication.name,
        dosageForm: medication.dosageForm,
        strength: medication.strength,
        quantity: medication.quantity,
        unitPrice: medication.unitPrice || 0,
        totalPrice: (medication.unitPrice || 0) * medication.quantity
      }))
    });


    // Update visit status to include pharmacy
    await prisma.visit.update({
      where: { id: parseInt(visitId) },
      data: { 
        status: 'SENT_TO_PHARMACY',
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Prescription submitted successfully',
      ordersCreated: createdOrders.count,
      pharmacyInvoiceId: pharmacyInvoice.id,
      totalAmount,
      visitId: parseInt(visitId),
      patientId,
      medications: medications.map(med => ({
        name: med.name,
        dosageForm: med.dosageForm,
        strength: med.strength,
        quantity: med.quantity
      }))
    });

  } catch (error) {
    console.error('Error creating batch prescription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create prescription',
      details: error.message
    });
  }
};

// Get prescription history for a visit
exports.getPrescriptionHistory = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    // Check if doctor is assigned to this visit
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: true,
        vitals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    if (visit.assignments.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this patient'
      });
    }

    // Get all medication orders for this visit
    const prescriptions = await prisma.medicationOrder.findMany({
      where: { visitId: parseInt(visitId) },
      include: {
        medicationCatalog: {
          select: {
            id: true,
            name: true,
            genericName: true,
            unitPrice: true,
            availableQuantity: true
          }
        },
        dispensedMedicines: {
          include: {
            pharmacyInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                dispensedAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      prescriptions: prescriptions.map(prescription => ({
        id: prescription.id,
        name: prescription.name,
        genericName: prescription.genericName,
        dosageForm: prescription.dosageForm,
        strength: prescription.strength,
        quantity: prescription.quantity,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions,
        additionalNotes: prescription.additionalNotes,
        category: prescription.category,
        type: prescription.type,
        unitPrice: prescription.unitPrice,
        status: prescription.status,
        createdAt: prescription.createdAt,
        catalogInfo: prescription.medicationCatalog,
        dispensedInfo: prescription.dispensedMedicines.map(dispensed => ({
          id: dispensed.id,
          quantity: dispensed.quantity,
          status: dispensed.status,
          dispensedAt: dispensed.dispensedAt,
          pharmacyInvoice: dispensed.pharmacyInvoice
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching prescription history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prescription history',
      details: error.message
    });
  }
};

// Direct complete visit (for patients who don't need lab/radiology orders)
exports.directCompleteVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    // Check if doctor is assigned to this visit
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: true,
        vitals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    if (visit.assignments.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this patient'
      });
    }

    // Update visit status to AWAITING_RESULTS_REVIEW
    await prisma.visit.update({
      where: { id: parseInt(visitId) },
      data: {
        status: 'AWAITING_RESULTS_REVIEW',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Visit moved to results queue for medication prescription'
    });

  } catch (error) {
    console.error('Error completing visit directly:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete visit',
      details: error.message
    });
  }
};

// Save diagnosis notes for a visit
exports.saveDiagnosisNotes = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.id;

    console.log('🔍 Saving diagnosis notes for visit:', visitId);
    console.log('📝 Notes data:', Object.keys(notes).map(key => `${key}: ${(notes[key] || '').length} chars`));

    // Sanitize notes data - convert null/undefined to empty strings
    const sanitizedNotes = Object.keys(notes).reduce((acc, key) => {
      acc[key] = notes[key] || '';
      return acc;
    }, {});

    // Check if visit exists and doctor has access
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if doctor has access to this visit
    const assignment = await prisma.assignment.findFirst({
      where: { 
        patientId: visit.patientId,
        doctorId: doctorId
      }
    });

    const hasBatchOrder = await prisma.batchOrder.findFirst({
      where: {
        visitId: parseInt(visitId),
        doctorId: doctorId
      }
    });

    if (!assignment && !hasBatchOrder) {
      return res.status(403).json({ error: 'Access denied to this visit' });
    }

    // Create or update diagnosis notes
    const existingNotes = await prisma.diagnosisNotes.findFirst({
      where: { visitId: parseInt(visitId) }
    });

    let diagnosisNotes;
    if (existingNotes) {
      // Update existing notes
      diagnosisNotes = await prisma.diagnosisNotes.update({
        where: { id: existingNotes.id },
        data: {
          ...sanitizedNotes,
          updatedAt: new Date(),
          updatedBy: doctorId
        }
      });
    } else {
      // Create new notes
      diagnosisNotes = await prisma.diagnosisNotes.create({
        data: {
          visitId: parseInt(visitId),
          patientId: visit.patientId,
          doctorId: doctorId,
          ...sanitizedNotes,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log('✅ Diagnosis notes saved successfully');

    res.json({
      message: 'Diagnosis notes saved successfully',
      notes: diagnosisNotes
    });
  } catch (error) {
    console.error('❌ Error saving diagnosis notes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get diagnosis notes for a visit
exports.getDiagnosisNotes = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    console.log('🔍 Getting diagnosis notes for visit:', visitId);

    // Check if visit exists and doctor has access
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check if doctor has access to this visit
    const assignment = await prisma.assignment.findFirst({
      where: { 
        patientId: visit.patientId,
        doctorId: doctorId
      }
    });

    const hasBatchOrder = await prisma.batchOrder.findFirst({
      where: {
        visitId: parseInt(visitId),
        doctorId: doctorId
      }
    });

    if (!assignment && !hasBatchOrder) {
      return res.status(403).json({ error: 'Access denied to this visit' });
    }

    // Get diagnosis notes
    const diagnosisNotes = await prisma.diagnosisNotes.findFirst({
      where: { visitId: parseInt(visitId) },
      include: {
        doctor: {
          select: {
            id: true,
            fullname: true
          }
        }
      }
    });

    console.log('✅ Diagnosis notes retrieved successfully');

    res.json({
      notes: diagnosisNotes || {
        chiefComplaint: '',
        historyOfPresentIllness: '',
        pastMedicalHistory: '',
        allergicHistory: '',
        physicalExamination: '',
        investigationFindings: '',
        assessmentAndDiagnosis: '',
        treatmentPlan: '',
        treatmentGiven: '',
        medicationIssued: '',
        additional: '',
        prognosis: ''
      }
    });
  } catch (error) {
    console.error('❌ Error getting diagnosis notes:', error);
    res.status(500).json({ error: error.message });
  }
};