import glsl from 'glslify';

// src/shaders/vertex.js
const vertexShader = glsl`
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform vec2 pixels;
  float PI = 3.141592653589793238;


  uniform vec2 uvRepeat1;
  uniform vec2 uvOffset1;
  varying vec2 vUvMap1;
  
  uniform vec2 uvRepeat2;
  uniform vec2 uvOffset2;
  varying vec2 vUvMap2;


  void main() {
    vUv = uv;
    vPosition = position;

    vUvMap1 = uv;
    // Get the background:cover effect
    vUvMap1 *= uvRepeat1;
    vUvMap1 += uvOffset1;
    
    vUvMap2 = uv;
    // Get the background:cover effect
    vUvMap2 *= uvRepeat2;
    vUvMap2 += uvOffset2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export default vertexShader;
