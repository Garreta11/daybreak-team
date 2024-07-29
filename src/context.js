import { createContext, useState, useEffect } from 'react';

const GeneralContext = createContext();

export default function GeneralProvider({ children }) {
  const [image1, setImage1] = useState(0);
  const [image2, setImage2] = useState(1);

  return (
    <GeneralContext.Provider
      value={{
        image1,
        setImage1,
        image2,
        setImage2,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
}

export { GeneralContext };
