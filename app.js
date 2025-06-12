// Global state
let spoonRotation = 0.0;
let gl = null;
let programInfo = null;
let buffers = null;
let gridProgramInfo = null; // For the grid
let gridBuffers = null;     // For the grid
let then = 0;

// Basic WebGL setup
function main() {
  const canvas = document.querySelector("#glCanvas");
  gl = canvas.getContext("webgl"); // Assign to global gl

  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  gl.clearColor(0.133, 0.133, 0.133, 1.0); // #222222
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things


  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;

    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

      // Apply lighting effect
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program
  const fsSource = `
    varying highp vec3 vLighting;

    uniform samplerCube uSampler; // For environment mapping, if we add it later

    void main(void) {
      // Silver-like color for the spoon
      highp vec3 spoonColor = vec3(0.75, 0.75, 0.75);
      gl_FragColor = vec4(spoonColor * vLighting, 1.0);
    }
  `;

  // Initialize a shader program.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect shader program info.
  programInfo = { // Assign to global programInfo
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
    },
  };

  // Initialize buffers.
  buffers = initBuffers(gl); // Assign to global buffers

  // --- Grid Setup ---
  // Shaders for the grid
  const gridVsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;
  const gridFsSource = `
    void main(void) {
      gl_FragColor = vec4(0.3, 0.3, 0.3, 1.0); // Slightly lighter grey for grid lines
    }
  `;
  const gridShaderProgram = initShaderProgram(gl, gridVsSource, gridFsSource);
  gridProgramInfo = {
    program: gridShaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(gridShaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(gridShaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(gridShaderProgram, 'uModelViewMatrix'),
    },
  };
  gridBuffers = initGridBuffers(gl);
  // --- End Grid Setup ---

  // Start the animation loop
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional spoon.
//
function initBuffers(gl) {

  // Create a buffer for the spoon's positions.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the spoon.
  // Simplified spoon: handle (cuboid) and head (flattened ellipsoid part)
  const positions = [
    // Handle - 8 vertices
    -0.1, -0.5, -0.05, // 0
     0.1, -0.5, -0.05, // 1
     0.1,  0.5, -0.05, // 2
    -0.1,  0.5, -0.05, // 3
    -0.1, -0.5,  0.05, // 4
     0.1, -0.5,  0.05, // 5
     0.1,  0.5,  0.05, // 6
    -0.1,  0.5,  0.05, // 7

    // Head (simplified) - let's make it wider and flatter
    // Top surface of the spoon head (approximate)
    -0.3,  0.5, -0.02, // 8
     0.3,  0.5, -0.02, // 9
     0.3,  1.0, -0.02, // 10
    -0.3,  1.0, -0.02, // 11

    // Bottom surface of the spoon head
    -0.3,  0.5,  0.02, // 12
     0.3,  0.5,  0.02, // 13
     0.3,  1.0,  0.02, // 14
    -0.3,  1.0,  0.02, // 15
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the normals for the vertices.
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
    // Handle normals (pointing outwards)
    // Front face
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    // Back face
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    // Top face
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    // Bottom face
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    // Right face
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
    // Left face
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,

    // Spoon head normals (simplified - could be more nuanced)
    // Top surface (pointing up)
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    // Bottom surface (pointing down)
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  const indices = [
    // Handle
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    7,  6,  2,      7,  2,  3,    // top
    4,  5,  1,      4,  1,  0,    // bottom
    1,  5,  6,      1,  6,  2,    // right
    4,  0,  3,      4,  3,  7,    // left
    // Spoon Head - Top
    8, 9, 10,     8, 10, 11,
    // Spoon Head - Bottom
    12, 13, 14,   12, 14, 15,
    // Connecting sides for spoon head (simplified)
    8, 12, 13,     8, 13, 9,    // front edge
    11, 15, 14,    11, 14, 10,   // back edge
    9, 13, 14,     9, 14, 10,   // right edge
    8, 12, 15,     8, 15, 11,   // left edge
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//
function drawScene(deltaTime) { // gl, programInfo, buffers are now global
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix (shared for both spoon and grid)
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // --- Draw Grid ---
  const gridModelViewMatrix = mat4.create();
  mat4.translate(gridModelViewMatrix, gridModelViewMatrix, [-0.0, -1.5, -6.0]); // Position grid slightly lower
  // Rotate grid slightly to make it look like a floor
  mat4.rotate(gridModelViewMatrix, gridModelViewMatrix, Math.PI / 10, [1, 0, 0]);


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
  const spoonModelViewMatrix = mat4.create();
  mat4.translate(spoonModelViewMatrix, spoonModelViewMatrix, [-0.0, 0.0, -6.0]);

  spoonRotation += deltaTime * 0.5;
  mat4.rotate(spoonModelViewMatrix, spoonModelViewMatrix, spoonRotation, [0, 1, 0]);
  mat4.rotate(spoonModelViewMatrix, spoonModelViewMatrix, spoonRotation * 0.7, [1, 0, 0]);

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, spoonModelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.useProgram(programInfo.program); // Switch to spoon shader

  // Set spoon shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, spoonModelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  // Bind spoon vertex buffer
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

  // Bind spoon normal buffer
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

  // Bind spoon indices and draw
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  {
    const vertexCount = 48;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  // --- End Draw Spoon ---
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Initialize buffers for the grid lines
//
function initGridBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const lines = [];
  const range = 5; // Grid will extend from -range to +range
  const step = 0.5; // Spacing between lines
  for (let i = -range; i <= range; i += step) {
    // Lines along Z axis
    lines.push(-range, 0, i); // x1, y1, z1
    lines.push(range, 0, i);  // x2, y2, z2
    // Lines along X axis
    lines.push(i, 0, -range); // x1, y1, z1
    lines.push(i, 0, range);  // x2, y2, z2
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    vertexCount: lines.length / 3, // 3 components per vertex (x,y,z)
  };
}

// Global variable for animation timing (already declared, just for context)
// var then = 0;

// Draw the scene repeatedly
function render(now) {
  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  drawScene(deltaTime); // Pass deltaTime to drawScene

  requestAnimationFrame(render);
}

window.onload = main; // Call main to initialize everything
