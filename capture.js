const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    dumpio: true, // Enable verbose logging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader', // Added flag for software WebGL
      '--no-zygote', // Added to potentially resolve network issues
      '--disable-web-security', // Disable CORS for file:/// access
      '--allow-file-access-from-files' // Allow file access from files for file:///
    ],
    protocolTimeout: 60000 // Increase protocol timeout
  });
  const page = await browser.newPage();
  const consoleMessages = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  try {
    await page.goto('http://localhost:8000/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.error('Error during page.goto:', e);
    await browser.close();
    process.exit(1);
  }

  // Wait for 15 seconds to allow animation to run
  await new Promise(resolve => setTimeout(resolve, 15000));

  // const screenshot = await page.screenshot({ path: 'screenshot.png' });

  // Check for success console message
  let successConditionMet = false;
  const expectedMessage = 'Success condition met: Changing clear color to green.';
  for (const msg of consoleMessages) {
    if (msg.text === expectedMessage) {
      successConditionMet = true;
      break;
    }
  }

  await browser.close();

  const output = {
    console: consoleMessages,
    // screenshotFile: 'screenshot.png',
    successConditionMet: successConditionMet
  };

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
  console.log('Captured output to output.json');
})();
