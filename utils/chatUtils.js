/**
 * Check if a message is off-topic (not about shoes or shopping)
 * @param {string} message - The user message
 * @returns {boolean} True if the message is off-topic
 */
function isOffTopic(message) {
  const offTopicKeywords = [
    "weather",
    "forecast",
    "rain",
    "sunny",
    "temperature",
    "news",
    "politics",
    "sports",
    "movie",
    "music",
    "dating",
    "restaurant",
  ];

  const shoeKeywords = [
    "shoe",
    "sneaker",
    "boot",
    "sandal",
    "footwear",
    "size",
    "brand",
    "nike",
    "adidas",
    "order",
    "purchase",
    "delivery",
    "return",
    "price",
    "cost",
    "discount",
    "sale",
    "cart",
    "wishlist",
    "buy",
    "color",
    "stock",
    "available",
    "find",
    "shipping",
    "policy",
  ];

  const lowercaseMsg = message.toLowerCase();

  // Check for explicit off-topic keywords
  for (const keyword of offTopicKeywords) {
    if (lowercaseMsg.includes(keyword)) {
      return true;
    }
  }

  // If message is long enough, make sure it contains at least one shoe keyword
  if (message.length > 10) {
    for (const keyword of shoeKeywords) {
      if (lowercaseMsg.includes(keyword)) {
        return false;
      }
    }
    return true; // Long message with no shoe keywords
  }

  return false;
}

/**
 * Check if a message is asking about store policies
 * @param {string} message - The user message
 * @returns {string|null} The policy type or null if not policy related
 */
function detectPolicyQuestion(message) {
  const lowercaseMsg = message.toLowerCase().trim();
  
  const returnKeywords = [
    'return', 'refund', 'send back', 'money back', '30 day', 
    'exchange', 'send it back', 'return policy'
  ];
  
  const shippingKeywords = [
    'shipping', 'delivery', 'ship', 'arrive', 'when will it come',
    'how long', 'shipping time', 'shipping cost', 'delivery time'
  ];
  
  const warrantyKeywords = [
    'warranty', 'guarantee', 'repair', 'replace', 'broken',
    'fix', 'damaged', 'defective'
  ];
  
  if (returnKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
    return 'return';
  }
  
  if (shippingKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
    return 'shipping';
  }
  
  if (warrantyKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
    return 'warranty';
  }
  
  return null;
}

module.exports = {
  isOffTopic,
  detectPolicyQuestion
};
