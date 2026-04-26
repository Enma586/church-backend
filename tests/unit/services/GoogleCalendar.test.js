/**
 * @file tests/unit/services/GoogleCalendar.test.js
 * @description Unit tests for Google Calendar synchronization logic.
 * Mocks the actual Google API to test error handling and retry mechanisms.
 */

import { describe, it, expect, vi } from 'vitest';

// We simulate the service structure to test the retry logic conceptually
const simulateGoogleApiCall = vi.fn();

const withRetry = async (operation, retries = 3) => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error.status === 429) { // 429 is Rate Limit
      return await withRetry(operation, retries - 1);
    }
    throw error;
  }
};

describe('Google Calendar Service (Retry Logic)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute successfully on the first try if the API responds well', async () => {
    simulateGoogleApiCall.mockResolvedValue('event_created');
    
    const result = await withRetry(simulateGoogleApiCall);
    
    expect(result).toBe('event_created');
    expect(simulateGoogleApiCall).toHaveBeenCalledTimes(1);
  });

  it('should retry if the API throws a 429 Rate Limit error', async () => {
    // Fail the first time with 429, succeed the second time
    simulateGoogleApiCall
      .mockRejectedValueOnce({ status: 429, message: 'Rate Limit Exceeded' })
      .mockResolvedValueOnce('event_created_on_retry');

    const result = await withRetry(simulateGoogleApiCall);

    expect(result).toBe('event_created_on_retry');
    expect(simulateGoogleApiCall).toHaveBeenCalledTimes(2);
  });

  it('should fail immediately without retrying if the error is 400 Bad Request', async () => {
    simulateGoogleApiCall.mockRejectedValue({ status: 400, message: 'Invalid Date' });

    await expect(withRetry(simulateGoogleApiCall)).rejects.toThrow('Invalid Date');
    expect(simulateGoogleApiCall).toHaveBeenCalledTimes(1); // Didn't retry
  });
});