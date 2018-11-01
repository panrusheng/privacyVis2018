import React from 'react';
import { Switch, Slider } from 'antd';
import './Attribute.scss';
import '../components/AttrView/AttrNetwork';
import AttrNetwork from '../components/AttrView/AttrNetwork';

export default class Attribute extends React.Component {
  state = {
    mergeAttribute: false,
    filterValue: 0.3
  };

  render() {
    let data;
    let canvas;
    return (
      <div className="attribute-view">
        <div className="title">Attribute View</div>
        <div className="attr-operations">
          <div className="operation">
            <span className="label">Correlation filter:</span>
            <Slider
              min={0.3}
              max={1}
              step={0.01}
              onChange={value => this.setState({ filterValue: value })}
              value={this.state.filterValue}
            />
          </div>
          <div className="operation">
            <span className="label">Merge attribute:</span>
            <Switch
              checked={this.state.mergeAttribute}
              onChange={value => this.setState({ mergeAttribute: value })}
            />
          </div>
        </div>
        <div className="attr-network">
          <svg width="100%" height="100%">
            <AttrNetwork data={data} canvas={canvas} />
          </svg>
        </div>
      </div>
    );
  }
}
