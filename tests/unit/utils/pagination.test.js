/**
 * @file tests/unit/utils/pagination.test.js
 * @description Unit tests for the pagination utility functions.
 * Verifies that offset/limit calculations and metadata generation are mathematically correct.
 */

import { getPagination, getPagingData } from '../../../src/utils/pagination.js';

describe('Pagination Utilities', () => {
  
  describe('getPagination()', () => {
    it('should return default limit (10) and offset (0) if no arguments are provided', () => {
      const result = getPagination(undefined, undefined);
      expect(result).toEqual({ limit: 10, offset: 0 });
    });

    it('should correctly calculate offset based on page number', () => {
      // Example: Page 3 with a limit of 15 items per page -> skip the first 30 items
      const result = getPagination(3, 15);
      expect(result).toEqual({ limit: 15, offset: 30 });
    });
  });

  describe('getPagingData()', () => {
    it('should correctly build the pagination metadata object', () => {
      // Simulated data: total 55 items, current page 2, limit 10
      const dummyData = [{ id: 1 }, { id: 2 }];
      const result = getPagingData(dummyData, 2, 10, 55);

      expect(result).toEqual({
        total: 55,
        totalPages: 6, // Math.ceil(55 / 10)
        currentPage: 2,
        perPage: 10,
        hasNextPage: true,  // 2 < 6
        hasPrevPage: true   // 2 > 1
      });
    });

    it('should handle the first page correctly (no previous page)', () => {
      const dummyData = [];
      const result = getPagingData(dummyData, 1, 10, 55);

      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
    });

    it('should handle the last page correctly (no next page)', () => {
      const dummyData = [];
      const result = getPagingData(dummyData, 6, 10, 55);

      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(true);
    });
  });
});