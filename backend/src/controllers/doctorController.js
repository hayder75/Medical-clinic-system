// Add this function at the end of the file, before module.exports

// Delete a visit (doctors can delete any visit without restrictions)
exports.deleteVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    if (!visitId) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    // Find the visit with all related data
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        bills: true,
        vitals: true,
        labOrders: true,
        labTestOrders: true,
        radiologyOrders: true,
        medicationOrders: true,
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Start a transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete related records in correct order (respecting foreign key constraints)
      
      // 1. Delete patient attached images
      if (visit.attachedImages.length > 0) {
        await tx.patientAttachedImage.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 2. Delete dental photos
      if (visit.dentalPhotos.length > 0) {
        await tx.dentalPhoto.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 3. Delete dental records
      if (visit.dentalRecords.length > 0) {
        await tx.dentalRecord.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 4. Delete vitals
      if (visit.vitals.length > 0) {
        await tx.vitalSign.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 5. Delete lab test results first
      const labTestOrderIds = visit.labTestOrders.map(o => o.id);
      if (labTestOrderIds.length > 0) {
        await tx.labTestResult.deleteMany({
          where: { orderId: { in: labTestOrderIds } }
        });
      }

      // 6. Delete medication orders
      if (visit.medicationOrders.length > 0) {
        await tx.medicationOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 7. Delete radiology orders
      if (visit.radiologyOrders.length > 0) {
        await tx.radiologyOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 8. Delete lab orders (old system)
      if (visit.labOrders.length > 0) {
        await tx.labOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 9. Delete lab test orders (new system)
      if (visit.labTestOrders.length > 0) {
        await tx.labTestOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 10. Delete bills and payments
      if (visit.bills.length > 0) {
        for (const bill of visit.bills) {
          await tx.billPayment.deleteMany({
            where: { billingId: bill.id }
          });
          
          await tx.billingService.deleteMany({
            where: { billingId: bill.id }
          });
        }
        
        await tx.billing.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 11. Finally delete the visit
      await tx.visit.delete({
        where: { id: parseInt(visitId) }
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        action: 'DELETE_VISIT',
        entity: 'Visit',
        entityId: parseInt(visitId),
        details: JSON.stringify({
          visitUid: visit.visitUid,
          patientId: visit.patientId,
          patientName: visit.patient.name,
          visitStatus: visit.status,
          deletedAt: new Date().toISOString(),
          reason: 'Doctor deletion - no restrictions'
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Visit deleted successfully',
      deletedVisit: {
        id: visit.id,
        visitUid: visit.visitUid,
        patientId: visit.patientId,
        patientName: visit.patient.name,
        status: visit.status
      }
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a visit (doctors can delete any visit without restrictions)
exports.deleteVisit = async (req, res) => {
// Delete a visit (doctors can delete any visit without restrictions)
exports.deleteVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    if (!visitId) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    // Find the visit with all related data
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        bills: true,
        vitals: true,
        labOrders: true,
        labTestOrders: true,
        radiologyOrders: true,
        medicationOrders: true,
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Start a transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete related records in correct order (respecting foreign key constraints)
      
      // 1. Delete patient attached images
      if (visit.attachedImages.length > 0) {
        await tx.patientAttachedImage.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 2. Delete dental photos
      if (visit.dentalPhotos.length > 0) {
        await tx.dentalPhoto.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 3. Delete dental records
      if (visit.dentalRecords.length > 0) {
        await tx.dentalRecord.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 4. Delete vitals
      if (visit.vitals.length > 0) {
        await tx.vitalSign.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 5. Delete lab test results first
      const labTestOrderIds = visit.labTestOrders.map(o => o.id);
      if (labTestOrderIds.length > 0) {
        await tx.labTestResult.deleteMany({
          where: { orderId: { in: labTestOrderIds } }
        });
      }

      // 6. Delete medication orders
      if (visit.medicationOrders.length > 0) {
        await tx.medicationOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 7. Delete radiology orders
      if (visit.radiologyOrders.length > 0) {
        await tx.radiologyOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 8. Delete lab orders (old system)
      if (visit.labOrders.length > 0) {
        await tx.labOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 9. Delete lab test orders (new system)
      if (visit.labTestOrders.length > 0) {
        await tx.labTestOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 10. Delete bills and payments
      if (visit.bills.length > 0) {
        for (const bill of visit.bills) {
          await tx.billPayment.deleteMany({
            where: { billingId: bill.id }
          });
          
          await tx.billingService.deleteMany({
            where: { billingId: bill.id }
          });
        }
        
        await tx.billing.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 11. Finally delete the visit
      await tx.visit.delete({
        where: { id: parseInt(visitId) }
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        action: 'DELETE_VISIT',
        entity: 'Visit',
        entityId: parseInt(visitId),
        details: JSON.stringify({
          visitUid: visit.visitUid,
          patientId: visit.patientId,
          patientName: visit.patient.name,
          visitStatus: visit.status,
          deletedAt: new Date().toISOString(),
          reason: 'Doctor deletion - no restrictions'
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Visit deleted successfully',
      deletedVisit: {
        id: visit.id,
        visitUid: visit.visitUid,
        patientId: visit.patientId,
        patientName: visit.patient.name,
        status: visit.status
      }
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a visit (doctors can delete any visit without restrictions)
exports.deleteVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const doctorId = req.user.id;

    if (!visitId) {
      return res.status(400).json({ error: 'Visit ID is required' });
    }

    // Find the visit with all related data
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        bills: true,
        vitals: true,
        labOrders: true,
        labTestOrders: true,
        radiologyOrders: true,
        medicationOrders: true,
        dentalRecords: true,
        dentalPhotos: true,
        attachedImages: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Start a transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // Delete related records in correct order (respecting foreign key constraints)
      
      // 1. Delete patient attached images
      if (visit.attachedImages.length > 0) {
        await tx.patientAttachedImage.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 2. Delete dental photos
      if (visit.dentalPhotos.length > 0) {
        await tx.dentalPhoto.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 3. Delete dental records
      if (visit.dentalRecords.length > 0) {
        await tx.dentalRecord.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 4. Delete vitals
      if (visit.vitals.length > 0) {
        await tx.vitalSign.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 5. Delete lab test results first
      const labTestOrderIds = visit.labTestOrders.map(o => o.id);
      if (labTestOrderIds.length > 0) {
        await tx.labTestResult.deleteMany({
          where: { orderId: { in: labTestOrderIds } }
        });
      }

      // 6. Delete medication orders
      if (visit.medicationOrders.length > 0) {
        await tx.medicationOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 7. Delete radiology orders
      if (visit.radiologyOrders.length > 0) {
        await tx.radiologyOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 8. Delete lab orders (old system)
      if (visit.labOrders.length > 0) {
        await tx.labOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 9. Delete lab test orders (new system)
      if (visit.labTestOrders.length > 0) {
        await tx.labTestOrder.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 10. Delete bills and payments
      if (visit.bills.length > 0) {
        for (const bill of visit.bills) {
          await tx.billPayment.deleteMany({
            where: { billingId: bill.id }
          });
          
          await tx.billingService.deleteMany({
            where: { billingId: bill.id }
          });
        }
        
        await tx.billing.deleteMany({
          where: { visitId: parseInt(visitId) }
        });
      }

      // 11. Finally delete the visit
      await tx.visit.delete({
        where: { id: parseInt(visitId) }
      });
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        action: 'DELETE_VISIT',
        entity: 'Visit',
        entityId: parseInt(visitId),
        details: JSON.stringify({
          visitUid: visit.visitUid,
          patientId: visit.patientId,
          patientName: visit.patient.name,
          visitStatus: visit.status,
          deletedAt: new Date().toISOString(),
          reason: 'Doctor deletion - no restrictions'
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Visit deleted successfully',
      deletedVisit: {
        id: visit.id,
        visitUid: visit.visitUid,
        patientId: visit.patientId,
        patientName: visit.patient.name,
        status: visit.status
      }
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: error.message });
  }
};
