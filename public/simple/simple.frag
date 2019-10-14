precision highp float;

uniform float u_time;
uniform float u_size;

void main() {
  vec2 pos = gl_FragCoord.xy / u_size;
  gl_FragColor = vec4(1.0 * sin(u_time), pos ,1.0);
}
