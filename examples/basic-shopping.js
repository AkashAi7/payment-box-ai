/**
 * Example: Basic AI Shopping Assistant
 * 
 * This example shows how to use Payment Box AI to safely execute
 * an AI-recommended purchase with visual verification and biometric auth.
 */

const PaymentBoxAI = require('../src/index.js');

async function aiShoppingAssistant() {
  const paymentBox = new PaymentBoxAI();

  // AI recommends a product based on user preferences
  const aiRecommendation = {
    action: 'purchase',
    targetUrl: 'https://www.example.com/wireless-headphones',
    productName: 'Premium Wireless Headphones',
    price: '$149.99',
    productSelector: '.product-card',
    actionButton: '.add-to-cart-button',
  };

  console.log('🤖 AI Shopping Assistant');
  console.log('========================\n');
  console.log('AI Recommendation:', aiRecommendation.productName);
  console.log('Price:', aiRecommendation.price);
  console.log('\nInitiating secure verification process...\n');

  try {
    // Use Payment Box AI to verify and execute the action
    const result = await paymentBox.verifyAndExecute(aiRecommendation);

    console.log('\n✅ Purchase completed successfully!');
    console.log('Sandbox ID:', result.sandboxId);
    console.log('\n📋 Audit Trail:');
    result.auditTrail.forEach(entry => {
      console.log(`  ${entry.timestamp.toISOString()} - ${entry.action}`);
    });

  } catch (error) {
    console.error('\n❌ Purchase failed:', error.message);
  }
}

// Run the example
if (require.main === module) {
  aiShoppingAssistant()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = aiShoppingAssistant;
