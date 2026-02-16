const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

/**
 * SandboxManager - Core component for creating isolated execution environments
 * This manages the lifecycle of sandboxed browser instances for action verification
 */
class SandboxManager {
  constructor() {
    this.activeSandboxes = new Map();
    this.auditLog = [];
  }

  /**
   * Create a new sandbox instance
   * @param {Object} actionRequest - The AI action to be verified
   * @returns {Object} Sandbox instance with unique ID
   */
  async createSandbox(actionRequest) {
    const sandboxId = uuidv4();
    
    // Launch headless browser with security restrictions
    const browser = await puppeteer.launch({
      headless: false, // Show the browser for visual verification
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security', // For demo purposes - remove in production
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1280, height: 800 });

    const sandbox = {
      id: sandboxId,
      browser,
      page,
      actionRequest,
      status: 'initialized',
      createdAt: new Date(),
      screenshots: [],
    };

    this.activeSandboxes.set(sandboxId, sandbox);
    this.logAction(sandboxId, 'sandbox_created', actionRequest);

    return sandbox;
  }

  /**
   * Simulate an action in the sandbox
   * @param {string} sandboxId - Unique sandbox identifier
   * @returns {Object} Simulation results with screenshots
   */
  async simulateAction(sandboxId) {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    const { page, actionRequest } = sandbox;
    const steps = [];

    try {
      sandbox.status = 'simulating';

      // Step 1: Navigate to the target website
      console.log(`Navigating to ${actionRequest.targetUrl}...`);
      await page.goto(actionRequest.targetUrl, { waitUntil: 'networkidle2' });
      
      const screenshot1 = await page.screenshot({ encoding: 'base64' });
      steps.push({
        step: 1,
        action: 'navigate',
        description: `Navigate to ${actionRequest.targetUrl}`,
        screenshot: screenshot1,
      });

      // Step 2: Simulate finding the product
      if (actionRequest.productSelector) {
        console.log('Looking for product...');
        await page.waitForSelector(actionRequest.productSelector, { timeout: 5000 });
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.style.border = '3px solid #00ff00';
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, actionRequest.productSelector);

        await page.waitForTimeout(1000);
        const screenshot2 = await page.screenshot({ encoding: 'base64' });
        steps.push({
          step: 2,
          action: 'identify_product',
          description: 'Product identified and highlighted',
          screenshot: screenshot2,
        });
      }

      // Step 3: Simulate clicking add to cart or buy button
      if (actionRequest.actionButton) {
        console.log('Highlighting action button...');
        await page.evaluate((selector) => {
          const button = document.querySelector(selector);
          if (button) {
            button.style.border = '3px solid #ff9900';
            button.style.boxShadow = '0 0 10px rgba(255, 153, 0, 0.8)';
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, actionRequest.actionButton);

        await page.waitForTimeout(1000);
        const screenshot3 = await page.screenshot({ encoding: 'base64' });
        steps.push({
          step: 3,
          action: 'prepare_action',
          description: `Ready to click: ${actionRequest.actionButton}`,
          screenshot: screenshot3,
          requiresConfirmation: true,
        });
      }

      sandbox.status = 'awaiting_confirmation';
      sandbox.simulationSteps = steps;
      
      this.logAction(sandboxId, 'simulation_complete', { stepsCount: steps.length });

      return {
        sandboxId,
        steps,
        status: 'awaiting_confirmation',
        actionSummary: this.generateActionSummary(actionRequest),
      };

    } catch (error) {
      sandbox.status = 'simulation_failed';
      this.logAction(sandboxId, 'simulation_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute the action after user confirmation
   * @param {string} sandboxId - Unique sandbox identifier
   * @param {Object} biometricAuth - Biometric authentication result
   * @returns {Object} Execution result
   */
  async executeAction(sandboxId, biometricAuth) {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    if (sandbox.status !== 'awaiting_confirmation') {
      throw new Error(`Sandbox ${sandboxId} is not ready for execution`);
    }

    if (!biometricAuth || !biometricAuth.verified) {
      throw new Error('Biometric authentication required');
    }

    const { page, actionRequest } = sandbox;

    try {
      sandbox.status = 'executing';
      this.logAction(sandboxId, 'execution_started', { 
        authMethod: biometricAuth.method 
      });

      // Execute the actual action
      if (actionRequest.actionButton) {
        await page.click(actionRequest.actionButton);
        await page.waitForTimeout(2000);
      }

      // Capture final state
      const finalScreenshot = await page.screenshot({ encoding: 'base64' });

      sandbox.status = 'completed';
      sandbox.executionResult = {
        success: true,
        timestamp: new Date(),
        screenshot: finalScreenshot,
      };

      this.logAction(sandboxId, 'execution_complete', { 
        success: true 
      });

      return {
        sandboxId,
        success: true,
        screenshot: finalScreenshot,
        message: 'Action executed successfully',
      };

    } catch (error) {
      sandbox.status = 'execution_failed';
      this.logAction(sandboxId, 'execution_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel and cleanup a sandbox
   * @param {string} sandboxId - Unique sandbox identifier
   */
  async cancelSandbox(sandboxId) {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      return;
    }

    this.logAction(sandboxId, 'sandbox_cancelled', {});

    try {
      await sandbox.browser.close();
    } catch (error) {
      console.error(`Error closing browser: ${error.message}`);
    }

    this.activeSandboxes.delete(sandboxId);
  }

  /**
   * Generate human-readable action summary
   * @param {Object} actionRequest - The action to summarize
   * @returns {Object} Summary object
   */
  generateActionSummary(actionRequest) {
    return {
      action: actionRequest.action || 'purchase',
      target: actionRequest.targetUrl,
      product: actionRequest.productName || 'Selected item',
      price: actionRequest.price || 'Price to be confirmed',
      vendor: this.extractDomain(actionRequest.targetUrl),
      riskLevel: this.assessRiskLevel(actionRequest),
    };
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Assess risk level of action
   */
  assessRiskLevel(actionRequest) {
    // Simple risk assessment logic
    const knownDomains = ['amazon.com', 'ebay.com', 'walmart.com'];
    const domain = this.extractDomain(actionRequest.targetUrl);
    
    if (knownDomains.some(d => domain.includes(d))) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Log action to audit trail
   */
  logAction(sandboxId, action, details) {
    const logEntry = {
      timestamp: new Date(),
      sandboxId,
      action,
      details,
    };
    this.auditLog.push(logEntry);
    console.log(`[AUDIT] ${action}:`, details);
  }

  /**
   * Get audit log
   * @returns {Array} Audit log entries
   */
  getAuditLog(sandboxId = null) {
    if (sandboxId) {
      return this.auditLog.filter(entry => entry.sandboxId === sandboxId);
    }
    return this.auditLog;
  }

  /**
   * Get all active sandboxes
   * @returns {Array} List of active sandbox IDs
   */
  getActiveSandboxes() {
    return Array.from(this.activeSandboxes.keys());
  }
}

module.exports = SandboxManager;
