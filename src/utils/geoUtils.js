// Utility functions for geolocation calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} p1 - First point {lat, lng}
 * @param {Object} p2 - Second point {lat, lng}
 * @returns {number} Distance in meters
 */
export function distanceBetween(p1, p2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = p1.lat * Math.PI/180;
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat - p1.lat) * Math.PI/180;
  const Δλ = (p2.lng - p1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Check if user has moved significantly from last known position
 * @param {Object} currentCoords - Current coordinates {lat, lng}
 * @param {Object} lastCoords - Last known coordinates {lat, lng}
 * @param {number} threshold - Minimum distance in meters to consider significant movement
 * @returns {boolean} True if movement is significant
 */
export function hasSignificantMovement(currentCoords, lastCoords, threshold = 200) {
  if (!lastCoords) return true;
  
  const distance = distanceBetween(currentCoords, lastCoords);
  return distance > threshold;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
