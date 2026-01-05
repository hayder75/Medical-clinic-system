// Add this at the end of the file, before the closing

// Get all patients (for admin patient management)
exports.getAllPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          insurance: true,
          _count: {
            select: {
              visits: true,
              bills: true,
              labTestOrders: true,
              radiologyOrders: true,
              medicationOrders: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ]);
    
    res.json({
      patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete patient with cascade deletion of all related records
exports.deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        _count: {
          select: {
            visits: true,
            bills: true,
            labTestOrders: true,
            radiologyOrders: true,
            medicationOrders: true,
            appointments: true,
            dentalRecords: true,
            dentalPhotos: true,
            attachedImages: true,
            files: true,
            vitals: true,
            assignments: true,
            orders: true,
            dispenseLogs: true,
            history: true,
            payments: true,
            pharmacyInvoices: true,
            virtualQueues: true,
            medicalCertificates: true,
            diagnosisNotes: true,
            cardActivations: true,
            cashTransactions: true,
            galleryImages: true,
            insuranceTransactions: true,
            accountDeposits: true,
            accountTransactions: true,
            accountRequests: true,
            dentalProcedureCompletions: true,
            nurseWalkInOrders: true,
            emergencyDrugOrders: true,
            materialNeedsOrders: true,
            batchOrders: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Use transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete all visits and their related data first
      const visits = await tx.visit.findMany({
        where: { patientId },
        include: {
          vitals: true,
          labOrders: true,
          labTestOrders: true,
          radiologyOrders: true,
          medicationOrders: true,
          bills: true,
          dentalRecords: true,
          dentalPhotos: true,
          attachedImages: true,
          medicalCertificates: true,
          diagnosisNotes: true,
          nurseServiceAssignments: true,
          emergencyDrugOrders: true,
          materialNeedsOrders: true,
          galleryImages: true,
          insuranceTransactions: true,
          accountTransactions: true,
          dentalProcedureCompletions: true
        }
      });

      // Delete visit-related data
      for (const visit of visits) {
        // Delete visit-related records
        if (visit.vitals.length > 0) {
          await tx.vitalSign.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.labOrders.length > 0) {
          await tx.labOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.labTestOrders.length > 0) {
          await tx.labTestOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.radiologyOrders.length > 0) {
          await tx.radiologyOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.medicationOrders.length > 0) {
          await tx.medicationOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.bills.length > 0) {
          // Delete billing services first
          for (const bill of visit.bills) {
            await tx.billingService.deleteMany({ where: { billingId: bill.id } });
            await tx.billPayment.deleteMany({ where: { billingId: bill.id } });
          }
          await tx.billing.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.dentalRecords.length > 0) {
          await tx.dentalRecord.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.dentalPhotos.length > 0) {
          await tx.dentalPhoto.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.attachedImages.length > 0) {
          await tx.patientAttachedImage.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.medicalCertificates.length > 0) {
          await tx.medicalCertificate.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.diagnosisNotes.length > 0) {
          await tx.diagnosisNotes.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.nurseServiceAssignments.length > 0) {
          await tx.nurseServiceAssignment.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.emergencyDrugOrders.length > 0) {
          await tx.emergencyDrugOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.materialNeedsOrders.length > 0) {
          await tx.materialNeedsOrder.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.galleryImages.length > 0) {
          await tx.patientGallery.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.insuranceTransactions.length > 0) {
          await tx.insuranceTransaction.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.accountTransactions.length > 0) {
          await tx.accountTransaction.deleteMany({ where: { visitId: visit.id } });
        }
        if (visit.dentalProcedureCompletions.length > 0) {
          await tx.dentalProcedureCompletion.deleteMany({ where: { visitId: visit.id } });
        }
      }

      // Delete visits
      await tx.visit.deleteMany({ where: { patientId } });

      // Delete patient-level records
      await tx.vitalSign.deleteMany({ where: { patientId } });
      await tx.assignment.deleteMany({ where: { patientId } });
      await tx.appointment.deleteMany({ where: { patientId } });
      await tx.dentalRecord.deleteMany({ where: { patientId } });
      await tx.dentalPhoto.deleteMany({ where: { patientId } });
      await tx.patientAttachedImage.deleteMany({ where: { patientId } });
      await tx.file.deleteMany({ where: { patientId } });
      await tx.medicationOrder.deleteMany({ where: { patientId } });
      await tx.labOrder.deleteMany({ where: { patientId } });
      await tx.labTestOrder.deleteMany({ where: { patientId } });
      await tx.radiologyOrder.deleteMany({ where: { patientId } });
      await tx.batchOrder.deleteMany({ where: { patientId } });
      
      // Delete bills and their services/payments
      const bills = await tx.billing.findMany({ where: { patientId } });
      for (const bill of bills) {
        await tx.billingService.deleteMany({ where: { billingId: bill.id } });
        await tx.billPayment.deleteMany({ where: { billingId: bill.id } });
      }
      await tx.billing.deleteMany({ where: { patientId } });
      
      await tx.dispenseLog.deleteMany({ where: { patientId } });
      await tx.medicalHistory.deleteMany({ where: { patientId } });
      await tx.pharmacyInvoice.deleteMany({ where: { patientId } });
      await tx.virtualQueue.deleteMany({ where: { patientId } });
      await tx.medicalCertificate.deleteMany({ where: { patientId } });
      await tx.diagnosisNotes.deleteMany({ where: { patientId } });
      await tx.cardActivation.deleteMany({ where: { patientId } });
      await tx.cashTransaction.deleteMany({ where: { patientId } });
      await tx.patientGallery.deleteMany({ where: { patientId } });
      await tx.insuranceTransaction.deleteMany({ where: { patientId } });
      await tx.accountDeposit.deleteMany({ where: { patientId } });
      await tx.accountTransaction.deleteMany({ where: { patientId } });
      await tx.accountRequest.deleteMany({ where: { patientId } });
      await tx.dentalProcedureCompletion.deleteMany({ where: { patientId } });
      await tx.nurseWalkInOrder.deleteMany({ where: { patientId } });
      await tx.emergencyDrugOrder.deleteMany({ where: { patientId } });
      await tx.materialNeedsOrder.deleteMany({ where: { patientId } });
      
      // Delete patient account if exists
      await tx.patientAccount.deleteMany({ where: { patientId } });

      // Finally delete the patient
      await tx.patient.delete({
        where: { id: patientId }
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DELETE_PATIENT',
        entity: 'Patient',
        entityId: patientId,
        details: JSON.stringify({
          patientId: patientId,
          patientName: patient.name,
          deletedRecords: patient._count
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Patient and all related records deleted successfully',
      deletedRecords: patient._count
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: error.message });
  }
};