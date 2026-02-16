const express = require('express');
const cors = require('cors');
const SandboxManager = require('./SandboxManager');
const BiometricAuth = require('./BiometricAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window

// Simple rate limiting middleware
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  next();
}

// Clean up old rate limit data periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recentRequests.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, recentRequests);
    }
  }
}, 60000); // Clean every minute

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api', rateLimit); // Apply rate limiting to all API routes

// Initialize managers
const sandboxManager = new SandboxManager();
const biometricAuth = new BiometricAuth();

// Clean up expired authentications periodically
setInterval(() => {
  biometricAuth.clearExpired();
}, 60000); // Every minute

/**
 * API Routes
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    activeSandboxes: sandboxManager.getActiveSandboxes().length,
  });
});

// Create a new sandbox for action verification
app.post('/api/sandbox/create', async (req, res) => {
  try {
    const actionRequest = req.body;

    // Validate request
    if (!actionRequest.targetUrl) {
      return res.status(400).json({
        error: 'targetUrl is required',
      });
    }

    const sandbox = await sandboxManager.createSandbox(actionRequest);

    res.json({
      success: true,
      sandboxId: sandbox.id,
      status: sandbox.status,
      message: 'Sandbox created successfully',
    });

  } catch (error) {
    console.error('Error creating sandbox:', error);
    res.status(500).json({
      error: 'Failed to create sandbox',
      message: error.message,
    });
  }
});

// Simulate action in sandbox
app.post('/api/sandbox/:sandboxId/simulate', async (req, res) => {
  try {
    const { sandboxId } = req.params;

    const result = await sandboxManager.simulateAction(sandboxId);

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Error simulating action:', error);
    res.status(500).json({
      error: 'Failed to simulate action',
      message: error.message,
    });
  }
});

// Create authentication challenge
app.post('/api/auth/challenge', (req, res) => {
  try {
    const { sandboxId } = req.body;

    if (!sandboxId) {
      return res.status(400).json({
        error: 'sandboxId is required',
      });
    }

    const challenge = biometricAuth.createChallenge(sandboxId);

    res.json({
      success: true,
      ...challenge,
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      error: 'Failed to create authentication challenge',
      message: error.message,
    });
  }
});

// Verify authentication and execute action
// Note: Rate limiting is applied via app.use('/api', rateLimit) middleware above
// All /api routes including this one are protected by rate limiting
app.post('/api/sandbox/:sandboxId/execute', async (req, res) => {
  try {
    const { sandboxId } = req.params;
    const { challenge, authResponse } = req.body;

    // Verify authentication
    const verification = biometricAuth.verifyResponse(challenge, authResponse);

    if (!verification.verified) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: verification.error,
      });
    }

    // Execute action
    const result = await sandboxManager.executeAction(sandboxId, verification);

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({
      error: 'Failed to execute action',
      message: error.message,
    });
  }
});

// Cancel sandbox
app.post('/api/sandbox/:sandboxId/cancel', async (req, res) => {
  try {
    const { sandboxId } = req.params;

    await sandboxManager.cancelSandbox(sandboxId);

    res.json({
      success: true,
      message: 'Sandbox cancelled',
    });

  } catch (error) {
    console.error('Error cancelling sandbox:', error);
    res.status(500).json({
      error: 'Failed to cancel sandbox',
      message: error.message,
    });
  }
});

// Get audit log
app.get('/api/audit', (req, res) => {
  try {
    const { sandboxId } = req.query;

    const logs = sandboxManager.getAuditLog(sandboxId);

    res.json({
      success: true,
      logs,
      count: logs.length,
    });

  } catch (error) {
    console.error('Error retrieving audit log:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit log',
      message: error.message,
    });
  }
});

// Get active sandboxes
app.get('/api/sandbox/active', (req, res) => {
  try {
    const sandboxes = sandboxManager.getActiveSandboxes();

    res.json({
      success: true,
      sandboxes,
      count: sandboxes.length,
    });

  } catch (error) {
    console.error('Error retrieving sandboxes:', error);
    res.status(500).json({
      error: 'Failed to retrieve sandboxes',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Payment Box AI - Verified Action Sandboxes`);
  console.log(`   Server running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST   /api/sandbox/create`);
  console.log(`   POST   /api/sandbox/:id/simulate`);
  console.log(`   POST   /api/auth/challenge`);
  console.log(`   POST   /api/sandbox/:id/execute`);
  console.log(`   POST   /api/sandbox/:id/cancel`);
  console.log(`   GET    /api/audit`);
  console.log(`   GET    /api/sandbox/active`);
  console.log(`   GET    /api/health`);
  console.log('\n✨ Ready to create trusted AI experiences!\n');
});

module.exports = app;
