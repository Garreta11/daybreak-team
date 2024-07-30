import * as THREE from 'three';
import { getCoverUV } from '../../../utils/three.js';

// shaders
import vertex from '../../../shaders/vertex.js';
import fragment from '../../../shaders/fragmentDisplacement.js';

const createPlane = (renderer, imgs) => {
  const colorsArray = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff00ff), // Magenta
  ];

  // const colors = colorsArray.map((color) => color.toArray()).flat();
  // console.log(colors.length);

  const planeGeometry = new THREE.PlaneGeometry(2, 2);

  const textures = [];
  imgs.forEach((img, i) => {
    textures[i] = new THREE.TextureLoader().load(img.src);
  });

  const uvCover1 = getCoverUV(renderer);
  const uvCover2 = getCoverUV(renderer);

  const material = new THREE.ShaderMaterial({
    extensions: {
      derivatives: '#extension GL_OES_standard_derivatives : enable',
    },
    uniforms: {
      time: { value: 0.0 },
      uTexture1: { value: textures[0] },
      uTexture2: { value: textures[1] },

      uOffset: { value: 0.0 },
      uNoise: { value: 3.0 },

      uDuration: { value: 8.0 },
      resolution: { value: new THREE.Vector4() },
      colors: { value: colorsArray },
      colorsLength: { value: colorsArray.length },
      uvRepeat1: { value: uvCover1.repeat },
      uvOffset1: { value: uvCover1.offset },
      uvRepeat2: { value: uvCover2.repeat },
      uvOffset2: { value: uvCover2.offset },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
  });

  const mesh = new THREE.Mesh(planeGeometry, material);

  return { mesh };
};

export { createPlane };
