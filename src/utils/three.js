import * as THREE from 'three';

export function getCoverUV(renderer) {
  // crop image like a "background: cover"
  const canvas = renderer.domElement;
  const aspectOfScene = canvas.offsetWidth / canvas.offsetHeight;
  const aspectOfImage = 1;

  const repeat = new THREE.Vector2();
  const offset = new THREE.Vector2();

  if (aspectOfScene / aspectOfImage > 1) {
    repeat.set(1.0, aspectOfImage / aspectOfScene);
  } else {
    repeat.set(aspectOfScene / aspectOfImage, 1.0);
  }

  offset.set((1 - repeat.x) / 2, (1 - repeat.y) / 2);

  return { offset, repeat };
}
