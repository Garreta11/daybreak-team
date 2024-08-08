import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  #define NUM_OCTAVES 5
  uniform float time;
  uniform float uOffset;
  uniform float uOffsetImages;
  uniform int uKuwahara;
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

  vec4 kuwaharaFilter(sampler2D tex, vec2 st, vec2 pixel, int radius) {
    float n = float((radius + 1) * (radius + 1));
    int i; int j;

    vec4 m0 = vec4(0.0);
    vec4 m1 = vec4(0.0);
    vec4 m2 = vec4(0.0);
    vec4 m3 = vec4(0.0);

    vec4 s0 = vec4(0.0);
    vec4 s1 = vec4(0.0);
    vec4 s2 = vec4(0.0);
    vec4 s3 = vec4(0.0);

    vec4 rta = vec4(0.0);
    vec4 c = vec4(0.0);
    
    for (j = -radius; j <= 0; ++j)  { 
      for (i = -radius; i <= 0; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m0 += c;
          s0 += c * c;
      }
    }

    for (j = -radius; j <= 0; ++j)  {
      for (i = 0; i <= radius; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m1 += c;
          s1 += c * c;
      }
    }

    for (j = 0; j <= radius; ++j)  {
      for (i = 0; i <= radius; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m2 += c;
          s2 += c * c;
      }
    }
  
    for (j = 0; j <= radius; ++j)  {
        for (i = -radius; i <= 0; ++i)  {
            c = texture2D(tex, st + vec2(i,j) * pixel);
            m3 += c;
            s3 += c * c;
        }
    }

    float min_sigma2 = 1e+2;
    m0 /= n;
    s0 = abs(s0 / n - m0 * m0);

    float sigma2 = s0.r + s0.g + s0.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m0;
    }

    m1 /= n;
    s1 = abs(s1 / n - m1 * m1);
    
    sigma2 = s1.r + s1.g + s1.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m1;
    }
    
    m2 /= n;
    s2 = abs(s2 / n - m2 * m2);
    
    sigma2 = s2.r + s2.g + s2.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m2;
    }
    
    m3 /= n;
    s3 = abs(s3 / n - m3 * m3);
    
    sigma2 = s3.r + s3.g + s3.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m3;
    }

    return rta;
  }

  void main() {  
    vec2 st = vUv;
    // Apply FBM for WaterColor Effect
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);

    float n = fbm(st * uNoise + r + time);

    
    // Center the coordinates around (0.5, 0.5) and apply FBM (n)
    vec2 centeredUv = vUv - vec2(0.5);
    vec2 offset = centeredUv * (n * 0.3 + 1.0);
    offset += vec2(0.5);
    
    // Apply Kuwahara filter
    vec2 pixel = vec2(2.0) / resolution.xy;
    vec4 color = kuwaharaFilter(uTexture1, mix(st, offset, uOffset), pixel, uKuwahara);
    vec4 color2 = kuwaharaFilter(uTexture2, mix(st, offset, uOffset), pixel, uKuwahara);

    // Blend Colors
    float gray1 = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    float gray2 = dot(color2.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 blendColor1 = blendColors(color.rgb, gray1);
    vec3 blendColor2 = blendColors(color2.rgb, gray2);

    // vec4 finalColor = mix(vec4(blendColor1, color.a), vec4(blendColor2, color2.a), uOffsetImages);
    vec4 finalColor = mix(vec4(color), vec4(color2), uOffsetImages);
    gl_FragColor = finalColor;
  }
`;
export default fragmentShader;
