import styles from './Images.module.scss';

const Images = ({ imgs }) => {
  const handleImage = (src, index) => {
    console.log(index, src);
  };

  return (
    <div className={styles.images}>
      {imgs.map((img, index) => {
        return (
          <img
            onClick={() => handleImage(img.src, index)}
            className={styles.images__item}
            key={index}
            src={img.src}
          />
        );
      })}
    </div>
  );
};

export default Images;
