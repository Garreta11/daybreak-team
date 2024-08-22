import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {

    vec4 color = texture2D(uTexture, vUv);
    color = vec4(vUv, 0.0, 1.0);
    gl_FragColor = color;
  }
`;
export default fragmentShader;
