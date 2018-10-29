import React from 'react';
import Numerical from './components/AttrInit/Numerical.js';
import Categorical from './components/AttrInit/Categorical.js';
import MergePanel from './components/AttrInit/MergePanel.js';

export default class extends React.Component {
  render() {
    return (
      <div>
        {/* <Numerical />
      <Categorical /> */}
        <MergePanel />
      </div>
    );
  }
}
