// Note: Prisma client will be passed as parameter to avoid multiple instances

/**
 * Generate a unique visitUid with sequential numbering
 * Format: VISIT-YYMMDD-SEQ
 * 
 * Uses:
 * - Date (YYMMDD) for date-based grouping
 * - Sequential number starting from 01, incrementing for each visit on the same day
 * - Automatically handles 2-digit (01-99) and 3-digit (100+) numbers
 * 
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<string>} A unique visitUid
 */
async function generateVisitUid(prisma) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const dateStr = `${year}${month}${day}`; // YYMMDD
  
  // Find the last visit created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const lastVisit = await prisma.visit.findFirst({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      visitUid: {
        startsWith: `VISIT-${dateStr}-`
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      visitUid: true
    }
  });
  
  let seqNumber = 1;
  
  if (lastVisit) {
    // Extract the sequence number from the last visit ID
    // Format: VISIT-YYMMDD-SEQ
    const parts = lastVisit.visitUid.split('-');
    if (parts.length === 3 && parts[0] === 'VISIT' && parts[1] === dateStr) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        seqNumber = lastSeq + 1;
      }
    }
  }
  
  // Format sequence number (2 digits for 01-99, 3+ digits for 100+)
  // Don't pad beyond 2 digits - let it grow naturally (01, 02, ..., 99, 100, 101, ...)
  const seqStr = seqNumber < 100 ? seqNumber.toString().padStart(2, '0') : seqNumber.toString();
  
  // Combine: VISIT-YYMMDD-SEQ
  // Example: VISIT-260112-01, VISIT-260112-02, ..., VISIT-260112-99, VISIT-260112-100
  return `VISIT-${dateStr}-${seqStr}`;
}

/**
 * Generate a unique visitUid with retry logic for database collision handling
 * This wraps the generation in retry logic in case of race conditions (multiple visits created simultaneously)
 * 
 * @param {Function} createFunction - Async function that creates the visit (should throw on P2002 error)
 * @param {Object} prisma - Prisma client instance
 * @param {number} maxRetries - Maximum number of retries (default: 10)
 * @returns {Promise<Object>} The created visit
 */
async function generateUniqueVisitUid(createFunction, prisma, maxRetries = 10) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const visitUid = await generateVisitUid(prisma);
      const result = await createFunction(visitUid);
      return result;
    } catch (error) {
      // If it's a unique constraint error on visitUid, retry with a new ID
      if (error.code === 'P2002' && error.meta?.target?.includes('visitUid')) {
        retries++;
        if (retries >= maxRetries) {
          console.error('❌ Failed to generate unique visitUid after', maxRetries, 'attempts');
          throw new Error('Unable to generate unique visit ID after multiple attempts. Please try again.');
        }
        // Wait a tiny bit before retrying (allows time for other concurrent requests to complete)
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
      } else {
        // Different error - throw it immediately
        throw error;
      }
    }
  }
}

module.exports = {
  generateVisitUid,
  generateUniqueVisitUid
};


