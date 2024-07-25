import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as dat from 'dat.gui';

// components
import { createPlane } from './components/plane';

const Webgl = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Dat.GUI
    const gui = new dat.GUI();

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    scene.add(camera);
    camera.position.z = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Plane Geometry
    const plane = createPlane();
    scene.add(plane.mesh);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      if (plane) {
        plane.mesh.material.uniforms.time.value += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const imageAspect = 1186 / 1353;

      let a1;
      let a2;

      if (window.innerHeight / window.innerWidth > imageAspect) {
        a1 = (window.innerWidth / window.innerHeight) * imageAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = window.innerHeight / window.innerWidth / imageAspect;
      }

      plane.material.uniforms.resolution.value.x = window.innerWidth;
      plane.material.uniforms.resolution.value.y = window.innerHeight;
      plane.material.uniforms.resolution.value.z = a1;
      plane.material.uniforms.resolution.value.w = a2;

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
