import React, { useEffect, useRef, useState } from 'react';
import styles from './Person.module.scss';
import Output from './Output.js';

const Person = ({ imgs }) => {
  const containerRef = useRef(null);
  const outputRef = useRef(null);

  const [activeButtons, setActiveButtons] = useState(true);

  useEffect(() => {
    // Initialize Experience
    outputRef.current = new Output({
      targetElement: containerRef.current,
      images: imgs,
    });
  }, []);

  const handleImage = (src, index) => {
    // Call a method from the Output instance when an image is clicked
    if (outputRef.current) {
      outputRef.current.handleImageClick(src, index); // Replace with your desired method
    }
  };

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        className={`${styles.images} ${
          activeButtons ? null : styles.images__disable
        }`}
      >
        {imgs.map((img, index) => {
          return (
            <div key={index} className={styles.images__item}>
              <img
                className={styles.images__item__img}
                onClick={() => handleImage(img.src, index)}
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

export default Person;
