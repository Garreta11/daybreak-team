import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  #define NUM_OCTAVES 5

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uNoise;
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

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {

    // Apply FBM for WaterColor Effect
    vec2 st = vUv;
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*uTime);
    q.y = fbm( st + vec2(1.0));
    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);
    float n = fbm(st * uNoise + r + uTime);

    vec2 centeredUv = vUv - vec2(0.5);
    vec2 offset = centeredUv * (n * 0.3 + 1.0);
    offset += vec2(0.5);

    vec2 newUv = mix(st, offset, uOffset);

    vec4 color = texture2D(uTexture, newUv);
    gl_FragColor = color;
  }
`;
export default fragmentShader;
