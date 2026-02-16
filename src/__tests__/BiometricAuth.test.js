/**
 * Tests for BiometricAuth module
 */

const BiometricAuth = require('../BiometricAuth');

describe('BiometricAuth', () => {
  let biometricAuth;

  beforeEach(() => {
    biometricAuth = new BiometricAuth();
  });

  describe('createChallenge', () => {
    test('should create a valid challenge', () => {
      const sandboxId = 'test-sandbox-123';
      const challenge = biometricAuth.createChallenge(sandboxId);

      expect(challenge).toHaveProperty('challenge');
      expect(challenge).toHaveProperty('sandboxId', sandboxId);
      expect(challenge).toHaveProperty('expiresIn', 300);
      expect(typeof challenge.challenge).toBe('string');
      expect(challenge.challenge.length).toBeGreaterThan(0);
    });

    test('should create unique challenges', () => {
      const challenge1 = biometricAuth.createChallenge('sandbox1');
      const challenge2 = biometricAuth.createChallenge('sandbox2');

      expect(challenge1.challenge).not.toBe(challenge2.challenge);
    });
  });

  describe('verifyResponse', () => {
    test('should verify valid authentication response', () => {
      const sandboxId = 'test-sandbox';
      const challenge = biometricAuth.createChallenge(sandboxId);

      const authResponse = {
        verified: true,
        method: 'biometric',
      };

      const result = biometricAuth.verifyResponse(
        challenge.challenge,
        authResponse
      );

      expect(result.verified).toBe(true);
      expect(result.sandboxId).toBe(sandboxId);
      expect(result.method).toBe('biometric');
    });

    test('should reject invalid challenge', () => {
      const authResponse = {
        verified: true,
        method: 'biometric',
      };

      const result = biometricAuth.verifyResponse(
        'invalid-challenge',
        authResponse
      );

      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject unverified response', () => {
      const sandboxId = 'test-sandbox';
      const challenge = biometricAuth.createChallenge(sandboxId);

      const authResponse = {
        verified: false,
      };

      const result = biometricAuth.verifyResponse(
        challenge.challenge,
        authResponse
      );

      expect(result.verified).toBe(false);
    });
  });

  describe('getStatus', () => {
    test('should return status for existing challenge', () => {
      const sandboxId = 'test-sandbox';
      const challenge = biometricAuth.createChallenge(sandboxId);

      const status = biometricAuth.getStatus(challenge.challenge);

      expect(status).toBeDefined();
      expect(status.sandboxId).toBe(sandboxId);
      expect(status.status).toBe('pending');
    });

    test('should return null for non-existent challenge', () => {
      const status = biometricAuth.getStatus('non-existent');

      expect(status).toBeNull();
    });
  });

  describe('clearExpired', () => {
    test('should not clear recent challenges', () => {
      const challenge = biometricAuth.createChallenge('test-sandbox');
      
      biometricAuth.clearExpired();

      const status = biometricAuth.getStatus(challenge.challenge);
      expect(status).toBeDefined();
    });
  });

  describe('generateChallenge', () => {
    test('should generate base64 string', () => {
      const challenge = biometricAuth.generateChallenge();

      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
      // Base64 string pattern
      expect(challenge).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });
});
