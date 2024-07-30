import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';

import styles from './Webgl.module.scss';

import gsap from 'gsap';

// components
import { createPlane } from './components/plane';

const Webgl = ({ imgs }) => {
  const [dir, setDir] = useState(false);
  const canvasRef = useRef(null);
  const [planeImage, setPlaneImage] = useState(null);

  useEffect(() => {
    // Scene
    const scene = new THREE.Scene();

    const app = document.querySelector('#app');

    // Camera
    // const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    scene.add(camera);
    camera.position.z = 6;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Plane Geometry
    const plane = createPlane(renderer, imgs);
    setPlaneImage(plane);
    scene.add(plane.mesh);

    // Dat.GUI
    const gui = new GUI();
    gui
      .add(plane.mesh.material.uniforms.uNoise, 'value')
      .min(1)
      .max(10)
      .name('Noise');
    gui.add(plane.mesh.material.uniforms.uOffset, 'value', 0, 1).name('Offset');

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      if (plane) {
        plane.mesh.material.uniforms.time.value += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      canvasRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const handleImage = (src, index) => {
    const t = new THREE.TextureLoader().load(src);
    if (dir) {
      planeImage.mesh.material.uniforms.uTexture1.value = t;
    } else {
      planeImage.mesh.material.uniforms.uTexture2.value = t;
    }

    gsap.fromTo(
      planeImage.mesh.material.uniforms.uOffset,
      {
        value: dir ? 1 : 0,
      },
      {
        value: dir ? 0 : 1,
        ease: 'power1.in',
        duration: 1,
        onComplete() {
          setDir(!dir);
        },
      }
    );
  };

  return (
    <>
      <div ref={canvasRef} />
      <div className={styles.images}>
        {imgs.map((img, index) => {
          return (
            <div key={index} className={styles.images__item}>
              <img
                onClick={() => handleImage(img.src, index)}
                className={styles.images__item__img}
                src={img.src}
                alt={index}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Webgl;
