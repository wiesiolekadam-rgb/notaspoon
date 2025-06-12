// Module-local variables to store shared state
let gl = null;
let programInfo = null; // For spoon
let buffers = null;     // For spoon
let gridProgramInfo = null;
let gridBuffers = null;
let spoonRotation = 0.0;
let then = 0;
let frameCount = 0;
let successSignaled = false;

// drawScene is defined before render, as render calls it.
function drawScene(deltaTime) {
  console.log("drawScene: Starting scene drawing for deltaTime:", deltaTime);
  try {
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix (shared for both spoon and grid)
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = glMatrix.mat4.create(); // glMatrix is global
    glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // --- Draw Grid ---
    const gridModelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(gridModelViewMatrix, gridModelViewMatrix, [-0.0, -1.5, -6.0]); // Position grid slightly lower
    glMatrix.mat4.rotate(gridModelViewMatrix, gridModelViewMatrix, Math.PI / 10, [1, 0, 0]); // Rotate grid

    gl.useProgram(gridProgramInfo.program);
    gl.uniformMatrix4fv(gridProgramInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(gridProgramInfo.uniformLocations.modelViewMatrix, false, gridModelViewMatrix);

    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffers.position);
      gl.vertexAttribPointer(
          gridProgramInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(gridProgramInfo.attribLocations.vertexPosition);
    }
    gl.drawArrays(gl.LINES, 0, gridBuffers.vertexCount);
    // --- End Draw Grid ---

    // --- Draw Spoon ---
    const spoonModelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(spoonModelViewMatrix, spoonModelViewMatrix, [-0.0, 0.0, -6.0]);

    spoonRotation += deltaTime * 0.5; // Update spoonRotation
    glMatrix.mat4.rotate(spoonModelViewMatrix, spoonModelViewMatrix, spoonRotation, [0, 1, 0]);
    glMatrix.mat4.rotate(spoonModelViewMatrix, spoonModelViewMatrix, spoonRotation * 0.7, [1, 0, 0]);

    const normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, spoonModelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    gl.useProgram(programInfo.program); // Switch to spoon shader

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, spoonModelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    // Set new uniforms for specular lighting
    gl.uniform3fv(programInfo.uniformLocations.uViewPosition, [0.0, 0.0, 0.0]); // Camera is at origin in view space
    gl.uniform3fv(programInfo.uniformLocations.uSpecularColor, [1.0, 1.0, 1.0]); // White specular highlights
    gl.uniform1f(programInfo.uniformLocations.uShininess, 32.0); // Shininess factor

    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexNormal,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    {
      const vertexCount = 48; // This should ideally come from spoonModelData.indices.length / (vertices per face * faces)
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
    // --- End Draw Spoon ---
    console.log("drawScene: Scene drawing complete.");
  } catch (e) {
    console.error("drawScene: Error during scene drawing:", e);
  }
}

function render(now) {
  console.log("render: Starting frame rendering for timestamp:", now);
  try {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now; // Update 'then'

    if (!successSignaled && frameCount > 10) {
      console.log('Success condition met: Changing clear color to green.');
      if (gl) {
        gl.clearColor(0.2, 0.8, 0.2, 1.0); // A visible green
      }
      successSignaled = true; // Update 'successSignaled'
    }
    frameCount++; // Update 'frameCount'

    drawScene(deltaTime);

  } catch (e) {
    console.error("render: Error in render loop:", e);
  }
  requestAnimationFrame(render); // Use the local render for recursion
  console.log("render: Frame rendering complete, requested next frame.");
}

function initRenderer(context) {
  gl = context.gl;
  programInfo = context.programInfo;
  buffers = context.buffers;
  gridProgramInfo = context.gridProgramInfo;
  gridBuffers = context.gridBuffers;
  // Initialize animation state variables
  spoonRotation = context.spoonRotation;
  then = context.then;
  frameCount = context.frameCount;
  successSignaled = context.successSignaled;
  console.log("renderer: Initialized with context:", context);
}

export { initRenderer, render };
