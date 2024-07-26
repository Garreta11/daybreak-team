import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  uniform float time;

  uniform vec4 resolution;
  uniform sampler2D uTexture;

 // Uniforms for colors array and its length
  uniform vec3 colors[10]; // Maximum array size
  uniform int colorsLength;

  uniform float uDuration;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

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

    vec2 p = vPosition.xy;
    float len = length(p);
    vec2 ripple = vUv + p / len * 0.01 * cos(len * 12.0 - time * 4.0);
    float delta = (sin(mod(time, uDuration) * (2.0 * PI / uDuration) + 1.0) / 2.0);

    vec2 uv = mix(ripple, vUv, delta);
    vec4 textureColor = texture2D(uTexture, vUv);

    float gray = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 blendedColor = blendColors(textureColor.rgb, gray);


    gl_FragColor = vec4(blendedColor, textureColor.a);

  }
`;
export default fragmentShader;
