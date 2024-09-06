import React from 'react';

import './App.scss';
import Person from './components/Person/Person';

function App() {
  const images = [
    {
      src: 'teammember1.png',
      colors: ['#023A89', '#C61173', '#6F661E', '#FC5C5A', '#783BAD'],
    },
    {
      src: 'teammember2.png',
      colors: ['#FFC36E', '#6A0370', '#04D385', '#FFC36E', '#068CE6'],
    },
    {
      src: 'teammember3.png',
      colors: ['#FF91D7', '#A30F86', '#45B345', '#023A89', '#FC5C5A'],
    },
    {
      src: 'teammember4.png',
      colors: ['#08CAC0', '#45B345', '#B55204', '#69BBFF', '#6CED8E'],
    },
    {
      src: 'teammember5.png',
      colors: ['#783BAD', '#068CE6', '#6CED8E', '#EB3E64', '#C61173'],
    },
    {
      src: 'teammember6.png',
      colors: ['#FFA948', '#FFC36E', '#6F661E', '#99E6A2', '#04D385'],
    },
  ];

  return (
    <div className='App' id='app'>
      <Person imgs={images} />
    </div>
  );
}

export default App;
