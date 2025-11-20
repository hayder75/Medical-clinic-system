/**
 * Image URL Utility
 * Constructs proper image URLs for local network deployment
 * 
 * Backend serves images at: http://SERVER_IP:3000/uploads/...
 * This utility ensures images work on both server PC and client PCs
 */

/**
 * Get the base URL for API and file serving
 * Removes /api suffix if present since images are served at root level
 */
function getBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Remove /api suffix if present (images are served at /uploads, not /api/uploads)
  if (apiUrl.endsWith('/api')) {
    return apiUrl.replace('/api', '');
  }
  
  // If no /api, assume it's already the base URL
  return apiUrl;
}

/**
 * Construct a full image URL from a file path
 * @param {string} filePath - Path from backend (e.g., "uploads/patient-gallery/image.jpg")
 * @returns {string} Full URL (e.g., "http://192.168.1.100:3000/uploads/patient-gallery/image.jpg")
 */
export function getImageUrl(filePath) {
  if (!filePath) {
    return '';
  }

  // If already a full URL (starts with http:// or https://), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // If starts with /, remove it (backend returns paths like "uploads/..." or "/uploads/...")
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

  // Ensure path starts with "uploads/"
  const normalizedPath = cleanPath.startsWith('uploads/') 
    ? cleanPath 
    : `uploads/${cleanPath}`;

  // Construct full URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}/${normalizedPath}`;
}

/**
 * Get API base URL (for API calls)
 */
export function getApiUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
}

/**
 * Get server base URL (for file serving, without /api)
 */
export function getServerUrl() {
  return getBaseUrl();
}

export default {
  getImageUrl,
  getApiUrl,
  getServerUrl
};

