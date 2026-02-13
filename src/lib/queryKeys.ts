/**
 * Centralized query key factory for React Query
 * Ensures consistent cache keys across the application
 */

export const queryKeys = {
  // User profile queries
  profile: {
    // Single user profile by user ID
    byUserId: (userId: string) => ['profile', userId] as const,
    // All users with roles (admin view)
    allWithRoles: () => ['profiles', 'with-roles'] as const,
  },
  
  // Shipment/delivery queries
  shipments: {
    // Driver's active shipments by phone
    byDriverPhone: (phone: string) => ['shipments', 'driver', phone] as const,
    // Driver's completed shipments
    completedByDriver: (phone: string) => ['shipments', 'completed', phone] as const,
  },
  
  // Driver statistics
  driverStats: {
    byPhone: (phone: string) => ['driver-stats', phone] as const,
  },
} as const;

/**
 * Helper to invalidate all profile-related queries for a user
 */
export const profileInvalidationKeys = {
  // Invalidate specific user's profile
  userProfile: (userId: string) => [['profile', userId]],
  // Invalidate all users list
  allUsers: () => [['profiles', 'with-roles']],
  // Invalidate both user profile and users list
  both: (userId: string) => [['profile', userId], ['profiles', 'with-roles']],
};

/**
 * Helper to invalidate driver-related queries when phone changes
 */
export const driverInvalidationKeys = {
  byPhone: (oldPhone: string | null, newPhone: string | null) => {
    const keys = [];
    if (oldPhone) {
      keys.push(['shipments', 'driver', oldPhone]);
      keys.push(['shipments', 'completed', oldPhone]);
      keys.push(['driver-stats', oldPhone]);
    }
    if (newPhone && newPhone !== oldPhone) {
      keys.push(['shipments', 'driver', newPhone]);
      keys.push(['shipments', 'completed', newPhone]);
      keys.push(['driver-stats', newPhone]);
    }
    return keys;
  },
};
