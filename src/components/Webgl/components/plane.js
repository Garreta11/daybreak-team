import * as THREE from 'three';

import img from '../../../man.png';

// shaders
import vertex from '../../../shaders/vertex.js';
import fragment from '../../../shaders/fragment.js';

const createPlane = () => {
  const colorsArray = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff00ff), // Magenta
  ];

  const colors = colorsArray.map((color) => color.toArray()).flat();

  const planeGeometry = new THREE.PlaneGeometry(2, 3.28);

  const material = new THREE.ShaderMaterial({
    extensions: {
      derivatives: '#extension GL_OES_standard_derivatives : enable',
    },
    uniforms: {
      time: { value: 0.0 },
      uTexture: { value: new THREE.TextureLoader().load(img) },
      uDuration: { value: 8.0 },
      resolution: { value: new THREE.Vector4() },
      colors: { value: colors },
      colorsLength: { value: colors.length },
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
