import React from 'react';
import './Pipeline.scss';
import AttrInitialize from './AttrInit/AttrInitialize';

export default class Pipeline extends React.Component {
  render() {
    const { current = 1 } = this.props;

    return (
      <div className="pipeline-view">{current === 1 && <AttrInitialize />}</div>
    );
  }
}
