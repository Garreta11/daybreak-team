import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  #define NUM_OCTAVES 4

  uniform sampler2D tDiffuse;
  uniform sampler2D tPrev;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);
  
    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
  }
  
  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for(int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  float blendDarken(float base, float blend) {
    return min(blend, base);
  }
  
  vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r), blendDarken(base.g, blend.g), blendDarken(base.b, blend.b));
  }
  
  vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
    return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
  }


  vec3 bgColor = vec3(1.);
  void main() {

    vec4 color = texture2D(tDiffuse, vUv);
    vec4 prev = texture2D(tPrev, vUv);

    vec2 aspect = vec2(1., uResolution.y / uResolution.x);
    vec2 disp = fbm(vUv * 22.0) * aspect * 0.05;

    // Displacement Image  -- also used in fluid simulation
    vec4 texel = texture2D(tPrev, vUv);
    vec4 texel2 = texture2D(tPrev, vec2(vUv.x + disp.x, vUv.y));
    vec4 texel3 = texture2D(tPrev, vec2(vUv.x - disp.x, vUv.y));
    vec4 texel4 = texture2D(tPrev, vec2(vUv.x, vUv.y + disp.x));
    vec4 texel5 = texture2D(tPrev, vec2(vUv.x, vUv.y - disp.x));

    vec3 floodcolor = texel.rgb;
    floodcolor = blendDarken(floodcolor, texel2.rgb);
    floodcolor = blendDarken(floodcolor, texel3.rgb);
    floodcolor = blendDarken(floodcolor, texel4.rgb);
    floodcolor = blendDarken(floodcolor, texel5.rgb);

    vec3 waterColor = blendDarken(prev.rgb, floodcolor * (1. + 0.09), 0.1);


    // gl_FragColor = vec4(waterColor, 1.0);
    gl_FragColor = vec4(color.rgb + waterColor, 1.0);
  }
`;
export default fragmentShader;
