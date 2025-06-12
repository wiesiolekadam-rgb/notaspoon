//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  console.log("initShaderProgram: Initializing shader program.");
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  console.log("initShaderProgram: Shader program created:", shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('initShaderProgram: Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  console.log("initShaderProgram: Shader program initialization complete.");
  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  console.log(`loadShader: Loading shader type: ${type}`);
  const shader = gl.createShader(type);
  console.log(`loadShader: Shader object created for type: ${type}`, shader);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`loadShader: An error occurred compiling the shader type ${type}: ${gl.getShaderInfoLog(shader)}`);
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  console.log(`loadShader: Shader type ${type} compilation complete.`);
  return shader;
}

export { initShaderProgram, loadShader };
