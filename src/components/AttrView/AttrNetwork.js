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
    let margin = 50;
    let { ww, hh } = canvas;
    let { nodes, links } = data;
    const merge = 'child' in nodes[0];
    let r = merge ? 10 : 5;
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
      .style('cursor', 'pointer')
      .on('click', d => {
        if (!merge) {
          return;
        }
        // d3.select(this).style('opacity', 0);
        d3.selectAll('.edgeDetail').remove();
        let x1 = nodes[d.source.index].x,
          x2 = nodes[d.target.index].x,
          y1 = nodes[d.source.index].y,
          y2 = nodes[d.target.index].y;
        let dx1 = x2 - x1,
          dy1 = y2 - y1,
          dx2 = 1,
          dy2 = 0;
        let l = Math.sqrt(dx1 * dx1 + dy1 * dy1),
          w = 30;
        let ifFlip = dy1 > 0,
          f = ifFlip ? -1 : 1;
        if (l == 0) return -1;
        let angle =
          ((f * Math.asin((dx1 * dx2 + dy1 * dy2) / l)) / Math.PI) * 180;
        let edgeDetail = g
          .append('g')
          .attr('class', 'edgeDetail')
          .attr(
            'transform',
            'translate(' +
              ((1 - f) * x1 + (f + 1) * x2) / 2 +
              ',' +
              ((1 - f) * y1 + (f + 1) * y2) / 2 +
              ') rotate(' +
              angle +
              ')'
          );
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', r + 3)
          .attr('width', 2 * w)
          .attr('height', l - 2 * r - 6)
          .style('fill', '#fff');
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', r + 2)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', l - r - 2 - 4)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        const sourceList = nodes[d.source.index].child;
        const targetList = nodes[d.target.index].child;
        const triH = 10;
        edgeDetail
          .append('g')
          .attr(
            'transform',
            'translate(' +
              f * w +
              ',' +
              (ifFlip ? r + 6 : l - r - 6) +
              ') rotate(' +
              (f + 1) * 90 +
              ')'
          )
          .selectAll('.triS')
          .data(sourceList)
          .enter()
          .append('path')
          .attr(
            'd',
            (dd, i) =>
              'M' +
              (i * 2 * w) / sourceList.length +
              ', 0 L' +
              ((i + 1 / 2) * 2 * w) / sourceList.length +
              ',' +
              triH +
              'L' +
              ((i + 1) * 2 * w) / sourceList.length +
              ',0'
          )
          .style(
            'fill',
            nodes[d.source.index].value < 0 ? '#efaf4f' : '#4fafef'
          )
          .append('title')
          .text(dd => dd);

        edgeDetail
          .append('g')
          .attr(
            'transform',
            'translate(' +
              -f * w +
              ',' +
              (ifFlip ? l - r - 6 : r + 6) +
              ') rotate(' +
              (f - 1) * 90 +
              ')'
          )
          .selectAll('.triT')
          .data(targetList)
          .enter()
          .append('path')
          .attr(
            'd',
            (dd, i) =>
              'M' +
              (i * 2 * w) / targetList.length +
              ', 0 L' +
              ((i + 1 / 2) * 2 * w) / targetList.length +
              ',' +
              triH +
              'L' +
              ((i + 1) * 2 * w) / targetList.length +
              ',0'
          )
          .style(
            'fill',
            nodes[d.target.index].value < 0 ? '#efaf4f' : '#4fafef'
          )
          .append('title')
          .text(dd => dd);
        edgeDetail
          .append('g')
          .selectAll('.triE')
          .data(d.child)
          .enter()
          .append('path')
          .attr('d', function(dd) {
            let x1 = ((dd.source + 1 / 2) * 2 * w) / sourceList.length,
              x2 = ((dd.target + 1 / 2) * 2 * w) / targetList.length;
            let y = ifFlip ? r + 6 + triH : l - (r + 6 + triH);
            return (
              'M' +
              (ifFlip ? x1 - w : w - x1) +
              ',' +
              y +
              'L' +
              (ifFlip ? x2 - w : w - x2) +
              ',' +
              (l - y)
            );
          })
          .style('opacity', dd => dd.value)
          .style('stroke', '#999')
          .style('stroke-width', 2);
      })
      .on('contextmenu', d => {
        d3.event.preventDefault();
        const x = d3.event.x - 10,
          y = d3.event.y - 152,
          height = 20,
          width = 80,
          margin = 3, // fraction of width
          items = ['Remove', 'Edit weight'];
        d3.select('.context-menu').remove();

        // Draw the menu
        g.append('g')
          .attr('class', 'context-menu')
          .selectAll('tmp')
          .data(items)
          .enter()
          .append('g')
          .attr('class', 'menu-entry')
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this)
              .select('rect')
              .style('fill', '#ccc');
          })
          .on('mouseout', function() {
            d3.select(this)
              .select('rect')
              .style('fill', '#eee');
          });

        d3.selectAll('.menu-entry')
          .append('rect')
          .attr('x', x)
          .attr('y', function(dd, i) {
            return y + i * height;
          })
          .attr('width', width)
          .attr('height', height)
          .style('fill', '#eee')
          .style('stroke', '#fff');

        d3.selectAll('.menu-entry')
          .append('text')
          .text(function(dd) {
            return dd;
          })
          .attr('x', x)
          .attr('y', function(dd, i) {
            return y + i * height;
          })
          .attr('dy', height - 2 * margin)
          .attr('dx', 2 * margin)
          .style('fill', '#666')
          .style('font-size', 13);

        // Other interactions
        d3.select('body').on('click', function() {
          d3.select('.context-menu').remove();
        });
      });

    const node = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', r)
      .style('stroke', d => (d.value < 0 ? '#efaf4f' : '#4fafef'))
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
      .attr('dy', -r)
      .attr('dx', d => (d.x < ww - 60 ? r + 1 : -(r + 1)))
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
