import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  #define NUM_OCTAVES 5
  uniform float time;
  uniform float uOffset;
  uniform float uOffsetImages;
  uniform int uKuwahara;
  uniform float uNoise;
  uniform float uBlurAmount;

  uniform vec4 resolution;
  uniform vec2 uMouse;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform sampler2D tWater;

  uniform sampler2D uDataTexture;

  uniform vec2 uDirection;

  uniform vec4 colorsArray[5]; // Maximum array size
  uniform int colorsLength;
  
  uniform vec4 colorsArray2[5]; // Maximum array size
  uniform int colorsLength2;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

  //	Classic Perlin 2D Noise 
  //	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
  //
  vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

  float cnoise(vec2 P){
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * 
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

  void main() {

    // Calculate mouse distance from the current fragment
    vec2 mouseNormalized = uMouse / resolution.xy; // Normalized mouse position [0,1]
    vec2 centeredMouse = mouseNormalized * 2.0 - 1.0; // Mouse [-1,1]
    centeredMouse.y = -centeredMouse.y; // Flip y for correct coordinates

    // Calculate the distance from the current fragment's UV to the mouse position
    float dist = distance(centeredMouse, vUv * 2.0 - 1.0);

    // Set the strength of the blending based on proximity to the mouse
    float blendStrength = smoothstep(0.3, 0.0, dist); // Blending falls off with distance
    float offsetAmount = 0.03 * blendStrength;

    vec4 originalColor = texture2D(uTexture1, vUv);

    // Center the UV coordinates around (0.5, 0.5), scale them, then move back
    float scaleFactor = 0.9;
    vec2 newUv = vUv + 0.01 * cnoise(10. * vUv + time) - 0.5;
    vec2 scaledUV = newUv * sin(scaleFactor + cnoise(1. * newUv + time * 0.1)) + 0.5;

    vec4 blendedColor = texture2D(uTexture1, scaledUV);
    blendedColor += texture2D(uTexture1, scaledUV + vec2(offsetAmount, offsetAmount));
    blendedColor += texture2D(uTexture1, scaledUV + vec2(-offsetAmount, -offsetAmount));
    blendedColor += texture2D(uTexture1, scaledUV + vec2(offsetAmount, -offsetAmount));
    blendedColor += texture2D(uTexture1, scaledUV + vec2(-offsetAmount, offsetAmount));
    blendedColor += texture2D(uTexture1, scaledUV);

    blendedColor /= 6.;

    // Mix original and blended colors based on the blendStrength
    vec4 finalColor = mix(originalColor, blendedColor, blendStrength);

    gl_FragColor = vec4(finalColor.rgb, originalColor.a);
  }
`;
export default fragmentShader;
