function initWebGL() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return null;
  }

  gl.clearColor(0.133, 0.133, 0.133, 1.0); // #222222
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  return gl;
}

export { initWebGL };
