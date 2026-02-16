/**
 * Example: API Integration
 * 
 * This example demonstrates how to integrate Payment Box AI
 * with your existing application using the REST API.
 */

// Use built-in fetch (Node.js 18+) or require node-fetch
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function createSandbox(actionRequest) {
  const response = await fetch(`${API_BASE}/sandbox/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actionRequest),
  });

  return await response.json();
}

async function simulateAction(sandboxId) {
  const response = await fetch(`${API_BASE}/sandbox/${sandboxId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  return await response.json();
}

async function createAuthChallenge(sandboxId) {
  const response = await fetch(`${API_BASE}/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sandboxId }),
  });

  return await response.json();
}

async function executeAction(sandboxId, challenge, authResponse) {
  const response = await fetch(`${API_BASE}/sandbox/${sandboxId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge, authResponse }),
  });

  return await response.json();
}

async function getAuditLog(sandboxId = null) {
  const url = sandboxId 
    ? `${API_BASE}/audit?sandboxId=${sandboxId}`
    : `${API_BASE}/audit`;
  
  const response = await fetch(url);
  return await response.json();
}

async function apiExample() {
  console.log('📡 Payment Box AI - API Integration Example\n');

  const actionRequest = {
    action: 'purchase',
    targetUrl: 'https://www.example.com/product',
    productName: 'Example Product',
    price: '$99.99',
    productSelector: '.product-item',
    actionButton: '.buy-button',
  };

  try {
    // Step 1: Create sandbox
    console.log('1. Creating sandbox...');
    const createResult = await createSandbox(actionRequest);
    console.log(`   ✓ Sandbox created: ${createResult.sandboxId}\n`);

    const sandboxId = createResult.sandboxId;

    // Step 2: Simulate action
    console.log('2. Simulating action...');
    const simulationResult = await simulateAction(sandboxId);
    console.log(`   ✓ Simulation complete with ${simulationResult.steps.length} steps\n`);

    // Step 3: Create authentication challenge
    console.log('3. Creating authentication challenge...');
    const challengeResult = await createAuthChallenge(sandboxId);
    console.log(`   ✓ Challenge created: ${challengeResult.challenge.substring(0, 20)}...\n`);

    // Step 4: Execute action (simulate biometric auth)
    console.log('4. Executing action with biometric auth...');
    const authResponse = {
      verified: true,
      method: 'biometric',
    };
    
    const executeResult = await executeAction(
      sandboxId,
      challengeResult.challenge,
      authResponse
    );
    console.log(`   ✓ Action executed successfully!\n`);

    // Step 5: Get audit log
    console.log('5. Retrieving audit log...');
    const auditLog = await getAuditLog(sandboxId);
    console.log(`   ✓ Retrieved ${auditLog.count} audit entries\n`);

    console.log('📋 Audit Log:');
    auditLog.logs.forEach(entry => {
      console.log(`   ${entry.timestamp} - ${entry.action}`);
    });

    console.log('\n✅ API integration example completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  apiExample()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  createSandbox,
  simulateAction,
  createAuthChallenge,
  executeAction,
  getAuditLog,
};
