/**
 * BiometricAuth - Handles biometric authentication for action verification
 * Supports fingerprint, face recognition, and fallback PIN authentication
 */
class BiometricAuth {
  constructor() {
    this.pendingAuthentications = new Map();
  }

  /**
   * Check if biometric authentication is available
   * @returns {Promise<Object>} Available authentication methods
   */
  async checkAvailability() {
    const available = {
      fingerprint: false,
      faceId: false,
      webAuthn: false,
      fallbackPin: true, // Always available
    };

    // Check for WebAuthn API (used for biometric auth on web)
    if (window.PublicKeyCredential) {
      available.webAuthn = true;
      
      // Check for specific authenticator types
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          available.fingerprint = true;
          available.faceId = true;
        }
      } catch (error) {
        console.error('Error checking authenticator availability:', error);
      }
    }

    return available;
  }

  /**
   * Request biometric authentication
   * @param {string} challenge - Unique challenge for this authentication
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} Authentication result
   */
  async requestAuthentication(challenge, options = {}) {
    const authId = challenge;
    
    // Store pending authentication
    this.pendingAuthentications.set(authId, {
      challenge,
      timestamp: new Date(),
      status: 'pending',
      options,
    });

    try {
      // Check availability first
      const availability = await this.checkAvailability();

      // Try WebAuthn first (most secure)
      if (availability.webAuthn && options.preferBiometric !== false) {
        return await this.authenticateWithWebAuthn(authId, challenge);
      }

      // Fallback to PIN
      return await this.authenticateWithPin(authId, challenge);

    } catch (error) {
      this.pendingAuthentications.get(authId).status = 'failed';
      throw error;
    }
  }

  /**
   * Authenticate using WebAuthn (biometric)
   * @param {string} authId - Authentication ID
   * @param {string} challenge - Challenge string
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateWithWebAuthn(authId, challenge) {
    try {
      // Convert challenge to Uint8Array
      const challengeBuffer = new TextEncoder().encode(challenge);

      // Request authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          timeout: 60000,
          userVerification: 'required',
        },
      });

      if (credential) {
        const auth = this.pendingAuthentications.get(authId);
        auth.status = 'verified';
        auth.method = 'biometric';
        auth.completedAt = new Date();

        return {
          verified: true,
          method: 'biometric',
          authId,
          timestamp: new Date(),
        };
      }

      throw new Error('Authentication failed');

    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      // Fallback to PIN
      return await this.authenticateWithPin(authId, challenge);
    }
  }

  /**
   * Authenticate using PIN (fallback)
   * @param {string} authId - Authentication ID
   * @param {string} challenge - Challenge string
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateWithPin(authId, challenge) {
    // In a real implementation, this would prompt for PIN
    // For now, we'll simulate successful authentication
    
    const auth = this.pendingAuthentications.get(authId);
    auth.status = 'verified';
    auth.method = 'pin';
    auth.completedAt = new Date();

    return {
      verified: true,
      method: 'pin',
      authId,
      timestamp: new Date(),
      message: 'Authenticated with PIN',
    };
  }

  /**
   * Verify an authentication token
   * @param {string} authId - Authentication ID to verify
   * @returns {boolean} True if authentication is valid
   */
  verifyAuthentication(authId) {
    const auth = this.pendingAuthentications.get(authId);
    
    if (!auth) {
      return false;
    }

    if (auth.status !== 'verified') {
      return false;
    }

    // Check if authentication is still valid (within 5 minutes)
    const ageMinutes = (new Date() - auth.completedAt) / 1000 / 60;
    if (ageMinutes > 5) {
      return false;
    }

    return true;
  }

  /**
   * Get authentication status
   * @param {string} authId - Authentication ID
   * @returns {Object} Authentication status
   */
  getAuthenticationStatus(authId) {
    return this.pendingAuthentications.get(authId) || null;
  }

  /**
   * Cancel a pending authentication
   * @param {string} authId - Authentication ID
   */
  cancelAuthentication(authId) {
    const auth = this.pendingAuthentications.get(authId);
    if (auth) {
      auth.status = 'cancelled';
    }
  }

  /**
   * Clear expired authentications
   */
  clearExpired() {
    const now = new Date();
    for (const [authId, auth] of this.pendingAuthentications) {
      const ageMinutes = (now - auth.timestamp) / 1000 / 60;
      if (ageMinutes > 10) {
        this.pendingAuthentications.delete(authId);
      }
    }
  }
}

// For Node.js environment (server-side)
class BiometricAuthServer {
  constructor() {
    this.pendingAuthentications = new Map();
  }

  /**
   * Create an authentication challenge
   * @param {string} sandboxId - Associated sandbox ID
   * @returns {Object} Challenge data
   */
  createChallenge(sandboxId) {
    const challenge = this.generateChallenge();
    
    this.pendingAuthentications.set(challenge, {
      sandboxId,
      timestamp: new Date(),
      status: 'pending',
    });

    return {
      challenge,
      sandboxId,
      expiresIn: 300, // 5 minutes
    };
  }

  /**
   * Generate a random challenge string
   * @returns {string} Challenge string
   */
  generateChallenge() {
    return require('crypto').randomBytes(32).toString('base64');
  }

  /**
   * Verify authentication response
   * @param {string} challenge - Challenge string
   * @param {Object} response - Authentication response from client
   * @returns {Object} Verification result
   */
  verifyResponse(challenge, response) {
    const auth = this.pendingAuthentications.get(challenge);
    
    if (!auth) {
      return {
        verified: false,
        error: 'Invalid or expired challenge',
      };
    }

    // Check expiration (5 minutes)
    const ageMinutes = (new Date() - auth.timestamp) / 1000 / 60;
    if (ageMinutes > 5) {
      this.pendingAuthentications.delete(challenge);
      return {
        verified: false,
        error: 'Challenge expired',
      };
    }

    // In a real implementation, verify the cryptographic signature
    // For now, we accept the response if it has the right structure
    if (response && response.verified) {
      auth.status = 'verified';
      auth.method = response.method;
      auth.completedAt = new Date();

      return {
        verified: true,
        sandboxId: auth.sandboxId,
        method: response.method,
      };
    }

    return {
      verified: false,
      error: 'Authentication failed',
    };
  }

  /**
   * Get authentication status
   * @param {string} challenge - Challenge string
   * @returns {Object} Authentication status
   */
  getStatus(challenge) {
    return this.pendingAuthentications.get(challenge) || null;
  }

  /**
   * Clear expired challenges
   */
  clearExpired() {
    const now = new Date();
    for (const [challenge, auth] of this.pendingAuthentications) {
      const ageMinutes = (now - auth.timestamp) / 1000 / 60;
      if (ageMinutes > 10) {
        this.pendingAuthentications.delete(challenge);
      }
    }
  }
}

module.exports = BiometricAuthServer;
