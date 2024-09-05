import glsl from 'glslify';

// src/shaders/fragment.js
const fragmentShader = glsl`
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uBlurAmount;

varying vec2 vUv;

void main() {
    vec2 texelSize = 1.0 / uResolution;
    float strength = uBlurAmount / 3.0;
    vec4 color = texture2D(uTexture, vUv);
    vec4 finalColor = vec4(0.0);
    float totalWeight = 0.0;


    
    for(int x = -4; x <= 4; x++) {
        for(int y = -4; y <= 4; y++) {
            float weight = 1.0 - (abs(float(x)) + abs(float(y))) / 8.0;
            vec2 offset = vec2(float(x), float(y)) * texelSize * strength;
            finalColor += texture2D(uTexture, vUv + offset) * weight;
            totalWeight += weight;
        }
    }
    
    gl_FragColor = vec4(finalColor.rgb / totalWeight, color.a);
}
`;
export default fragmentShader;
