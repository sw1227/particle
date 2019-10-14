import React, { useEffect, useState, useRef } from "react";
import {
  useAsyncEffect,
  createShaderProgram,
  fetchShaderText,
} from "../common/Utility";

const SHADER_PATH = {
  frag: "/simple/simple.frag",
  vert: "/simple/simple.vert"
};


const SimpleWebGL = () => {

  // Initial draw
  useAsyncEffect(async () => {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) alert("Unable to initialize WebGL.");

    canvas.width = 400;
    canvas.height = 400;

    // Fetch shaders and create program
    const vertexText = await fetchShaderText(SHADER_PATH.vert);
    const fragmentText = await fetchShaderText(SHADER_PATH.frag);
    const program = createShaderProgram(
      gl,
      vertexText,
      fragmentText
    );

    if (!program) {
      alert("Shader compile error");
    } else {
      animateShader(gl, program);
    }

  }, []);


  const animateShader = (gl, program) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);

    // Buffer vertex data
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.of(-1, -1, +1, -1, +1, +1, -1, +1), gl.STATIC_DRAW);
    // Use vertex attribute
    const a_vertex = gl.getAttribLocation(program, "a_vertex")
    gl.enableVertexAttribArray(a_vertex);
    gl.vertexAttribPointer(a_vertex, 2, gl.FLOAT, false, 0, 0);


    // Size (uniform)
    const u_size = gl.getUniformLocation(program, "u_size")
    gl.uniform1f(u_size, Math.max(gl.canvas.width, gl.canvas.height));

    // Animate by providing current time
    const u_time = gl.getUniformLocation(program, "u_time");
    const loop = () => {
      const frame = requestAnimationFrame(loop);
      const t = performance.now() / 1000;

      gl.uniform1f(u_time, t);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
    loop();
  };


  return (
    <div style={{textAlign: "center", background: "black"}}>
      <canvas id="glcanvas" style={{ height: "100vh" }} />
    </div>
  );
}

export default SimpleWebGL;