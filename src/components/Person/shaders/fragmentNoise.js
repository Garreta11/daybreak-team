import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uNoise;
  uniform float uAmplitude;
  uniform float uOffset;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Fractal Brownian Motion (FBM)
  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  float fbm(vec2 x, int numOctaves) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < numOctaves; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  float blendDarken(float base, float blend) {
    return min(blend, base);
  }

  vec2 blendDarken(vec2 base, vec2 blend) {
    return vec2(blendDarken(base.x, blend.x), blendDarken(base.y, blend.y));
  }

  void main() {

    // Apply FBM for WaterColor Effect
    vec2 aspect = vec2(1., uResolution.y / uResolution.x);
    vec2 disp = uAmplitude * fbm(vUv * uNoise, 4) * aspect * 1.0;

    vec2 st = vUv;
    vec2 st2 = vec2(vUv.x + disp.x, vUv.y);
    vec2 st3 = vec2(vUv.x - disp.x, vUv.y);
    vec2 st4 = vec2(vUv.x, vUv.y + disp.y);
    vec2 st5 = vec2(vUv.x, vUv.y - disp.y);

    vec2 floodcolor = st;
    floodcolor = blendDarken(floodcolor, st2);
    floodcolor = blendDarken(floodcolor, st3);
    floodcolor = blendDarken(floodcolor, st4);
    floodcolor = blendDarken(floodcolor, st5);

    float n = fbm(floodcolor * uNoise + uTime, 4);

    vec2 centeredUv = vUv - vec2(0.5);
    // vec2 offset = centeredUv * n * 0.9;
    vec2 offset = centeredUv * n * 10.;
    offset += vec2(0.5);

    vec2 newUv = mix(st, offset, uOffset);

    vec4 color = texture2D(uTexture, newUv);
    gl_FragColor = color;
  }
`;
export default fragmentShader;
