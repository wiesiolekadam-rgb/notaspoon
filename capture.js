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
      '--enable-unsafe-swiftshader' // Added flag for software WebGL
    ]
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
    await page.goto('http://localhost:8000/index.html', { waitUntil: 'load', timeout: 60000 });
  } catch (e) {
    console.error('Error during page.goto:', e);
    await browser.close();
    process.exit(1);
  }

  // Wait for 5 seconds to allow animation to run
  await new Promise(resolve => setTimeout(resolve, 5000));

  const screenshot = await page.screenshot({ path: 'screenshot.png' });

  // Check background color
  const backgroundColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).getPropertyValue('background-color');
  });

  await browser.close();

  const output = {
    console: consoleMessages,
    screenshotFile: 'screenshot.png',
    backgroundColor: backgroundColor,
    didTurnGreen: backgroundColor === 'rgb(0, 255, 0)' || backgroundColor === '#00ff00'
  };

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
  console.log('Captured output to output.json');
})();
