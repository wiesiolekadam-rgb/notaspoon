function initWebGL() {
  const canvas = document.querySelector("#glCanvas");

  // Adjust canvas resolution for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  // Get the desired display size from canvas attributes (or default if not set)
  // These are the dimensions we set in index.html (e.g., 800x600)
  // Use clientWidth/Height to get the size the browser is currently displaying the canvas at
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Set the actual drawing buffer size
  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);

  // If CSS is controlling the display size, you might need to set style.width and style.height
  // to maintain the intended display dimensions, e.g.:
  // canvas.style.width = displayWidth + 'px';
  // canvas.style.height = displayHeight + 'px';
  // For now, we assume the CSS or HTML attributes handle the display size correctly.

  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return null;
  }

  // Set the viewport to the new drawing buffer size
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0.133, 0.133, 0.133, 1.0); // #222222
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  return gl;
}

export { initWebGL };
