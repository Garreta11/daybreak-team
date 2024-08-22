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

  uniform float uNoiseAmplitude;
  uniform float uNoiseFrequency;

  uniform vec4 resolution;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;

  uniform sampler2D uDataTexture;

  uniform vec2 uDirection;
  uniform vec2 uMouse;

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
  vec4 blendColors1(vec4 color) {
    // Convert texture to grayscale
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Luma grayscale conversion

    // Define the thresholds for the grayscale tonalities (5 ranges)
    float thresholds[5];
    thresholds[0] = 0.2;
    thresholds[1] = 0.4;
    thresholds[2] = 0.6;
    thresholds[3] = 0.8;
    thresholds[4] = 1.0;

    // Determine the appropriate color based on the grayscale value
    vec4 finalColor = vec4(0.0);
    if (gray <= thresholds[0]) {
        finalColor = colorsArray[0];
    } else if (gray <= thresholds[1]) {
        finalColor = colorsArray[1];
    } else if (gray <= thresholds[2]) {
        finalColor = colorsArray[2];
    } else if (gray <= thresholds[3]) {
        finalColor = colorsArray[3];
    } else {
        finalColor = colorsArray[4];
    }
    return finalColor;
  }
  // BLENDING COLORS TEXTURE2
  vec4 blendColors2(vec4 color) {
    // Convert texture to grayscale
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Luma grayscale conversion

    // Define the thresholds for the grayscale tonalities (5 ranges)
    float thresholds[5];
    thresholds[0] = 0.2;
    thresholds[1] = 0.4;
    thresholds[2] = 0.6;
    thresholds[3] = 0.8;
    thresholds[4] = 1.0;

    // Determine the appropriate color based on the grayscale value
    vec4 finalColor = vec4(0.0);
    if (gray <= thresholds[0]) {
        finalColor = colorsArray2[0];
    } else if (gray <= thresholds[1]) {
        finalColor = colorsArray2[1];
    } else if (gray <= thresholds[2]) {
        finalColor = colorsArray2[2];
    } else if (gray <= thresholds[3]) {
        finalColor = colorsArray2[3];
    } else {
        finalColor = colorsArray2[4];
    }
    return finalColor;
  }

  // Fractal Brownian Motion (FBM)
  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  //	Classic Perlin 2D Noise 
  //	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
  //
  vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

  float cnoise(vec2 P){
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * 
      vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

  float blendDarken(float base, float blend) {
    return min(blend, base);
  }
  
  vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r), blendDarken(base.g, blend.g), blendDarken(base.b, blend.b));
  }
  
  vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
    return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
  }


  void main() {  
    vec2 st = vUv;
    vec2 pixel = vec2(2.0) / resolution.xy;
    vec2 direction = uDirection * uBlurAmount;
    vec2 texelSize = 1.0 / resolution.xy;

    vec4 dataTexture = texture2D(uDataTexture, st);

    // Apply FBM for WaterColor Effect
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time);
    q.y = fbm( st + vec2(1.0));
    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);
    float n = fbm(st * uNoise + r + time);

    // Center the coordinates around (0.5, 0.5) and apply FBM (n)
    vec2 centeredUv = vUv - vec2(0.5);
    vec2 offset = centeredUv * (n * 0.3 + 1.0);
    offset += vec2(0.5);

    vec2 newUv = mix(st, offset, uOffset) - 0.02 * dataTexture.rg;

    // Calculate mouse distance from the current fragment
    vec2 mouseNormalized = uMouse / resolution.xy; // Normalized mouse position [0,1]
    vec2 centeredMouse = mouseNormalized * 2.0 - 1.0; // Mouse [-1,1]
    centeredMouse.y = -centeredMouse.y; // Flip y for correct coordinates

    // Calculate the distance from the current fragment's UV to the mouse position
    float dist = distance(centeredMouse, vUv * 2.0 - 1.0);

    // Set the strength of the blending based on proximity to the mouse
    float blendStrength = smoothstep(0.9, 0.0, dist); // Blending falls off with distance

    float offsetAmount = 0.03 * blendStrength;
    // float offsetAmount = 0.0;

    // Center the UV coordinates around (0.5, 0.5), scale them, then move back
    float scaleFactor = 0.1;
    
    vec2 newBlendedUv = newUv + uNoiseAmplitude * cnoise(uNoiseFrequency * newUv + time * 0.01) - 0.5;
    // vec2 scaledUV = newBlendedUv * sin(cnoise(scaleFactor * newBlendedUv + time * 0.01)) + 0.5;
    vec2 scaledUV = newBlendedUv + 0.5;


    vec2 aspect = vec2(1., resolution.y / resolution.x);
    vec2 disp = fbm(vUv * 22.0) * aspect * 0.01;
    
    // TEXTURE 1
    vec4 texture1 = texture2D(uTexture1, newUv);
    vec4 finalColor = kuwaharaFilter(uTexture1, newUv, pixel, uKuwahara);

    vec4 texel1 = kuwaharaFilter(uTexture1, newUv, pixel, uKuwahara);
    vec4 texel1_2 = kuwaharaFilter(uTexture1, vec2(newUv.x + disp.x, newUv.y), pixel, uKuwahara);
    vec4 texel1_3 = kuwaharaFilter(uTexture1, vec2(newUv.x - disp.x, newUv.y), pixel, uKuwahara);
    vec4 texel1_4 = kuwaharaFilter(uTexture1, vec2(newUv.x, newUv.y + disp.x), pixel, uKuwahara);
    vec4 texel1_5 = kuwaharaFilter(uTexture1, vec2(newUv.x, newUv.y - disp.x), pixel, uKuwahara);

    
    vec3 floodcolor = texel1.rgb;
    floodcolor = blendDarken(floodcolor, texel1_2.rgb);
    floodcolor = blendDarken(floodcolor, texel1_3.rgb);
    floodcolor = blendDarken(floodcolor, texel1_4.rgb);
    floodcolor = blendDarken(floodcolor, texel1_5.rgb);
    
    vec4 bColor1 = blendColors1(vec4(floodcolor, 1.0));
    finalColor = vec4(bColor1);

    vec4 blendedColor = kuwaharaFilter(uTexture1, scaledUV + vec2(offsetAmount, offsetAmount), pixel, uKuwahara);
    blendedColor += kuwaharaFilter(uTexture1, scaledUV + vec2(offsetAmount, offsetAmount), pixel, uKuwahara);
    blendedColor += kuwaharaFilter(uTexture1, scaledUV + vec2(-offsetAmount, offsetAmount), pixel, uKuwahara);
    blendedColor += kuwaharaFilter(uTexture1, scaledUV + vec2(-offsetAmount, -offsetAmount), pixel, uKuwahara);
    blendedColor += kuwaharaFilter(uTexture1, scaledUV + vec2(offsetAmount, -offsetAmount), pixel, uKuwahara);
    blendedColor /= 5.;
    
    blendedColor = blendColors1(blendedColor);

    // finalColor = mix(finalColor, blendedColor, blendStrength);
    finalColor = blendedColor;

    // TEXTURE 2
    vec4 texture2 = texture2D(uTexture2, newUv);
    vec4 finalColor2 = kuwaharaFilter(uTexture2, newUv, pixel, uKuwahara);
    
    vec4 texel2 = kuwaharaFilter(uTexture2, newUv, pixel, uKuwahara);
    vec4 texel2_2 = kuwaharaFilter(uTexture2, vec2(newUv.x + disp.x, newUv.y), pixel, uKuwahara);
    vec4 texel2_3 = kuwaharaFilter(uTexture2, vec2(newUv.x - disp.x, newUv.y), pixel, uKuwahara);
    vec4 texel2_4 = kuwaharaFilter(uTexture2, vec2(newUv.x, newUv.y + disp.x), pixel, uKuwahara);
    vec4 texel2_5 = kuwaharaFilter(uTexture2, vec2(newUv.x, newUv.y - disp.x), pixel, uKuwahara);

    vec3 floodcolor2 = texel2.rgb;
    floodcolor2 = blendDarken(floodcolor2, texel2.rgb);
    floodcolor2 = blendDarken(floodcolor2, texel2_2.rgb);
    floodcolor2 = blendDarken(floodcolor2, texel2_3.rgb);
    floodcolor2 = blendDarken(floodcolor2, texel2_5.rgb);

    vec4 bColor2 = blendColors2(finalColor2);
    finalColor2 = bColor2;

    vec4 blendedColor2 = finalColor2;
    blendedColor2 += kuwaharaFilter(uTexture2, scaledUV + vec2(offsetAmount, offsetAmount), pixel, uKuwahara);
    blendedColor2 += kuwaharaFilter(uTexture2, scaledUV + vec2(-offsetAmount, offsetAmount), pixel, uKuwahara);
    blendedColor2 += kuwaharaFilter(uTexture2, scaledUV + vec2(-offsetAmount, -offsetAmount), pixel, uKuwahara);
    blendedColor2 += kuwaharaFilter(uTexture2, scaledUV + vec2(offsetAmount, -offsetAmount), pixel, uKuwahara);
    blendedColor2 /= 5.;

    blendedColor2 = blendColors2(blendedColor2);

    finalColor2 = mix(finalColor2, blendedColor2, blendStrength);

    
    vec4 color = mix(vec4(finalColor.rgb * 0.5, texture1.a), vec4(finalColor2.rgb * 0.5, texture2.a), uOffsetImages);

    gl_FragColor = color;
    // gl_FragColor = texture2D(uTexture1, st - 0.02 * dataTexture.rg);
  }
`;
export default fragmentShader;
