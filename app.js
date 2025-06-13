// Global state
import { initWebGL } from './webgl-setup.js';
import { initShaderProgram } from './shader-utils.js';
import { spoonModelData } from './spoon-model.js';
import { createGridVertices } from './grid-model.js';
import { initRenderer, render as importedRender, adjustCameraPitch, adjustCameraYaw, updateCameraZoom, updateViewport } from './renderer.js';

let gl = null;
let programInfo = null;
let buffers = null;
let gridProgramInfo = null; // For the grid
let gridBuffers = null;     // For the grid

// Basic WebGL setup
function main() {
  console.log("main: Starting WebGL initialization.");
  gl = initWebGL(); // Assign to global gl
  console.log('WebGL context initialized:', gl);

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
  // console.log("main: WebGL context gl:", gl); // Original log, replaced by the one above

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    uniform vec3 uViewPosition; // Added for specular

    varying highp vec3 vLighting;
    varying highp vec3 vNormal;         // Added for specular
    varying highp vec3 vViewDirection;  // Added for specular
    varying highp vec3 vFragPosition;   // Added for specular

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

      // Vertex position in view space
      vec4 viewPosition = uModelViewMatrix * aVertexPosition;
      vFragPosition = viewPosition.xyz; // No perspective divide needed for position itself

      // Transform normal to view space
      vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);

      // View direction (camera is at 0,0,0 in view space)
      vViewDirection = normalize(uViewPosition - vFragPosition);

      // Diffuse lighting calculation (existing)
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      // Use the transformed normal (vNormal) for diffuse calculation
      highp float directional = max(dot(vNormal, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program
  const fsSource = `precision mediump float;
    varying highp vec3 vLighting;       // Diffuse + Ambient from VS
    varying highp vec3 vNormal;         // Normal in view space
    varying highp vec3 vViewDirection;  // View direction in view space
    // vFragPosition is available but not directly used if vViewDirection is pre-calculated

    uniform vec3 uSpecularColor;
    uniform float uShininess;
    // uniform samplerCube uSampler; // For environment mapping, if we add it later (commented out if not used)

    void main(void) {
      highp vec3 spoonBaseColor = vec3(0.75, 0.75, 0.75); // Silver-like color

      // Light properties (should match VS or be uniforms)
      highp vec3 lightDirection = normalize(vec3(0.85, 0.8, 0.75)); // Same as in VS
      highp vec3 lightColor = vec3(1.0, 1.0, 1.0);

      // Normalize interpolated vectors
      highp vec3 normal = normalize(vNormal);
      highp vec3 viewDir = normalize(vViewDirection);

      // Blinn-Phong Specular calculation
      highp vec3 halfwayDir = normalize(lightDirection + viewDir);
      highp float specAngle = max(dot(normal, halfwayDir), 0.0);
      highp float specularIntensity = pow(specAngle, uShininess);
      highp vec3 specular = uSpecularColor * specularIntensity * lightColor;

      // Combine: (Ambient + Diffuse) * BaseColor + Specular
      // vLighting already contains Ambient + Diffuse component from VS
      gl_FragColor = vec4(spoonBaseColor * vLighting + specular, 1.0);
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
      // New uniforms for specular lighting
      uViewPosition: gl.getUniformLocation(shaderProgram, 'uViewPosition'),
      uSpecularColor: gl.getUniformLocation(shaderProgram, 'uSpecularColor'),
      uShininess: gl.getUniformLocation(shaderProgram, 'uShininess'),
    },
  };
  // console.log("main: programInfo initialized:", programInfo); // Original log, replaced by the one below
  console.log('Spoon shader programInfo:', JSON.stringify(programInfo, null, 2));

  // Initialize buffers.
  buffers = initBuffers(gl); // Assign to global buffers
  // console.log("main: buffers initialized:", buffers); // Original log, replaced by the one below
  console.log('Spoon buffers:', buffers);

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
  // console.log("main: gridProgramInfo initialized:", gridProgramInfo); // Original log, replaced by the one below
  console.log('Grid shader programInfo:', JSON.stringify(gridProgramInfo, null, 2));
  gridBuffers = initGridBuffers(gl);
  // console.log("main: gridBuffers initialized:", gridBuffers); // Original log, replaced by the one below
  console.log('Grid buffers:', gridBuffers);
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

  // Set initial viewport
  updateViewport();

  // Start the animation loop using the imported render function
  requestAnimationFrame(importedRender);
  console.log("main: WebGL initialization complete.");

  // Add mouse event listeners for camera control
  const canvas = gl.canvas;
  let isMouseDown = false;
  // Store last mouse position to calculate delta manually if movementX/Y is not preferred
  // let lastMouseX = -1;
  // let lastMouseY = -1;

  const MOUSE_SENSITIVITY_YAW = 0.005; // Adjust as needed
  const MOUSE_SENSITIVITY_PITCH = 0.005; // Adjust as needed
  const WHEEL_SENSITIVITY_ZOOM = 0.05; // Adjust as needed

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button
      isMouseDown = true;
      // lastMouseX = event.clientX;
      // lastMouseY = event.clientY;
    }
  });

  canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0) { // Left mouse button
      isMouseDown = false;
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
      // Using movementX/Y is simpler as it provides the delta directly
      const deltaYaw = event.movementX * MOUSE_SENSITIVITY_YAW;
      const deltaPitch = event.movementY * MOUSE_SENSITIVITY_PITCH;

      adjustCameraYaw(deltaYaw);
      adjustCameraPitch(deltaPitch);

      // If not using movementX/Y:
      // if (lastMouseX !== -1) {
      //   const deltaX = event.clientX - lastMouseX;
      //   const deltaY = event.clientY - lastMouseY;
      //   adjustCameraYaw(deltaX * MOUSE_SENSITIVITY_YAW);
      //   adjustCameraPitch(deltaY * MOUSE_SENSITIVITY_PITCH);
      // }
      // lastMouseX = event.clientX;
      // lastMouseY = event.clientY;
    }
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent default page scrolling
    const deltaZoom = event.deltaY * WHEEL_SENSITIVITY_ZOOM;
    updateCameraZoom(deltaZoom);
  });

  // Prevent context menu on right-click, if desired
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // Add window resize listener
  window.addEventListener('resize', handleResize);
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

//
// Handle window resize events
//
function handleResize() {
  if (!gl || !gl.canvas) {
    console.warn("handleResize: gl or gl.canvas not available yet.");
    return;
  }
  console.log("handleResize called");
  gl.canvas.width = gl.canvas.clientWidth;
  gl.canvas.height = gl.canvas.clientHeight;
  console.log(`Canvas resized to: ${gl.canvas.width}x${gl.canvas.height}`);
  updateViewport(); // Update viewport after resizing canvas
}

window.onload = main; // Call main to initialize everything
