import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uMouse;

  uniform float uPullRadius; // Adjust this value to control the pull radius
  uniform float uPullStrengthCenter; // Adjust this value to control the pull strength at the center
  uniform float uPullStrengthEdge; // Adjust this value to control the pull strength at the edges
  uniform float uImageScale; // Adjust this value to control the image scale
  
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {

    vec2 mousePos = uMouse / uResolution;
    mousePos.y = 1.0 - mousePos.y;

    vec2 fragCoord = gl_FragCoord.xy / uResolution;
    vec2 scaledFragCoord = (fragCoord - 0.5) / uImageScale + 0.5;
    
    vec2 distanceToMouse = scaledFragCoord - mousePos;
    float distanceFactor = smoothstep(0.0, uPullRadius, length(distanceToMouse));

    float distanceToCenter = length(scaledFragCoord - vec2(0.5));
    float pullStrengthFactor = mix(uPullStrengthCenter, uPullStrengthEdge, distanceToCenter);

    vec2 pullDirection = normalize(distanceToMouse);
    vec2 pulledUv = scaledFragCoord + pullDirection * distanceFactor * pullStrengthFactor;

    vec4 color = texture2D(uTexture, pulledUv);
    gl_FragColor = color;
  }
`;
export default fragmentShader;
