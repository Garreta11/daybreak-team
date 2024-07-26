import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  uniform float time;
  uniform float uOffset;

  uniform vec4 resolution;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform sampler2D uDisplacementTexture;

  uniform float uDuration;

  // Uniforms for colors array and its length
  uniform vec3 colors[10]; // Maximum array size
  uniform int colorsLength;

  varying vec2 vUv;
  varying vec3 vPosition;

  varying vec2 vUvMap1;
  varying vec2 vUvMap2;

  float PI = 3.141592653589793238;

  const float displacementCoef = 0.5;

  vec3 blendColors(vec3 color, float t) {
    float scaledT = t * float(colorsLength - 1);
    int index = int(scaledT);
    float fraction = scaledT - float(index);
    vec3 color1 = colors[index];
    vec3 color2 = colors[min(index + 1, colorsLength - 1)]; // Ensure index is within bounds
  
    // Linear interpolation between color1 and color2
    return mix(color1, color2, fraction);
  }

  void main() {  

    /* vec4 texture1 = texture2D(uTexture1, vUvMap1);
    vec4 texture2 = texture2D(uTexture2, vUvMap2); */
    vec4 displacementTexture = texture2D(uDisplacementTexture, vUv);

    // get displacement force based of one color canal of the image, then use uProgress
    float displaceForce1 = displacementTexture.g * uOffset * displacementCoef;
    vec2 uvDisplacement1 = vec2(vUvMap1.x + displaceForce1, vUvMap1.y);
    vec4 displacedTexture1 = texture2D(uTexture1, uvDisplacement1);
    float gray1 = dot(displacedTexture1.rgb, vec3(0.299, 0.587, 0.114));
    vec4 blendedColor1 = vec4(blendColors(displacedTexture1.rgb, gray1), displacedTexture1.a);

    // get displacement texture of image 2
    float displaceForce2 = displacementTexture.r * (1.0 - uOffset) * displacementCoef;
    vec2 uvDisplacement2 = vec2(vUvMap2.x + displaceForce2, vUvMap2.y);
    vec4 displacedTexture2 = texture2D(uTexture2, uvDisplacement2);
    float gray2 = dot(displacedTexture2.rgb, vec3(0.299, 0.587, 0.114));
    vec4 blendedColor2 = vec4(blendColors(displacedTexture2.rgb, gray2), displacedTexture2.a);

    gl_FragColor = mix(blendedColor1, blendedColor2, uOffset);

  }
`;
export default fragmentShader;
