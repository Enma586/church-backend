/**
 * @file tests/unit/utils/pagination.test.js
 * @description Unit tests for the pagination utility functions.
 * Verifies that skip/limit calculations and metadata generation are mathematically correct.
 */

import { getPagination, getPagingData } from '../../../src/utils/pagination.js';

describe('Pagination Utilities', () => {
  
  describe('getPagination()', () => {
    it('should return default limit (10) and skip (0) if no arguments are provided', () => {
      const result = getPagination(undefined, undefined);
      // Actualizado: Esperamos 'skip', no 'offset'
      expect(result).toEqual({ limit: 10, skip: 0 });
    });

    it('should correctly calculate skip based on page number', () => {
      // Example: Page 3 with a limit of 15 items per page -> skip the first 30 items
      const result = getPagination(3, 15);
      // Actualizado: Esperamos 'skip', no 'offset'
      expect(result).toEqual({ limit: 15, skip: 30 });
    });
  });

  describe('getPagingData()', () => {
    it('should correctly build the pagination metadata object', () => {
      // Actualizado: Pasamos (total, page, limit) exactamente como lo pide tu función
      const result = getPagingData(55, 2, 10);

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
      // Total 55, página 1, límite 10
      const result = getPagingData(55, 1, 10);

      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
    });

    it('should handle the last page correctly (no next page)', () => {
      // Total 55, página 6, límite 10
      const result = getPagingData(55, 6, 10);

      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(true);
    });
  });
});