// Global state
import { initWebGL } from './webgl-setup.js';
import { initShaderProgram } from './shader-utils.js';
import { spoonModelData } from './spoon-model.js';
import { createGridVertices } from './grid-model.js';
import { initRenderer, render as importedRender } from './renderer.js';

let gl = null;
let programInfo = null;
let buffers = null;
let gridProgramInfo = null; // For the grid
let gridBuffers = null;     // For the grid

// Basic WebGL setup
function main() {
  console.log("main: Starting WebGL initialization.");
  gl = initWebGL(); // Assign to global gl

  if (gl === null) {
    // initWebGL will show an alert, so just log and return here.
    console.error("main: Failed to initialize WebGL. Aborting.");
    return;
  }
  // NOTE: WebGL rendering may fail in some environments (e.g., certain headless browsers or
  // systems with restricted GPU access) due to issues like 'Failed to send GpuControl.CreateCommandBuffer'.
  // If the canvas remains blank but console logs indicate the application logic is running,
  // this might be an environmental limitation rather than an error in this script.
  // The following code assumes a working WebGL context.
  console.log("main: WebGL context gl:", gl);

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
  console.log("main: programInfo initialized:", programInfo);

  // Initialize buffers.
  buffers = initBuffers(gl); // Assign to global buffers
  console.log("main: buffers initialized:", buffers);

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
  console.log("main: gridProgramInfo initialized:", gridProgramInfo);
  gridBuffers = initGridBuffers(gl);
  console.log("main: gridBuffers initialized:", gridBuffers);
  // --- End Grid Setup ---

  // Initialize the renderer module with shared state
  const rendererContext = {
    gl,
    programInfo,
    buffers,
    gridProgramInfo,
    gridBuffers,
    spoonRotation: 0.0, // Initial value
    then: 0,            // Initial value
    frameCount: 0,      // Initial value
    successSignaled: false // Initial value
  };
  initRenderer(rendererContext);

  // Start the animation loop using the imported render function
  requestAnimationFrame(importedRender);
  console.log("main: WebGL initialization complete.");
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional spoon.
//
function initBuffers(gl) {
  console.log("initBuffers: Initializing spoon buffers.");

  // Create a buffer for the spoon's positions.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spoonModelData.positions), gl.STATIC_DRAW);

  // Now set up the normals for the vertices.
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spoonModelData.normals), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(spoonModelData.indices), gl.STATIC_DRAW);

  const buffers = {
    position: positionBuffer,
    normal: normalBuffer,
    indices: indexBuffer,
  };
  console.log("initBuffers: Spoon buffers initialized:", buffers);
  return buffers;
}


//
// Initialize buffers for the grid lines
//
function initGridBuffers(gl) {
  console.log("initGridBuffers: Initializing grid buffers.");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const gridData = createGridVertices();

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData.lines), gl.STATIC_DRAW);

  const gridBuffers = {
    position: positionBuffer,
    vertexCount: gridData.vertexCount,
  };
  console.log("initGridBuffers: Grid buffers initialized:", gridBuffers);
  return gridBuffers;
}

window.onload = main; // Call main to initialize everything
