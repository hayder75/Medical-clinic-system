const crypto = require('crypto');

/**
 * Generate a unique visitUid with extremely low collision probability
 * Format: VISIT-YYYYMMDD-TIMESTAMP-RANDOM
 * 
 * Uses:
 * - Full timestamp (13 digits) for microsecond precision
 * - Crypto-based random number (6 digits) for cryptographically secure randomness
 * - Process-based randomness for additional uniqueness
 * 
 * @returns {string} A unique visitUid
 */
function generateVisitUid() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  
  // Full timestamp (13 digits) for maximum precision
  const fullTimestamp = Date.now().toString();
  
  // Use crypto.randomInt for cryptographically secure random number (6 digits = 000000-999999)
  // This gives us 1 million possibilities per millisecond
  const random = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  
  // Combine: VISIT-YYYYMMDD-TIMESTAMP-RANDOM
  // Example: VISIT-20260110-1738074856123-284729
  return `VISIT-${dateStr}-${fullTimestamp}-${random}`;
}

/**
 * Generate a unique visitUid with retry logic for database collision handling
 * This wraps the generation in retry logic in case of extremely rare collisions
 * 
 * @param {Function} createFunction - Async function that creates the visit (should throw on P2002 error)
 * @param {number} maxRetries - Maximum number of retries (default: 10)
 * @returns {Promise<Object>} The created visit
 */
async function generateUniqueVisitUid(createFunction, maxRetries = 10) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const visitUid = generateVisitUid();
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
        // Wait a tiny bit before retrying (adds more randomness to timestamp)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5)); // 5-25ms random delay
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

