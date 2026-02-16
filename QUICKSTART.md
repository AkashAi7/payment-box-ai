# Quick Start Guide

Get started with Payment Box AI in 5 minutes!

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager

## Installation

```bash
# Clone the repository
git clone https://github.com/AkashAi7/payment-box-ai.git
cd payment-box-ai

# Install dependencies
npm install

# (Optional) Copy and configure environment variables
cp .env.example .env
```

## Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## Option 1: Use the Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. Fill in the action details:
   - Target URL: The website where the action will be performed
   - Product Name: Name of the product (for display)
   - Price: Price of the product
   - Product Selector: CSS selector for the product element
   - Action Button: CSS selector for the buy/action button
3. Click "Verify Action in Sandbox"
4. Review the simulation steps and screenshots
5. Confirm with biometric authentication
6. Action is executed securely!

## Option 2: Use the API

### 1. Create a Sandbox

```bash
curl -X POST http://localhost:3000/api/sandbox/create \
  -H "Content-Type: application/json" \
  -d '{
    "action": "purchase",
    "targetUrl": "https://example.com/product",
    "productName": "Example Product",
    "price": "$99.99",
    "productSelector": ".product-item",
    "actionButton": ".buy-button"
  }'
```

Response:
```json
{
  "success": true,
  "sandboxId": "abc123...",
  "status": "initialized"
}
```

### 2. Simulate the Action

```bash
curl -X POST http://localhost:3000/api/sandbox/{sandboxId}/simulate
```

Response includes:
- Step-by-step simulation
- Screenshots of each step
- Action summary with risk assessment

### 3. Create Authentication Challenge

```bash
curl -X POST http://localhost:3000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"sandboxId": "abc123..."}'
```

### 4. Execute the Action

```bash
curl -X POST http://localhost:3000/api/sandbox/{sandboxId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "challenge": "challenge-string",
    "authResponse": {
      "verified": true,
      "method": "biometric"
    }
  }'
```

## Option 3: Use the SDK

```javascript
const PaymentBoxAI = require('./src/index.js');

const paymentBox = new PaymentBoxAI();

const actionRequest = {
  action: 'purchase',
  targetUrl: 'https://example.com/product',
  productName: 'Wireless Headphones',
  price: '$149.99',
  productSelector: '.product-card',
  actionButton: '.buy-button',
};

// Verify and execute with user confirmation
paymentBox.verifyAndExecute(actionRequest)
  .then(result => {
    console.log('Success!', result);
  })
  .catch(error => {
    console.error('Failed:', error);
  });
```

## Run Examples

```bash
# Basic shopping example
node examples/basic-shopping.js

# API integration example (requires server to be running)
node examples/api-integration.js
```

## Run Tests

```bash
npm test
```

## Next Steps

- Read the [full documentation](README.md)
- Check out the [API reference](README.md#api-reference)
- Learn about [security features](README.md#security-features)
- Explore the [examples](examples/)

## Common Issues

### Puppeteer Installation Issues

If you encounter issues installing Puppeteer:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

Note: You'll need to install Chrome/Chromium separately if you skip Puppeteer's bundled browser.

### Port Already in Use

If port 3000 is already in use, set a different port:

```bash
PORT=3001 npm start
```

## Need Help?

- Check the [README](README.md)
- Look at [examples](examples/)
- Open an [issue on GitHub](https://github.com/AkashAi7/payment-box-ai/issues)

Happy coding! 🚀
