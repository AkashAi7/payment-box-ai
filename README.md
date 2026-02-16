# 🔐 Payment Box AI - Verified Action Sandboxes

> The first solution to make Autonomous AI feel Safe and Auditable

## The Problem

In 2026, consumers are using AI for shopping, but they hesitate at the final "Buy" button because they don't trust the AI with their payment data or brand authenticity.

## The Solution: Verified Action Sandboxes

Instead of the AI just saying "I bought this for you," Payment Box AI creates a **visual verification layer**. It runs a "simulation" of the action on a local CPU-hosted browser, shows the user exactly what it's about to do, and asks for a fingerprint/face-ID confirmation.

## Key Features

✅ **Visual Verification** - See exactly what the AI will do before it happens  
✅ **Sandboxed Execution** - All actions run in isolated, secure environments  
✅ **Biometric Authentication** - Fingerprint/Face-ID confirmation for trust  
✅ **Audit Trail** - Complete logging of all actions and decisions  
✅ **Risk Assessment** - Automatic evaluation of vendor trustworthiness  
✅ **Real-time Simulation** - Live preview of actions with screenshots

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│              (Visual Verification Layer)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│         (Express Server with REST Endpoints)                │
└──────┬─────────────────────────────────┬────────────────────┘
       │                                 │
       ▼                                 ▼
┌─────────────────┐           ┌────────────────────┐
│  Sandbox        │           │  Biometric Auth    │
│  Manager        │           │  Manager           │
│                 │           │                    │
│ • Create        │           │ • WebAuthn         │
│ • Simulate      │           │ • Challenge/       │
│ • Execute       │           │   Response         │
│ • Audit         │           │ • Verification     │
└────────┬────────┘           └────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│            Puppeteer Browser Automation                     │
│              (Sandboxed Browser Instance)                   │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone https://github.com/AkashAi7/payment-box-ai.git
cd payment-box-ai

# Install dependencies
npm install

# Start the server
npm start
```

## Quick Start

### 1. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 2. Open the Web Interface

Navigate to `http://localhost:3000` in your browser to access the visual verification interface.

### 3. Use the API

#### Create a Sandbox

```javascript
POST /api/sandbox/create
Content-Type: application/json

{
  "action": "purchase",
  "targetUrl": "https://example.com/product",
  "productName": "Example Product",
  "price": "$99.99",
  "productSelector": ".product-item",
  "actionButton": ".buy-button"
}
```

#### Simulate Action

```javascript
POST /api/sandbox/:sandboxId/simulate
```

#### Execute with Biometric Auth

```javascript
POST /api/sandbox/:sandboxId/execute
Content-Type: application/json

{
  "challenge": "auth-challenge-string",
  "authResponse": {
    "verified": true,
    "method": "biometric"
  }
}
```

## Usage Example

```javascript
const PaymentBoxAI = require('./src/index.js');

const paymentBox = new PaymentBoxAI();

// Define the action
const actionRequest = {
  action: 'purchase',
  targetUrl: 'https://www.example.com/product',
  productName: 'Wireless Headphones',
  price: '$149.99',
  productSelector: '.product-card',
  actionButton: '.add-to-cart-button',
};

// Verify and execute with user confirmation
paymentBox.verifyAndExecute(actionRequest)
  .then(result => {
    console.log('Action completed:', result);
    console.log('Audit trail:', result.auditTrail);
  })
  .catch(error => {
    console.error('Action failed:', error);
  });
```

## API Reference

### Sandbox Management

- `POST /api/sandbox/create` - Create a new sandbox
- `POST /api/sandbox/:id/simulate` - Simulate action in sandbox
- `POST /api/sandbox/:id/execute` - Execute action after confirmation
- `POST /api/sandbox/:id/cancel` - Cancel and cleanup sandbox
- `GET /api/sandbox/active` - Get all active sandboxes

### Authentication

- `POST /api/auth/challenge` - Create authentication challenge
- Supports WebAuthn for fingerprint/Face-ID
- Fallback to PIN authentication

### Audit & Monitoring

- `GET /api/audit` - Get audit log for all actions
- `GET /api/audit?sandboxId=xxx` - Get audit log for specific sandbox
- `GET /api/health` - Health check endpoint

## Security Features

### 1. Sandboxed Execution
- Each action runs in an isolated browser instance
- No direct access to user data or payment information
- Automatic cleanup after execution

### 2. Visual Verification
- Real-time screenshots of each step
- Highlighted UI elements showing exactly what will be clicked
- Clear action summary before execution

### 3. Biometric Authentication
- WebAuthn API integration for fingerprint/Face-ID
- Secure challenge-response protocol
- Time-limited authentication tokens

### 4. Audit Trail
- Complete logging of all actions
- Timestamped event tracking
- Immutable audit log

### 5. Risk Assessment
- Automatic vendor verification
- Domain reputation checking
- Risk level indicators (Low, Medium, High)

## Components

### SandboxManager
Manages the lifecycle of sandboxed browser instances:
- Creates isolated execution environments
- Simulates actions with visual feedback
- Executes confirmed actions
- Maintains audit logs

### BiometricAuth
Handles authentication and verification:
- WebAuthn integration for biometric auth
- Challenge-response authentication
- Token validation and expiration

### Express API
RESTful API for sandbox orchestration:
- Sandbox lifecycle management
- Authentication endpoints
- Audit log retrieval

### Web Interface
User-friendly visual verification layer:
- Real-time action preview
- Step-by-step simulation display
- Biometric confirmation prompts
- Action summary and risk indicators

## Development

```bash
# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Configuration

Create a `.env` file for custom configuration:

```env
PORT=3000
NODE_ENV=development
SANDBOX_TIMEOUT=300000
AUTH_EXPIRATION=300
```

## Use Cases

### 1. AI Shopping Assistants
- AI suggests products
- User reviews simulation
- Confirms with biometric auth
- Purchase executed safely

### 2. Automated Bill Payments
- AI schedules payments
- User verifies payment details
- Confirms with fingerprint
- Payment processed securely

### 3. Subscription Management
- AI manages subscriptions
- User reviews changes
- Confirms cancellations/renewals
- Changes applied with audit trail

### 4. Price Monitoring & Auto-Purchase
- AI monitors price drops
- Notifies user of opportunities
- Shows purchase preview
- Executes on biometric confirmation

## Benefits

### For Users
- **Trust**: See exactly what AI will do
- **Security**: Biometric authentication required
- **Control**: Cancel at any time
- **Transparency**: Complete audit trail

### For Businesses
- **Compliance**: Auditable AI actions
- **Trust**: Build consumer confidence
- **Differentiation**: First-to-market advantage
- **Risk Mitigation**: Isolated execution environment

## The "Hit" Potential

> **Trust is the new currency. The first company to make "Autonomous AI" feel "Safe and Auditable" will win the consumer market.**

This solution addresses the critical trust barrier preventing widespread adoption of autonomous AI for commerce. By providing:

1. **Visual Proof** - Users see the action before it happens
2. **Biometric Security** - Strong authentication requirement
3. **Sandboxed Safety** - Isolated execution prevents unauthorized access
4. **Complete Auditability** - Every action is logged and traceable

## Future Enhancements

- [ ] Machine learning-based fraud detection
- [ ] Multi-party approval workflows
- [ ] Integration with major e-commerce platforms
- [ ] Mobile app with native biometric support
- [ ] Blockchain-based immutable audit trail
- [ ] AI-powered risk assessment improvements
- [ ] Voice confirmation support
- [ ] Cross-platform synchronization

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to help improve Payment Box AI.

## License

MIT License - See LICENSE file for details

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for a safer AI-powered future**