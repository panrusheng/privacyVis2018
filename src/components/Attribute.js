import React from 'react';
import { Switch, Slider } from 'antd';
import '../assets/style/Attribute.scss';

export default class Attribute extends React.Component {
  state = {
    mergeAttribute: false,
    filterValue: 0.3
  };

  render() {
    return (
      <div className="attribute-view">
        <div className="title">Attribute View</div>
        <div className="attr-operations">
          <div className="operation">
            <span className="label">Correlation Filter:</span>
            <Slider
              onChange={value => this.setState({ filterValue: value })}
              value={this.state.filterValue}
            />
          </div>
          <div className="operation">
            <span className="label">Merge Attribute:</span>
            <Switch
              checked={this.state.mergeAttribute}
              onChange={value => this.setState({ mergeAttribute: value })}
            />
          </div>
        </div>
        <div>TODO</div>
      </div>
    );
  }
}
