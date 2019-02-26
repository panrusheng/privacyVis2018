import React, { Component } from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';
import { inject } from 'mobx-react';
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
      ww,
      hh,
      data,
      name
    } = this.props;
    if (data.nodes.length === 0) return;
    const marginX = 100, marginY = 50;
    const {
      nodes,
      links,
      num
    } = data;
    const del = [];

    const r = 10;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + marginX / 2, ww - marginX]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + marginY, hh - marginY]);
    let delList = [];
    let triangleList = [];
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
      nodes[i].del = false;
      del.push([]);
    }
    for (let i = 0; i < sch.length; i++) {
      for (let j = 0; j < sch[i].dL.length; j++) {
        del[sch[i].dL[j]].push(i);
      }
    }

    for (let i = 0; i < del.length; i++) {
      if (del[i].length > 0) {
        nodes[i].del = true;
        delList.push(nodes[i]);
        for (let j = 0; j < del[i].length; j++) {
          let x = nodes[i].x, y = nodes[i].y;
          let d = "M0, 0 L" + (-2 * r) + "," + 2 * 1.732 * r +
            "L" + 2 * r + "," + 2 * 1.732 * r;
          let a = j * 2 / 3 + 1;
          triangleList.push({ x: x, y: y, d: d, a: a, t: "S" + (j + 1) });
        }
      }
    }
    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    g.selectAll("." + name).remove();

    if (d3.selectAll('#arrow'.length === 0)) {
      g.append('defs')
        .attr('class', 'n2d')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4L3,0')
        .style('fill', '#666');

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
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#666')
      .style('stroke-width', 3)
      .style('cursor', 'pointer');

    const triangleCanvas = g.append('g')
      .attr('class', name)
      .selectAll('triangles')
      .data(triangleList)
      .enter();
    triangleCanvas.append('path')
      .attr('d', d => d.d)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ') rotate(' + d.a * 180 + ')')
      .style('fill', '#1866BB');

    triangleCanvas.append('text')
      .attr('x', d => d.x + 2.5 * r * Math.cos((d.a + 0.5) * Math.PI))
      .attr('y', d => d.y + 2.5 * r * Math.sin((d.a + 0.5) * Math.PI))
      .attr('dy', r / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#fff')
      .text(d => d.t);

    g.append('g')
      .attr('class', name)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.del ? r * 1.4 : r)
      .style('fill', d => {
        if (d.del) return "#ccc";
        return d.value < 0 ? '#FE2901' : '#7bbc88'
      })
      // .style('stroke-width', 3)//d => d.del ? 2 : 3)
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
      .attr('x', d => d.x - 7)
      .attr('y', d => d.y + 9)
      .text('?')
      .style('fill', '#fff')
      .style('font-family', 'Arial')
      .style('font-weight', 600)
      .style('font-size', 24);
    g
      .append('g')
      .attr('class', name)
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', - r)
      .attr('dx', d => (d.x < ww - 60 ? r + 4 : -(r + 4)))
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .style('text-anchor', d => (d.x < ww - 60 ? 'start' : 'end'))
      .text(d => d.id)
      .style('fill', '#333')
      .style('font-size', 15);

    g.append('text')
      .attr('class', name)
      .attr('x', 13)
      .attr('y', 25)
      .text('Amount:' + num)
      .style('fill', '#333');
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