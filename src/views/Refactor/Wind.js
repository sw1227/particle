import { fetchShaderText } from "../../common/utility"
import { Program, FrameBuffer, Texture } from "../../common/gl_wrapper";


const SHADER_PATH = {
  drawVert: "/windShaders/draw.vert",
  drawFrag: "/windShaders/draw.frag",
  quadVert: "/windShaders/quad.vert",
  screenFrag: "/windShaders/screen.frag",
  updateFrag: "/windShaders/update.frag",
};

const defaultRampColors = {
  0.0: "#3288bd",
  0.1: "#66c2a5",
  0.2: "#abdda4",
  0.3: "#e6f598",
  0.4: "#fee08b",
  0.5: "#fdae61",
  0.6: "#f46d43",
  1.0: "#d53e4f"
};



export default class Wind {
  constructor(gl) {
    this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
    this.speedFactor = 0.25; // how fast the particles move
    this.dropRate = 0.003; // how often the particles move to a random place
    this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
    this.a_pos = [[0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]];

    this.gl = gl;
    this.framebuffer = FrameBuffer(gl);

    this.setColorRamp(defaultRampColors);
    this.resize();

    // Must be created like: const wind = await new Wind(gl);
    return (async () => {
      this.drawProgram = Program(
        gl,
        await fetchShaderText(SHADER_PATH.drawVert),
        await fetchShaderText(SHADER_PATH.drawFrag)
      );
      this.screenProgram = Program(
        gl,
        await fetchShaderText(SHADER_PATH.quadVert),
        await fetchShaderText(SHADER_PATH.screenFrag),
      );
      this.updateProgram = Program(
        gl,
        await fetchShaderText(SHADER_PATH.quadVert),
        await fetchShaderText(SHADER_PATH.updateFrag),
      );
      return this;
    })();
  }


  resize() {
    const gl = this.gl;
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    // screen textures to hold the drawn screen for the previous and the current frame
    this.backgroundTexture = Texture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    this.screenTexture = Texture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
  }


  setColorRamp(colors) {
    // lookup texture for colorizing the particles according to their speed
    this.colorRampTexture = Texture(this.gl, this.gl.LINEAR, getColorRamp(colors), 16, 16);
  }


  set numParticles(numParticles) {
    const gl = this.gl;

    // we create a square texture where each pixel will hold a particle position encoded as RGBA
    const particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
    this._numParticles = particleRes * particleRes;

    const particleState = new Uint8Array(this._numParticles * 4);
    for (let i = 0; i < particleState.length; i++) {
      particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
    }
    // textures to hold the particle state for the current and the next frame
    this.particleStateTexture0 = Texture(gl, gl.NEAREST, particleState, particleRes, particleRes);
    this.particleStateTexture1 = Texture(gl, gl.NEAREST, particleState, particleRes, particleRes);
  }
  get numParticles() {
    return this._numParticles;
  }


  setWind(windData) {
    this.windData = windData;
    this.windTexture = Texture(this.gl, this.gl.LINEAR, windData.image);
  }


  draw() {
    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    this.windTexture.bindToUnit(0);
    this.particleStateTexture0.bindToUnit(1);

    this.drawScreen();
    this.updateParticles();
  }


  drawScreen() {
    const gl = this.gl;
    // draw the screen into a temporary framebuffer to retain it as the background on the next frame
    this.framebuffer.setTexture(this.screenTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.drawTexture(this.backgroundTexture, this.fadeOpacity);
    this.drawParticles();

    this.framebuffer.unset();
    // enable blending to support drawing on top of an existing background (e.g. a map)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawTexture(this.screenTexture, 1.0);
    gl.disable(gl.BLEND);

    // save the current screen as the background for the next frame
    const temp = this.backgroundTexture;
    this.backgroundTexture = this.screenTexture;
    this.screenTexture = temp;
  }


  drawTexture(texture, opacity) {
    const gl = this.gl;
    const program = this.screenProgram;
    gl.useProgram(program.program);

    program.a_pos.set(this.a_pos);
    texture.bindToUnit(2);
    program.u_screen.set(2);
    program.u_opacity.set(opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }


  drawParticles() {
    const gl = this.gl;
    const program = this.drawProgram;
    gl.useProgram(program.program);

    program.a_index.set([...Array(this._numParticles).keys()]);
    this.colorRampTexture.bindToUnit(2);

    program.u_wind.set(0)
    program.u_particles.set(1);
    program.u_color_ramp.set(2);

    program.u_particles_res.set(this.particleStateResolution);
    program.u_wind_min.set(this.windData.uMin, this.windData.vMin);
    program.u_wind_max.set(this.windData.uMax, this.windData.vMax);

    gl.drawArrays(gl.POINTS, 0, this._numParticles);
  }


  updateParticles() {
    const gl = this.gl;
    this.framebuffer.setTexture(this.particleStateTexture1);
    gl.viewport(0, 0, this.particleStateResolution, this.particleStateResolution);

    const program = this.updateProgram;
    gl.useProgram(program.program);

    program.a_pos.set(this.a_pos);

    program.u_wind.set(0);
    program.u_particles.set(1);

    program.u_rand_seed.set(Math.random());
    program.u_wind_res.set(this.windData.width, this.windData.height);
    program.u_wind_min.set(this.windData.uMin, this.windData.vMin);
    program.u_wind_max.set(this.windData.uMax, this.windData.vMax);
    program.u_speed_factor.set(this.speedFactor);
    program.u_drop_rate.set(this.dropRate);
    program.u_drop_rate_bump.set(this.dropRateBump);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // swap the particle state textures so the new one becomes the current one
    const temp = this.particleStateTexture0;
    this.particleStateTexture0 = this.particleStateTexture1;
    this.particleStateTexture1 = temp;
  }
}



function getColorRamp(colors) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 256;
  canvas.height = 1;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}
