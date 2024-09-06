import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  precision mediump float;

  uniform sampler2D uPrevTexture;
  uniform sampler2D uTexture;
  uniform float uDisplacement;
  uniform float uOpacity;
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
  
  vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r), blendDarken(base.g, blend.g), blendDarken(base.b, blend.b));
  }
  
  vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
    return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
  }

  vec4 blendDarken(vec4 base, vec4 blend) {
    return vec4(
      blendDarken(base.r, blend.r),
      blendDarken(base.g, blend.g),
      blendDarken(base.b, blend.b),
      blendDarken(base.a, blend.a) // Blend the alpha channel
    );
  }
  
  vec4 blendDarken(vec4 base, vec4 blend, float opacity) {
    vec4 blendedColor = blendDarken(base, blend);
    return vec4(
      blendedColor.rgb * opacity + base.rgb * (1.0 - opacity), 
      blendedColor.a * opacity + base.a * (1.0 - opacity) // Handle alpha blending
    );
  }

  vec3 bgColor = vec3(1., 1., 1.);

  void main() {

    vec4 prevColor = texture2D(uPrevTexture, vUv);
    vec4 color = texture2D(uTexture, vUv);

    vec2 aspect = vec2(1., uResolution.y / uResolution.x);
    vec2 disp = fbm(vUv * uDisplacement, 4) * aspect * uOpacity;

    vec4 texel = texture2D(uPrevTexture, vUv);
    vec4 texel2 = texture2D(uPrevTexture, vec2(vUv.x + disp.x, vUv.y));
    vec4 texel3 = texture2D(uPrevTexture, vec2(vUv.x - disp.x, vUv.y));
    vec4 texel4 = texture2D(uPrevTexture, vec2(vUv.x, vUv.y + disp.y));
    vec4 texel5 = texture2D(uPrevTexture, vec2(vUv.x, vUv.y - disp.y));

    vec4 floodcolor = texel;
    floodcolor = blendDarken(floodcolor, texel2);
    floodcolor = blendDarken(floodcolor, texel3);
    floodcolor = blendDarken(floodcolor, texel4);
    floodcolor = blendDarken(floodcolor, texel5);

    // vec4 waterColor = blendDarken(prevColor, floodcolor*(1. + 0.02), uOpacity);

    // gl_FragColor = vec4(waterColor, 1.);
    
    // gl_FragColor = mix(color, waterColor, uOpacity);
    gl_FragColor = max(color, floodcolor);
  }
`;
export default fragmentShader;
