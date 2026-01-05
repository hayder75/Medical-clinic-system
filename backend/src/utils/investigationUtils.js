const prisma = require('../config/database');

/**
 * Checks if all investigations for a visit are completed and updates visit status accordingly
 * @param {number} visitId - The visit ID to check
 * @returns {Promise<Object>} - Result object with completion status and updated visit info
 */
async function checkVisitInvestigationCompletion(visitId) {
  try {
    console.log(`🔍 Checking investigation completion for visit ${visitId}`);
    
    // Get the visit with all related orders
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: {
          include: {
            labResults: true
          }
        },
        radiologyOrders: {
          include: {
            radiologyResults: true
          }
        },
        batchOrders: {
          include: {
            services: true
          }
        }
      }
    });

    if (!visit) {
      console.log(`❌ Visit ${visitId} not found`);
      throw new Error('Visit not found');
    }
    
    console.log(`📊 Visit ${visitId} current status: ${visit.status}, queueType: ${visit.queueType}`);
    console.log(`🔬 Batch orders count: ${visit.batchOrders.length}`);

    // Check if there are any pending investigations
    const hasBatchOrders = visit.batchOrders.length > 0;

    if (!hasBatchOrders) {
      // No investigations ordered, no need to check completion
      return {
        isComplete: true,
        hasInvestigations: false,
        visit: visit
      };
    }

    // Check batch orders completion (this is our current system)
    let batchOrdersComplete = true;
    if (hasBatchOrders) {
      batchOrdersComplete = visit.batchOrders.every(order => {
        console.log(`   - Batch ${order.id}: ${order.status}`);
        return order.status === 'COMPLETED';
      });
    }
    
    console.log(`✅ All batch orders completed: ${batchOrdersComplete}`);

    const allInvestigationsComplete = batchOrdersComplete;

    if (allInvestigationsComplete) {
      console.log(`🔄 Updating visit ${visitId} to AWAITING_RESULTS_REVIEW`);
      // Update visit status to AWAITING_RESULTS_REVIEW
      const updatedVisit = await prisma.visit.update({
        where: { id: visitId },
        data: {
          status: 'AWAITING_RESULTS_REVIEW',
          queueType: 'RESULTS_REVIEW',
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'INVESTIGATION_COMPLETION',
          entity: 'Visit',
          entityId: visitId,
          details: JSON.stringify({
            visitId: visitId,
            batchOrdersComplete: batchOrdersComplete,
            newStatus: 'AWAITING_RESULTS_REVIEW',
            newQueueType: 'RESULTS_REVIEW'
          }),
          ip: 'system',
          userAgent: 'system'
        }
      });

      console.log(`✅ Visit ${visitId} successfully updated to AWAITING_RESULTS_REVIEW`);
      return {
        isComplete: true,
        hasInvestigations: true,
        visit: updatedVisit,
        batchOrdersComplete
      };
    }

    console.log(`⏳ Visit ${visitId} still has pending investigations`);
    return {
      isComplete: false,
      hasInvestigations: true,
      visit: visit,
      batchOrdersComplete
    };

  } catch (error) {
    console.error('Error checking investigation completion:', error);
    throw error;
  }
}

/**
 * Checks if medication ordering is allowed for a visit
 * @param {number} visitId - The visit ID to check
 * @returns {Promise<Object>} - Result object with medication ordering status
 */
async function checkMedicationOrderingAllowed(visitId) {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true,
        batchOrders: true
      }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Check if there are any pending investigations
    // Only consider LAB and RADIOLOGY orders - NURSE and DENTAL don't block medication
    const hasLabOrders = visit.labOrders.length > 0;
    const hasRadiologyOrders = visit.radiologyOrders.length > 0;
    // Only count LAB and RADIOLOGY batch orders
    const labRadiologyBatchOrders = visit.batchOrders.filter(order => 
      order.type === 'LAB' || order.type === 'RADIOLOGY' || order.type === 'MIXED'
    );
    const hasBatchOrders = labRadiologyBatchOrders.length > 0;

    if (!hasLabOrders && !hasRadiologyOrders && !hasBatchOrders) {
      // No lab/radiology investigations ordered, medication ordering allowed immediately
      return {
        allowed: true,
        reason: 'No lab or radiology investigations ordered'
      };
    }

    // Check if all lab/radiology investigations are completed
    // Only check LAB and RADIOLOGY batch orders for completion (exclude NURSE and DENTAL)
    const allLabRadiologyBatchComplete = labRadiologyBatchOrders.length === 0 || 
      labRadiologyBatchOrders.every(order => order.status === 'COMPLETED');
    const allLabOrdersComplete = visit.labOrders.length === 0 || 
      visit.labOrders.every(order => order.status === 'COMPLETED');
    const allRadiologyOrdersComplete = visit.radiologyOrders.length === 0 || 
      visit.radiologyOrders.every(order => order.status === 'COMPLETED');
    
    if (allLabRadiologyBatchComplete && allLabOrdersComplete && allRadiologyOrdersComplete) {
      return {
        allowed: true,
        reason: 'All lab and radiology investigations completed'
      };
    }

    // Get pending investigation details
    // Only check LAB and RADIOLOGY orders - NURSE and DENTAL services don't block medication ordering
    const pendingLab = visit.labOrders.filter(order => order.status !== 'COMPLETED');
    const pendingRadiology = visit.radiologyOrders.filter(order => order.status !== 'COMPLETED');
    // Only check LAB and RADIOLOGY batch orders - exclude NURSE and DENTAL
    const pendingBatch = visit.batchOrders.filter(order => 
      order.status !== 'COMPLETED' && 
      (order.type === 'LAB' || order.type === 'RADIOLOGY' || order.type === 'MIXED')
    );

    const pendingDetails = [];
    if (pendingLab.length > 0) pendingDetails.push(`${pendingLab.length} lab test(s)`);
    if (pendingRadiology.length > 0) pendingDetails.push(`${pendingRadiology.length} radiology test(s)`);
    if (pendingBatch.length > 0) pendingDetails.push(`${pendingBatch.length} batch order(s)`);

    // If no pending lab/radiology orders, allow medication ordering
    if (pendingLab.length === 0 && pendingRadiology.length === 0 && pendingBatch.length === 0) {
      return {
        allowed: true,
        reason: 'All lab and radiology investigations completed'
      };
    }

    return {
      allowed: false,
      reason: `Cannot order medication until all pending results are submitted. Pending: ${pendingDetails.join(', ')}`
    };

  } catch (error) {
    console.error('Error checking medication ordering:', error);
    throw error;
  }
}

module.exports = {
  checkVisitInvestigationCompletion,
  checkMedicationOrderingAllowed
};
