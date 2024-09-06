import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  precision mediump float;

  uniform sampler2D uPrevTexture;
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec4 prevColor = texture2D(uPrevTexture, vUv);
    vec4 color = texture2D(uTexture, vUv);
    
    // Blend with decreasing opacity
    gl_FragColor = mix(color, prevColor, uOpacity);

    // gl_FragColor = color + prevColor * uOpacity;
  }
`;
export default fragmentShader;
