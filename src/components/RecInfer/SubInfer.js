import React, {
  Component
} from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';
import {
  inject
} from 'mobx-react';
@inject(['store'])
export default class RecView extends Component {
  // constructor(props) {
  //   super(props);
  // }
  componentDidMount() {
    this.renderGraph(this.g, this.props);
  }

  componentDidUpdate() {
    this.renderGraph(this.g, this.props);
  }

  renderGraph(gDOM) {
    const {
      sch,
      rec,
      ww,
      hh,
      data,
      name
    } = this.props;
    if (data.nodes.length === 0) return;
    const margin = 20;
    const {
      nodes,
      links,
      num
    } = data;
    const del = sch.dL;
    // const r = 4;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + margin, ww - margin]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + margin, hh - margin]);
    let delList = [];

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
      nodes[i].del = false;
    }

    for (let i = 0; i < del.length; i++) {
      nodes[del[i]].del = true;
      delList.push(nodes[del[i]]);
    }

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    g.selectAll("*").remove();

    if (d3.selectAll('#arrowSub'.length === 0)) {
      g.append('defs')
        .attr('class', name)
        .append('marker')
        .attr('id', 'arrowSub')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4L3,0');
    }

    g.append('g')
      .attr('class', name)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => d.value)
      .attr('x1', d => nodes[d.source.index].x)
      .attr('y1', d => nodes[d.source.index].y)
      .attr('x2', d => nodes[d.target.index].x)
      .attr('y2', d => nodes[d.target.index].y)
      .attr('marker-end', 'url(#arrowSub)')
      .style('stroke', '#666')
      .style('stroke-width', 2)
      .style('cursor', 'pointer');

    g.append('g')
      .attr('class', name)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.del ? 8 : 6)
      .style('fill', d => {
        if (d.del) return "#ccc";
        return d.value < 0 ? '#FE2901' : '#7bbc88'
      })
      .style('stroke-width', 3) //d => d.del ? 2 : 3)
      // .style('stroke-dasharray', d => d.del ? "2 2" : "1 0")
      .style('stoke', d => d.del ? '#ccc' : 'none')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    g.append('g')
      .attr('class', name)
      .selectAll('text')
      .data(delList)
      .enter()
      .append('text')
      .attr('x', d => d.x - 4)
      .attr('y', d => d.y + 5)
      .text('?')
      .style('fill', '#fff')
      .style('font-family', 'Arial')
      .style('font-weight', 600);

    if (rec > 0) {
      g.append('path')
        .attr('class', name)
        .attr('d', 'M2,2 L 50,2 L 2,50 Z')
        .style('fill', '#1866bb')
        .style('opacity', 0.9);

      g.append('text')
        .attr('class', name)
        .attr('transform', 'rotate(-45)')
        .attr('x', 0)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .text(rec)
        .style('fill', '#fff');
    }

    g.append('rect')
      .attr('class', name)
      .attr('x', 2)
      .attr('y', 2)
      .attr('width', ww - 4)
      .attr('height', hh - 4)
      .style('stroke', rec > 0 ? 'rgba(24,102,187,0.9)' : 'none')
      .style('stroke-width', 3)
      .style('fill', '#000')
      .style('fill-opacity', 0);
  }

  render() {
    return ( <
      g ref = {
        g => {
          this.g = g;
        }
      }
      width = {
        this.props.ww
      }
      height = {
        this.props.hh
      }
      />
    );
  }
}