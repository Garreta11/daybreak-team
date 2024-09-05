import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec3 uColorsArray[5]; // Maximum array size
uniform int uColorsLength;

varying vec2 vUv;

vec3 blendColors(vec4 color, float t) {
  float scaledT = t * float(uColorsLength - 1);
  int index = int(scaledT);
  float fraction = scaledT - float(index);
  vec3 color1 = uColorsArray[index];
  vec3 color2 = uColorsArray[min(index + 1, uColorsLength - 1)]; // Ensure index is within bounds

  // Linear interpolation between color1 and color2
  return mix(color1, color2, fraction);
}

void main() {
    vec4 color = texture2D(uTexture, vUv);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    vec3 fc = blendColors(color, gray);
    gl_FragColor = vec4(fc, color.a);
}
`;
export default fragmentShader;
