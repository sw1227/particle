import React from "react";
import { useAsyncEffect, fetchShaderText } from "../common/utility";
import { Program } from "../common/gl_wrapper";

const SHADER_PATH = {
  frag: "/simple/simple.frag",
  vert: "/simple/simple.vert"
};


const SimpleWebGL = () => {

  // Initial draw
  useAsyncEffect(async () => {
    const canvas = document.querySelector("#glcanvas");
    canvas.width = 400;
    canvas.height = 400;

    const gl = canvas.getContext("webgl");
    if (!gl) alert("Unable to initialize WebGL.");

    // Fetch shaders and create program
    const program = Program(
      gl,
      await fetchShaderText(SHADER_PATH.vert),
      await fetchShaderText(SHADER_PATH.frag)
    );

    animateShader(gl, program);

  }, []);


  const animateShader = (gl, program) => {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program.program);

    // Buffer vertex data
    program.a_vertex.set([[-1, -1], [+1, -1], [+1, +1], [-1, +1]]);

    // Size (uniform)
    program.u_size.set(Math.max(gl.canvas.width, gl.canvas.height));

    // Animate by providing current time
    const loop = () => {
      requestAnimationFrame(loop);
      const t = performance.now() / 1000;

      program.u_time.set(t);
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