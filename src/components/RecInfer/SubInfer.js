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
      select,
      ww,
      hh,
      data,
      num,
      change
    } = this.props;
    const colorDic = this.props.store.eventColorList;
    if (data.nodes.length === 0) return;
    const margin = 20;
    const {
      nodes,
      links
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
    const linkOpacity = d3.scaleLinear().domain([0, d3.max(links, d => Math.abs(d.value))]).range([0, 1]);
    let delList = [];

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
      nodes[i].del = false;
    }

    for (let i = 0; i < del.length; i++) {
      let n = nodes.find(item => item.eventNo === del[i]);
      if (!n) return;
      n.del = true;
      delList.push(n);
    }

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    g.selectAll("*").remove();

    g.append('defs')
      .attr('class', "rec-small-" + num)
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

    g.append('g')
      .attr('class', "rec-small-" + num)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => linkOpacity(Math.abs(d.value)))
      .attr('x1', d => nodes[d.source.index].x)
      .attr('y1', d => nodes[d.source.index].y)
      .attr('x2', d => nodes[d.target.index].x)
      .attr('y2', d => nodes[d.target.index].y)
      .attr('marker-end', 'url(#arrowSub)')
      .style('stroke', '#666')
      .style('stroke-dasharray', d => d.value > 0 ? '1 0' : '8 4')
      .style('stroke-width', 2)
      .style('cursor', 'pointer');

    const circle = g.append('g')
      .attr('class', "rec-small-" + num)
      .selectAll('circle')
      .data(nodes)
      .enter();
    circle.append('circle')
      .attr('r', d => d.del ? 8 : 6)
      .style('fill', '#fff')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
    circle.append('circle')
      .attr('r', d => d.del ? 8 : 6)
      .style('fill', d => {
        if (d.del) return "#ccc";
        return colorDic[d.id];//d.value < 0 ? '#FE2901' : '#7bbc88'
      })
      .style('stroke-width', 3) //d => d.del ? 2 : 3)
      // .style('stroke-dasharray', d => d.del ? "2 2" : "1 0")
      .style('stoke', d => d.del ? '#ccc' : 'none')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    g.append('g')
      .attr('class', "rec-small-" + num)
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
        .attr('class', "rec-small-" + num)
        .attr('d', 'M2,2 L 50,2 L 2,50 Z')
        .style('fill', '#1866bb')
        .style('opacity', select ? 0.9 : 0.5);

      g.append('text')
        .attr('class', "rec-small-" + num)
        .attr('transform', 'rotate(-45)')
        .attr('x', 0)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .text(rec)
        .style('fill', '#fff');
    }

    g.append('rect')
      .attr('class', "rec-small-" + num)
      .attr('x', 2)
      .attr('y', 2)
      .attr('width', ww - 4)
      .attr('height', hh - 4)
      .style('stroke', select ? 'rgba(24,102,187,0.9)' : (rec > 0 ? 'rgba(24,102,187,0.5)' : 'none'))
      .style('stroke-width', 3)
      .style('fill', '#000')
      .style('fill-opacity', 0)
      .on('click', () => {
        change(num);
      });
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