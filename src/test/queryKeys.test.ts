import { describe, it, expect } from 'vitest';
import { queryKeys, driverInvalidationKeys } from '@/lib/queryKeys';

describe('Query Keys', () => {
  it('should generate consistent profile query keys', () => {
    const userId = 'test-user-123';
    const key1 = queryKeys.profile.byUserId(userId);
    const key2 = queryKeys.profile.byUserId(userId);
    
    expect(key1).toEqual(key2);
    expect(key1).toEqual(['profile', userId]);
  });

  it('should generate consistent all users query keys', () => {
    const key1 = queryKeys.profile.allWithRoles();
    const key2 = queryKeys.profile.allWithRoles();
    
    expect(key1).toEqual(key2);
    expect(key1).toEqual(['profiles', 'with-roles']);
  });

  it('should generate consistent shipment query keys', () => {
    const phone = '+254712345678';
    const activeKey = queryKeys.shipments.byDriverPhone(phone);
    const completedKey = queryKeys.shipments.completedByDriver(phone);
    
    expect(activeKey).toEqual(['shipments', 'driver', phone]);
    expect(completedKey).toEqual(['shipments', 'completed', phone]);
  });

  it('should generate correct driver stats query keys', () => {
    const phone = '+254712345678';
    const key = queryKeys.driverStats.byPhone(phone);
    
    expect(key).toEqual(['driver-stats', phone]);
  });

  it('should generate invalidation keys for phone changes', () => {
    const oldPhone = '+254712345678';
    const newPhone = '+254787654321';
    
    const keys = driverInvalidationKeys.byPhone(oldPhone, newPhone);
    
    // Should include both old and new phone keys
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContainEqual(['shipments', 'driver', oldPhone]);
    expect(keys).toContainEqual(['shipments', 'completed', oldPhone]);
    expect(keys).toContainEqual(['driver-stats', oldPhone]);
    expect(keys).toContainEqual(['shipments', 'driver', newPhone]);
    expect(keys).toContainEqual(['shipments', 'completed', newPhone]);
    expect(keys).toContainEqual(['driver-stats', newPhone]);
  });

  it('should handle null phone in invalidation keys', () => {
    const newPhone = '+254787654321';
    
    const keys = driverInvalidationKeys.byPhone(null, newPhone);
    
    // Should only include new phone keys
    expect(keys).toContainEqual(['shipments', 'driver', newPhone]);
    expect(keys).toContainEqual(['shipments', 'completed', newPhone]);
    expect(keys).toContainEqual(['driver-stats', newPhone]);
  });

  it('should not duplicate keys when phone does not change', () => {
    const phone = '+254712345678';
    
    const keys = driverInvalidationKeys.byPhone(phone, phone);
    
    // Should only have old phone keys, not duplicated
    expect(keys.length).toBe(3);
  });
});
