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
    let { canvas, data, filter } = this.props;
    if (data.nodes.length == 0) return;
    let margin = 20;
    let { ww, hh } = canvas;
    let { nodes, links } = data;
    const merge = 'child' in nodes[0];
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
    g.selectAll('.n2d').remove();
    let defs = g.append('defs').attr('class', 'n2d');

    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 13)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#999');

    const link = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => (d.value >= filter ? d.value : 0))
      .attr('x1', d => nodes[d.source.index].x)
      .attr('y1', d => nodes[d.source.index].y)
      .attr('x2', d => nodes[d.target.index].x)
      .attr('y2', d => nodes[d.target.index].y)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#999')
      .style('stroke-width', 4)
      .on('click', d => {
        // if (merge) {
        //   // d3.select(this).style('opacity', 0);
        //   d3.selectAll('.edgeDetail').remove();
        //   let x1 = nodes[d.source.index].x,
        //     x2 = nodes[d.source.index].x,
        //     y1 = nodes[d.target.index].y,
        //     y2 = nodes[d.source.index].y;
        //   let dx1 = x2 - x1, dy1 = y2 - y1, dx2 = 0, dy2 = 1;
        //   let l = Math.Sqrt(dx1 * dx1 + dy1 * dy1), w = 10;
        //   if (l == 0) return -1;
        //   let angle = Math.Acos((dx1 * dx2 + dy1 * dy2) / l);
        //   let edgeDetail = g.append('g')
        //     .attr('class', 'edgeDetail')
        //     .attr('transform', 'translate('+x1+','+y2+') rotate('+angle+')');
        //     edgeDetail.append('rect')
        //     .attr('x', -w)
        //     .attr('y', 0)
        //     .attr('width', 2*w)
        //     .attr('height', l)
        //     .style('fill', '#5639fe');
        // }
      });

    const node = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .style('stroke', d => (d.attrName == 2 ? '#cd7890' : '#7890cd'))
      .style('stroke-width', 3)
      .style('fill', '#fff')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .on('mouseover', d => {});

    const text = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', -5)
      .attr('dx', d => (d.x < ww - 60 ? 6 : -6))
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', d => (d.x < ww - 60 ? 'start' : 'end'))
      .text(d => d.id)
      .style('fill', '#333');
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
