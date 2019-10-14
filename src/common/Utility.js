import React, { useEffect } from "react";


// Fetch shader code as string
export async function fetchShaderText(path) {
  const response = await fetch(path);
  const text = await response.text();
  return text;
};


export function useAsyncEffect(asyncFunc, deps) {
  useEffect(() => {
    (async () => {
      asyncFunc();
    })();
  }, deps)
}

export function createShaderProgram(gl, vertText, fragText) {
  // Compile Vertex Shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertText);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    return null;
  }
  // Compile Fragment Shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragText);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    return null;
  }

  // Create Program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return null;
  }
  return program;
}
