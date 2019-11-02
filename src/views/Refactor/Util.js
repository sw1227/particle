import { useEffect } from "react";


export function useAsyncEffect(asyncFunc, deps) {
  useEffect(() => {
    (async () => {
      asyncFunc();
    })();
  }, deps)
}


// Fetch shader code as string
export async function fetchShaderText(path) {
  const response = await fetch(path);
  const text = await response.text();
  return text;
}



export function Texture(gl, filter, data, width, height) {
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  if (data instanceof Uint8Array) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    // Specify which texture-unit to be used for this texture
    bindToUnit: unit => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    },
    texture: texture,
  };
}


export function FrameBuffer(gl) {
  const framebuffer = gl.createFramebuffer();

  return {
    // Attach texture to this framebuffer
    setTexture: texture => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0);
    },
    unset: () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
  };
}


export function Program(gl, vertexSource, fragmentSource) {
  const program = createShaderProgram(gl, vertexSource, fragmentSource);

  const wrapper = { gl: gl, program: program };

  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < numUniforms; i++) {
    const uniform = gl.getActiveUniform(program, i);
    wrapper[uniform.name] = Uniform(gl, program, uniform.name, uniform.type);
  }

  const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numAttributes; i++) {
    const attribute = gl.getActiveAttrib(program, i);
    wrapper[attribute.name] = Attribute(gl, program, attribute.name, attribute.type);
  }

  return wrapper;
}


function createShaderProgram(gl, vertText, fragText) {
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


function Uniform(gl, program, name, type) {
  const location = gl.getUniformLocation(program, name);
  let current;

  return {
    // Write value(s) to the uniform
    set: (...value) => {
      current = value;
      switch(type) {
        case gl.FLOAT:
          gl.uniform1f(location, ...value);
          break;
        case gl.FLOAT_VEC2:
          gl.uniform2f(location, ...value);
          break;
        case gl.INT:
          // Do not break
        case gl.SAMPLER_2D:
          gl.uniform1i(location, ...value);
          break;
        default:
          console.log("Unknown type: ", type);
      }
    },
    // Get current value set to the uniform
    current: () => current,
  }
}


function Attribute(gl, program, name, type) {
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, name);
  let current;

  return {
    // Write value to the buffer and attach buffer to the location
    set: value => {
      // Value: length = # vertex, [0].length = # elements per vertex
      //  -> e.g. [[-1, 1], [1, -1], [1, 1], [-1, 1]]
      current = value;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // Bind to the buffer for this attribute

      // Supporting only gl.FLOAT, gl.FLOAT_VEC2
      gl.bufferData(gl.ARRAY_BUFFER, Float32Array.of(...value.flat()), gl.STATIC_DRAW);
      const size = { // size: # elements per vertex
        [gl.FLOAT]: 1,
        [gl.FLOAT_VEC2]: 2,
      }[type];
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    },
    // Get current value set to the buffer
    current: () => current,
  };
}
