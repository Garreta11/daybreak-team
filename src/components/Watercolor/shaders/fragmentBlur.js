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
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;

  uniform vec2 uDirection;

  uniform vec3 colorsArray[5]; // Maximum array size
  uniform int colorsLength;
  
  uniform vec3 colorsArray2[5]; // Maximum array size
  uniform int colorsLength2;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

  void main() {  
    vec2 st = vUv;

    vec2 texelSize = 1.0 / resolution.xy;
    vec4 finalColor = vec4(0.0);
    
    vec2 direction = uDirection * uBlurAmount;
    
    finalColor += texture2D(uTexture1, st + direction * texelSize * -4.0) * 0.05;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -3.0) * 0.09;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -2.0) * 0.12;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -1.0) * 0.15;
    finalColor += texture2D(uTexture1, st) * 0.16;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 1.0) * 0.15;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 2.0) * 0.12;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 3.0) * 0.09;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 4.0) * 0.05;

    gl_FragColor = finalColor;
  }
`;
export default fragmentShader;
