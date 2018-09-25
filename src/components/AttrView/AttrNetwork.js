import React, { Component } from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';

export default class AttrNetwork extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.renderGraph(this.g, this.props);
  }

  componentDidUpdate(newProps) {
    this.renderGraph(this.g, newProps);
  }

  renderGraph(gDOM) {
    const that = this;
    let { canvas, data } = this.props;
    //if (data.nodes.length == 0) return;

    const g = d3.select(gDOM);
    //let {ww, hh} = canvas;
    //let {nodes, edges} = data;
  }

  render() {
    return (
      <g
        ref={g => {
          this.g = g;
        }}
        width={this.props.width}
        height={this.props.height}
      />
    );
  }
}
