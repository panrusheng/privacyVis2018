import React from 'react';
import * as d3 from 'd3';

export default class Numerical extends React.Component {
  static defaultProps = {
    data: []
  };

  render() {
    return (
      <div className="numberical-view">
        <svg />
      </div>
    );
  }
}
