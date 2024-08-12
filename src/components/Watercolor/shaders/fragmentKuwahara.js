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
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;

  uniform vec2 uDirection;

  uniform vec4 colorsArray[5]; // Maximum array size
  uniform int colorsLength;
  
  uniform vec4 colorsArray2[5]; // Maximum array size
  uniform int colorsLength2;

  varying vec2 vUv;
  varying vec3 vPosition;

  float PI = 3.141592653589793238;

  // KUWAHARA FILTER
  vec4 kuwaharaFilter(sampler2D tex, vec2 st, vec2 pixel, int radius) {
    float n = float((radius + 1) * (radius + 1));
    int i; int j;

    vec4 m0 = vec4(0.0);
    vec4 m1 = vec4(0.0);
    vec4 m2 = vec4(0.0);
    vec4 m3 = vec4(0.0);

    vec4 s0 = vec4(0.0);
    vec4 s1 = vec4(0.0);
    vec4 s2 = vec4(0.0);
    vec4 s3 = vec4(0.0);

    vec4 rta = vec4(0.0);
    vec4 c = vec4(0.0);
    
    for (j = -radius; j <= 0; ++j)  { 
      for (i = -radius; i <= 0; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m0 += c;
          s0 += c * c;
      }
    }

    for (j = -radius; j <= 0; ++j)  {
      for (i = 0; i <= radius; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m1 += c;
          s1 += c * c;
      }
    }

    for (j = 0; j <= radius; ++j)  {
      for (i = 0; i <= radius; ++i)  {
          c = texture2D(tex, st + vec2(i,j) * pixel);
          m2 += c;
          s2 += c * c;
      }
    }
  
    for (j = 0; j <= radius; ++j)  {
        for (i = -radius; i <= 0; ++i)  {
            c = texture2D(tex, st + vec2(i,j) * pixel);
            m3 += c;
            s3 += c * c;
        }
    }

    float min_sigma2 = 1e+2;
    m0 /= n;
    s0 = abs(s0 / n - m0 * m0);

    float sigma2 = s0.r + s0.g + s0.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m0;
    }

    m1 /= n;
    s1 = abs(s1 / n - m1 * m1);
    
    sigma2 = s1.r + s1.g + s1.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m1;
    }
    
    m2 /= n;
    s2 = abs(s2 / n - m2 * m2);
    
    sigma2 = s2.r + s2.g + s2.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m2;
    }
    
    m3 /= n;
    s3 = abs(s3 / n - m3 * m3);
    
    sigma2 = s3.r + s3.g + s3.b;
    if (sigma2 < min_sigma2) {
        min_sigma2 = sigma2;
        rta = m3;
    }

    return rta;
  }


  // BLENDING COLORS TEXTURE1
  vec4 blendColors1(vec4 color, float t) {
    float scaledT = t * float(colorsLength - 1);
    int index = int(scaledT);
    float fraction = scaledT - float(index);
    vec4 color1 = colorsArray[index];
    vec4 color2 = colorsArray[min(index + 1, colorsLength - 1)]; // Ensure index is within bounds
  
    // Linear interpolation between color1 and color2
    return mix(color1, color2, fraction);
  }
  // BLENDING COLORS TEXTURE2
  vec4 blendColors2(vec4 color, float t) {
    float scaledT = t * float(colorsLength2 - 1);
    int index = int(scaledT);
    float fraction = scaledT - float(index);
    vec4 color1 = colorsArray2[index];
    vec4 color2 = colorsArray2[min(index + 1, colorsLength2 - 1)]; // Ensure index is within bounds
  
    // Linear interpolation between color1 and color2
    return mix(color1, color2, fraction);
  }


  void main() {  
    vec2 st = vUv;
    vec2 pixel = vec2(2.0) / resolution.xy;
    vec2 direction = uDirection * uBlurAmount;
    vec2 texelSize = 1.0 / resolution.xy;
    
    // TEXTURE 1
    vec4 texture1 = texture2D(uTexture1, st);
    vec4 finalColor = kuwaharaFilter(uTexture1, st, pixel, uKuwahara);
    float gray1 = dot(finalColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    finalColor = blendColors1(finalColor, gray1);
    finalColor += texture2D(uTexture1, st + direction * texelSize * -4.0) * 0.05;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -3.0) * 0.09;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -2.0) * 0.12;
    finalColor += texture2D(uTexture1, st + direction * texelSize * -1.0) * 0.15;
    finalColor += texture2D(uTexture1, st) * 0.16;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 1.0) * 0.15;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 2.0) * 0.12;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 3.0) * 0.09;
    finalColor += texture2D(uTexture1, st + direction * texelSize * 4.0) * 0.05;

    // TEXTURE 2
    vec4 texture2 = texture2D(uTexture2, st);
    vec4 finalColor2 = kuwaharaFilter(uTexture2, st, pixel, uKuwahara);
    float gray2 = dot(finalColor2.rgb, vec3(0.2126, 0.7152, 0.0722));
    finalColor2 = blendColors2(finalColor2, gray2);
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * -4.0) * 0.05;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * -3.0) * 0.09;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * -2.0) * 0.12;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * -1.0) * 0.15;
    finalColor2 += texture2D(uTexture2, st) * 0.16;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * 1.0) * 0.15;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * 2.0) * 0.12;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * 3.0) * 0.09;
    finalColor2 += texture2D(uTexture2, st + direction * texelSize * 4.0) * 0.05;

    
    vec4 color = mix(vec4(finalColor.rgb * 0.5, texture1.a), vec4(finalColor2.rgb * 0.5, texture2.a), uOffsetImages);

    gl_FragColor = color;
  }
`;
export default fragmentShader;