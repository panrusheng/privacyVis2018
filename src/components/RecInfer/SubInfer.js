import React, {
  Component
} from 'react';
import * as d3 from 'd3';
import {
  toJS
} from 'mobx';
import {
  inject
} from 'mobx-react';
@inject(['store'])
export default class RecView extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.renderGraph(this.g, this.props);
  }

  componentDidUpdate() {
    this.renderGraph(this.g, this.props);
  }

  renderGraph(gDOM) {
    const that = this;
    let {
      del,
      rec,
      ww,
      hh,
      data,
      name
    } = this.props;
    if (data.nodes.length === 0) return;
    let margin = 20;
    let {
      nodes,
      links,
      num
    } = data;
    let r = 4;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + margin, ww - margin]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + margin, hh - margin]);
    let delList = [];

    function ifaInb(a, b) {
      for (let i = 0; i < b.length; i++) {
        if (a === b[i]) return true;
      }
      return false;
    }
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
      if (ifaInb(nodes[i], del)) {
        nodes[i].del = true;
        delList.push(nodes[i])
      }
      else nodes[i].del = false;
    }
    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    g.selectAll("." + name).remove();

    let defs = g.append('defs').attr('class', name);

    defs.append('marker')
      .attr('id', 'arrow' + name)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 13)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#999');

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
      .attr('marker-end', 'url(#arrow' + name + ')')
      .style('stroke', '#999')
      .style('stroke-width', 2)
      .style('cursor', 'pointer');

    g.append('g')
      .attr('class', name)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', r)
      .style('stroke', d => {
        if (d.del) return "#ccc";
        return d.value < 0 ? '#efaf4f' : '#4fafef'
      })
      .style('stroke-width', d => d.del ? 2 : 3)
      .style('stroke-dasharray', d => d.del ? "2 1" : "1 0")
      .style('fill', '#fff')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    g.append('g')
      .attr('class', name)
      .selectAll('text')
      .data(delList)
      .enter()
      .append('text')
      .attr('x', d => d.x - 3)
      .attr('y', d => d.y + 5)
      .text('?')
      .style('fill', '#ccc');

    g.append('text')
      .attr('class', name)
      .attr('x', 5)
      .attr('y', hh - 7)
      .text('Amount:' + num)
      .style('fill', '#a0a0a0');

    g.append('rect')
      .attr('class', name)
      .attr('x', 2)
      .attr('y', 2)
      .attr('width', ww - 4)
      .attr('height', hh - 4)
      .style('stroke', rec > 0 ? '#333' : 'none')
      .style('stroke-width', 3)
      .style('fill', '#000')
      .style('fill-opacity', 0)
      .on('click', () => {
        //change selection
      });

    if (rec > 0) {
      g.append('text')
        .attr('class', name)
        .attr('x', ww - 5)
        .attr('y', 18)
        .style('text-anchor', 'end')
        .text('Picked for ' + rec)
        .style('fill', '#333');
    }
  }

  render() {
    return (<
      g ref={
        g => {
          this.g = g;
        }
      }
      width={
        this.props.ww
      }
      height={
        this.props.hh
      }
    />
    );
  }
}