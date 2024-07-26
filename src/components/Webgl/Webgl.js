import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';

import gsap from 'gsap';

// components
import { createPlane } from './components/plane';

const Webgl = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Scene
    const scene = new THREE.Scene();

    const app = document.querySelector('#app');

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    scene.add(camera);
    camera.position.z = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(app.offsetWidth, app.offsetHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Plane Geometry
    const plane = createPlane(renderer);
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
            ease: 'power.out',
            duration: 1,
            onComplete: () => {
              dir = !dir;
            },
          }
        );
      },
    };
    gui.add(plane.mesh.material.uniforms.uOffset, 'value', 0, 1);
    gui.add(obj, 'play');

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      if (plane) {
        //plane.mesh.material.uniforms.time.value += 0.01;
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

  return <div ref={canvasRef} />;
};

export default Webgl;
