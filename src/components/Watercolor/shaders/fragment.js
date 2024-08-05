import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  #define NUM_OCTAVES 5
  uniform float time;
  uniform float uOffset;
  uniform float uOffsetImages;
  uniform float uNoise;

  uniform vec4 resolution;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;

  uniform vec3 colorsArray[5]; // Maximum array size
  uniform int colorsLength;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

  // RGB to HSV
  vec3 rgb2hsv(vec3 c)
  {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  // HSV to RGB
  vec3 hsv2rgb(vec3 c)
  {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

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

  // BLENDING COLORS
  vec3 blendColors(vec3 color, float t) {
    float scaledT = t * float(colorsLength - 1);
    int index = int(scaledT);
    float fraction = scaledT - float(index);
    vec3 color1 = colorsArray[index];
    vec3 color2 = colorsArray[min(index + 1, colorsLength - 1)]; // Ensure index is within bounds
  
    // Linear interpolation between color1 and color2
    return mix(color1, color2, fraction);
  }

  void main() {  
    vec2 st = vUv;
    // Apply FBM
    float n = fbm(st * uNoise + time);

    // Get the texture color of both iamges
    vec4 color = texture2D(uTexture1, mix(st, st + n * 0.1, uOffset));
    vec4 color2 = texture2D(uTexture2, mix(st, st + n * 0.1, uOffset));
    
    // Watercolor effect
    color.rgb *= vec3(1.0 - n * 0.5  * uOffset);
    color2.rgb *= vec3(1.0 - n * 0.5 * uOffset);

    vec3 hsv = rgb2hsv(color.rgb);
    vec3 hsv2 = rgb2hsv(color2.rgb);

    vec3 blendColor1 = blendColors(color.rgb, hsv.r);
    vec3 blendColor2 = blendColors(color2.rgb, hsv2.r);

    vec4 finalColor = mix(vec4(hsv, color.a), vec4(hsv2, color2.a), uOffsetImages);

    gl_FragColor = finalColor;
  }
`;
export default fragmentShader;
