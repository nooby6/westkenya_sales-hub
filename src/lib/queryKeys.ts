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
 * Helper to get query keys that should be invalidated for profile updates
 */
export const profileInvalidationKeys = {
  // Invalidate specific user's profile
  userProfile: (userId: string) => queryKeys.profile.byUserId(userId),
  // Invalidate all users list
  allUsers: () => queryKeys.profile.allWithRoles(),
};

/**
 * Helper to invalidate driver-related queries when phone changes
 */
export const driverInvalidationKeys = {
  byPhone: (oldPhone: string | null, newPhone: string | null) => {
    const keys: Array<readonly string[]> = [];
    if (oldPhone) {
      keys.push(queryKeys.shipments.byDriverPhone(oldPhone));
      keys.push(queryKeys.shipments.completedByDriver(oldPhone));
      keys.push(queryKeys.driverStats.byPhone(oldPhone));
    }
    if (newPhone && newPhone !== oldPhone) {
      keys.push(queryKeys.shipments.byDriverPhone(newPhone));
      keys.push(queryKeys.shipments.completedByDriver(newPhone));
      keys.push(queryKeys.driverStats.byPhone(newPhone));
    }
    return keys;
  },
};
