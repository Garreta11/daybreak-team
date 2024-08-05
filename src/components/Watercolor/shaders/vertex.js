import glsl from 'glslify';

// src/shaders/vertex.js
const vertexShader = glsl`
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform vec2 pixels;
  float PI = 3.141592653589793238;


  void main() {
    vUv = uv;
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export default vertexShader;
