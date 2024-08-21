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

  uniform sampler2D uDataTexture;

  uniform vec2 uDirection;

  uniform vec4 colorsArray[5]; // Maximum array size
  uniform int colorsLength;
  
  uniform vec4 colorsArray2[5]; // Maximum array size
  uniform int colorsLength2;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

  float sdf(vec2 uv) {
    float alpha = texture2D(uTexture1, uv).a;
    float dist = 1.0;
    return alpha > 0.5 ? dist : -dist;
  }

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }
  float stroke(float x, float size, float w, float edge) {
      float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
      return clamp(d, 0.0, 1.0);
  }
  float fill(float x, float size, float edge) {
      return 1.0 - smoothstep(size - edge, size + edge, x);
  }
  float sdCircle(vec2 st, vec2 center) {
    return length(st - center);
  }

  void main() {
    vec2 st = vUv;
    vec2 pixel = 1.0 / resolution.xy * 1.0;
    vec2 posMouse = vec2(1., 1.) - uMouse * pixel;

    float circleSize = 0.1;
    float circleEdge = 0.1;
    float sdfCircle = fill(
        sdCircle(st, posMouse),
        circleSize,
        circleEdge
    );
    
    float size = 0.01;
    float roundness = 0.3;
    float borderSize = 2.0;
    
    float sdfImage;
    // sdf = sdRoundRect(st, vec2(size), roundness);
    sdfImage = sdf(st);
    //sdfImage = sdCircle(vUv, vec2(0.5, 0.5));
    sdfImage = stroke(sdfImage, 0.0, borderSize, sdfCircle);

    gl_FragColor = vec4(vec3(sdfImage), sdfImage);
  }
`;
export default fragmentShader;
