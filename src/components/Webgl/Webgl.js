import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';

import styles from './Webgl.module.scss';

import gsap from 'gsap';

// components
import { createPlane } from './components/plane';

const Webgl = ({ imgs }) => {
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
    let dir = true;
    var obj = {
      play: function () {
        gsap.fromTo(
          plane.mesh.material.uniforms.uOffset,
          {
            value: dir ? 0 : 1,
          },
          {
            value: dir ? 1 : 0,
            ease: 'none',
            duration: 1,
            onComplete: () => {
              dir = !dir;
            },
          }
        );
        /* gsap.fromTo(
          plane.mesh.material.uniforms.uNoise,
          {
            value: dir ? 0 : 1,
          },
          {
            value: dir ? 1 : 0,
            ease: 'none',
            duration: 1,
          }
        ); */
      },
    };
    gui
      .add(plane.mesh.material.uniforms.uNoise, 'value')
      .min(1)
      .max(10)
      .name('Noise');
    gui.add(plane.mesh.material.uniforms.uOffset, 'value', 0, 1).name('Offset');
    gui.add(obj, 'play');

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
    console.log(index, src);
    console.log(planeImage.mesh);
  };

  return (
    <>
      <div ref={canvasRef} />
      <div className={styles.images}>
        {imgs.map((img, index) => {
          return (
            <img
              onClick={() => handleImage(img.src, index)}
              className={styles.images__item}
              key={index}
              src={img.src}
              alt={index}
            />
          );
        })}
      </div>
    </>
  );
};

export default Webgl;
