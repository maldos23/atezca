import { az } from '@atezca/core';

// E-commerce checkout flow
az.setup({
  url: 'https://your-ecommerce-site.com',
  browser: 'chromium',
  headless: false, // Show browser for demo
  timeout: 30000,
  outputDir: 'generated-tests',
});

// Browse products
az.test('navigate', 'go to products page');
az.test('interact', "click on first product");
az.test('wait', 'until product details are visible');

// Add to cart
az.test('interact', "select size 'Large' from dropdown");
az.test('interact', "click 'Add to Cart' button");
az.test('expect', 'show cart notification');

// Checkout
az.test('interact', "click cart icon");
az.test('wait', 'until cart page loads');
az.test('expect', 'show product in cart');
az.test('interact', "click 'Proceed to Checkout'");

// Fill shipping info
az.test('interact', "type 'John Doe' in full name field");
az.test('interact', "type '123 Main St' in address field");
az.test('interact', "type 'New York' in city field");
az.test('interact', "select 'New York' from state dropdown");
az.test('interact', "type '10001' in zip code field");

// Submit order
az.test('interact', "click 'Place Order' button");
az.test('wait', 'until confirmation page appears');
az.test('expect', 'show order confirmation message');
