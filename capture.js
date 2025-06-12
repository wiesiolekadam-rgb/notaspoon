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

  // TODO: Enhance success condition for more robust testing.
  // The current `successConditionMet` only checks if the background turned green,
  // which indicates the rendering loop is running, but not necessarily that the
  // spoon (or other objects) are visible.
  // For a more thorough test, consider implementing pixel checking:
  // 1. Stop or control spoon animation to have a predictable scene.
  // 2. Use page.evaluate() to call gl.readPixels() on the canvas context
  //    at an expected location of the spoon.
  // 3. Analyze the returned pixel color to confirm it's not the background color.
  //    Example:
  //    const pixelData = await page.evaluate(() => {
  //      const gl = document.querySelector('#glCanvas').getContext('webgl');
  //      if (!gl) return null;
  //      const x = gl.canvas.width / 2; // Example: center pixel
  //      const y = gl.canvas.height / 2;
  //      const pixels = new Uint8Array(4);
  //      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  //      return Array.from(pixels); // [R, G, B, A]
  //    });
  //    if (pixelData) {
  //      const isGreenBackground = pixelData[0] < 100 && pixelData[1] > 200 && pixelData[2] < 100;
  //      if (!isGreenBackground) {
  //        console.log("Pixel check suggests an object is rendered on the green background.");
  //        // Potentially update a more robust success condition here.
  //      } else {
  //        console.log("Pixel check suggests only green background is visible at the center.");
  //      }
  //    }
  // This would require careful coordination of the spoon's expected position and color.
  await browser.close();

  const output = {
    console: consoleMessages,
    // screenshotFile: 'screenshot.png',
    successConditionMet: successConditionMet
  };

  fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
  console.log('Captured output to output.json');
})();
