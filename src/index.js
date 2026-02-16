const SandboxManager = require('./SandboxManager');
const BiometricAuth = require('./BiometricAuth');

/**
 * Main entry point for Payment Box AI
 * Provides a simple API for integrating verified action sandboxes
 */
class PaymentBoxAI {
  constructor() {
    this.sandboxManager = new SandboxManager();
    this.biometricAuth = new BiometricAuth();
  }

  /**
   * Verify and execute an AI action with user confirmation
   * @param {Object} actionRequest - The action to verify
   * @returns {Promise<Object>} Execution result
   */
  async verifyAndExecute(actionRequest) {
    try {
      // Step 1: Create sandbox
      console.log('Creating sandbox...');
      const sandbox = await this.sandboxManager.createSandbox(actionRequest);

      // Step 2: Simulate the action
      console.log('Simulating action...');
      const simulation = await this.sandboxManager.simulateAction(sandbox.id);

      // Step 3: Show simulation to user and request confirmation
      console.log('\n📋 Action Summary:');
      console.log(JSON.stringify(simulation.actionSummary, null, 2));
      console.log(`\n🔍 Simulation completed with ${simulation.steps.length} steps`);
      console.log('Please review the visual preview and confirm...\n');

      // Step 4: Request biometric authentication
      console.log('Requesting biometric authentication...');
      const challenge = this.biometricAuth.createChallenge(sandbox.id);
      
      // Simulate authentication (in real app, user would provide biometric)
      const authResponse = {
        verified: true,
        method: 'biometric',
      };

      const verification = this.biometricAuth.verifyResponse(
        challenge.challenge,
        authResponse
      );

      if (!verification.verified) {
        throw new Error('Authentication failed');
      }

      // Step 5: Execute the action
      console.log('✅ Authentication verified, executing action...');
      const result = await this.sandboxManager.executeAction(
        sandbox.id,
        verification
      );

      // Step 6: Cleanup
      console.log('Cleaning up sandbox...');
      await this.sandboxManager.cancelSandbox(sandbox.id);

      return {
        success: true,
        ...result,
        auditTrail: this.sandboxManager.getAuditLog(sandbox.id),
      };

    } catch (error) {
      console.error('Error in verifyAndExecute:', error);
      throw error;
    }
  }

  /**
   * Get audit log for a specific action
   * @param {string} sandboxId - Sandbox ID (optional)
   * @returns {Array} Audit log entries
   */
  getAuditLog(sandboxId = null) {
    return this.sandboxManager.getAuditLog(sandboxId);
  }

  /**
   * Get active sandboxes
   * @returns {Array} Active sandbox IDs
   */
  getActiveSandboxes() {
    return this.sandboxManager.getActiveSandboxes();
  }
}

module.exports = PaymentBoxAI;

// CLI example usage
if (require.main === module) {
  const paymentBox = new PaymentBoxAI();

  // Example action request
  const exampleAction = {
    action: 'purchase',
    targetUrl: 'https://www.example.com',
    productName: 'Example Product',
    price: '$99.99',
    productSelector: '.product-item',
    actionButton: '.buy-button',
  };

  console.log('🔐 Payment Box AI - Verified Action Sandboxes\n');
  console.log('Starting example verification flow...\n');

  paymentBox.verifyAndExecute(exampleAction)
    .then((result) => {
      console.log('\n✨ Action completed successfully!');
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Action failed:', error.message);
      process.exit(1);
    });
}
