const prisma = require('../config/database');

/**
 * Checks if all investigations for a visit are completed and updates visit status accordingly
 * @param {number} visitId - The visit ID to check
 * @returns {Promise<Object>} - Result object with completion status and updated visit info
 */
async function checkVisitInvestigationCompletion(visitId) {
  try {
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
      throw new Error('Visit not found');
    }

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
        return order.status === 'COMPLETED';
      });
    }

    const allInvestigationsComplete = batchOrdersComplete;

    if (allInvestigationsComplete) {
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

      return {
        isComplete: true,
        hasInvestigations: true,
        visit: updatedVisit,
        batchOrdersComplete
      };
    }

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
    const hasLabOrders = visit.labOrders.length > 0;
    const hasRadiologyOrders = visit.radiologyOrders.length > 0;
    const hasBatchOrders = visit.batchOrders.length > 0;

    if (!hasLabOrders && !hasRadiologyOrders && !hasBatchOrders) {
      // No investigations ordered, medication ordering allowed immediately
      return {
        allowed: true,
        reason: 'No investigations ordered'
      };
    }

    // Check if all investigations are completed
    const completionCheck = await checkVisitInvestigationCompletion(visitId);
    
    if (completionCheck.isComplete) {
      return {
        allowed: true,
        reason: 'All investigations completed'
      };
    }

    // Get pending investigation details
    const pendingLab = visit.labOrders.filter(order => order.status !== 'COMPLETED');
    const pendingRadiology = visit.radiologyOrders.filter(order => order.status !== 'COMPLETED');
    const pendingBatch = visit.batchOrders.filter(order => order.status !== 'COMPLETED');

    const pendingDetails = [];
    if (pendingLab.length > 0) pendingDetails.push(`${pendingLab.length} lab test(s)`);
    if (pendingRadiology.length > 0) pendingDetails.push(`${pendingRadiology.length} radiology test(s)`);
    if (pendingBatch.length > 0) pendingDetails.push(`${pendingBatch.length} batch order(s)`);

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
