import React, { Component } from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';

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
    let { canvas, data, filter } = this.props;
    if (data.nodes.length == 0) return;
    let margin = 20;
    let { ww, hh } = canvas;
    let { nodes, links } = data;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + margin, ww - margin]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + margin, hh - margin]);
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
    }
    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);
    g.selectAll('line').remove();
    g.selectAll('circle').remove();
    g.selectAll('marker').remove();
    let defs = g.append('defs');

    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 13)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#999');

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => (d.value >= filter ? d.value : 0))
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#999')
      .style('stroke-width', 2);

    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .style('stroke', d => (d.attrName == 2 ? '#cd7890' : '#7890cd'))
      .style('stroke-width', 3)
      .style('fill', '#fff')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    node.append('title').text(d => d.id);
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
