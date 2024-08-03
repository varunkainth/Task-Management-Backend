import crypto from 'crypto';

/**
 * Generates an 8-digit numeric ID based on user data.
 * @param {string} dob - User's date of birth in YYYY-MM-DD format.
 * @param {string} phoneNumber - User's phone number.
 * @param {Date} createdAt - Account creation date.
 * @returns {string} - An 8-digit numeric ID.
 */
function generateNumericId(dob, phoneNumber, createdAt) {
  const inputString = `${dob}-${phoneNumber}-${createdAt}`;
  const hash = crypto.createHash('sha256').update(inputString).digest('hex');
  
  // Convert hash to a large integer
  const hashNumber = parseInt(hash.substring(0, 16), 16); // Use the first 16 characters of the hash
  
  // Generate an 8-digit numeric ID
  const uniqueId = (hashNumber % 100000000).toString().padStart(8, '0'); // Ensure it is 8 digits
  
  return uniqueId;
}

export default generateNumericId;
