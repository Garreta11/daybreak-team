import * as THREE from 'three';

import { getCoverUV } from '../../../utils/three.js';

// images
import img from '../../../man.png';
import img2 from '../../../man2.png';
import displacementMap from '../../../displacement-map.jpg';

// shaders
import vertex from '../../../shaders/vertex.js';
import fragment from '../../../shaders/fragmentDisplacement.js';

const createPlane = (renderer) => {
  const colorsArray = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff00ff), // Magenta
  ];

  const colors = colorsArray.map((color) => color.toArray()).flat();

  const planeGeometry = new THREE.PlaneGeometry(2, 3.28);

  const texture = new THREE.TextureLoader().load(img);
  const texture2 = new THREE.TextureLoader().load(img2);
  const displacementTexture = new THREE.TextureLoader().load(displacementMap);

  const uvCover1 = getCoverUV(renderer);
  const uvCover2 = getCoverUV(renderer);

  const material = new THREE.ShaderMaterial({
    extensions: {
      derivatives: '#extension GL_OES_standard_derivatives : enable',
    },
    uniforms: {
      time: { value: 0.0 },
      uTexture1: { value: texture },
      uTexture2: { value: texture2 },

      uOffset: { value: 0.0 },

      uDuration: { value: 8.0 },
      resolution: { value: new THREE.Vector4() },
      colors: { value: colors },
      colorsLength: { value: colors.length },
      uvRepeat1: { value: uvCover1.repeat },
      uvOffset1: { value: uvCover1.offset },
      uvRepeat2: { value: uvCover2.repeat },
      uvOffset2: { value: uvCover2.offset },
      uDisplacementTexture: { value: displacementTexture },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
  });

  const mesh = new THREE.Mesh(planeGeometry, material);
  mesh.scale.set(0.5, 0.5, 0.5);

  return { mesh };
};

export { createPlane };
