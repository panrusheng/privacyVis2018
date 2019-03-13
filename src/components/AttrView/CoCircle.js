import React, {
  Component
} from 'react';
import {
  toJS,
} from 'mobx';
import * as d3 from 'd3';
// import { toJS } from 'mobx';
import {
  inject,
  observer
} from 'mobx-react';
@inject(['store'])
export default class AttrNetwork extends Component {
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
    const that = this;
    let {
      data,
      canvas,
      eventName
    } = this.props;
    let {
      ww,
      hh
    } = canvas;

    const {
      pro,
      eventList
    } = data;
    const riskLimit = this.props.store.riskLimit,
      safeRange = [pro - riskLimit, pro + riskLimit];
    const marginX = 50, marginY = 20,
      r = 5;
    const ScaleX = d3
      .scaleLinear()
      .domain([0,1])//d3.extent(eventList, d => d.cor))
      .range([marginX, ww - 3 * marginX]);
    let dataList = [];
    // for (let i = 0; i < eventList.length; i++) {
    //   let p = eventList[i].cor;
    //   if (p <= pro + riskLimit && p >= pro - riskLimit) continue;
    //   let x = ScaleX(p), 
    //   y = Math.random() * (hh - 2 * marginY),
    //   num = eventList[i].eventList.length;
    //   dataList.push({d: makePolygon(num, r), x, y, list: eventList[i].eventList})
    // }

    safeRange.forEach((d) => d = ScaleX(d) > 0 ? ScaleX(d) : 0);
    const safeX = (safeRange[0] + safeRange[1]) / 2,
      safeWidth = safeRange[1] - safeRange[0];
    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    d3.selectAll('.cor-chart').remove();
    g.append('g')
      .attr('class', 'cor-chart')
      .attr('transform', 'translate(0,' + (hh - marginY) +')')
      .call(d3.axisBottom(ScaleX));
  
    if (d3.selectAll('#biggerArrow'.length === 0)) {
      g.append('defs').attr('class', 'cor-chart')
        .append('marker')
        .attr('id', 'biggerArrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4L3,0')
        .style('fill', '#333');
    }
    g.append('line')
      .attr('x1', marginX)
      .attr('x2', ww - 2.5 * marginX)
      .attr('y1', hh - marginY)
      .attr('y2', hh - marginY)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);
    g.append('text')
      .attr('x', ww - 2.5 * marginX)
      .attr('y', 1.5 * marginY)
      .style('fill', '#666')
      .text('Correlations with');
    g.append('text')
      .attr('x', ww - 2.5 * marginX)
      .attr('y', 4 * marginY)
      .style('fill', '#666')
      .text(eventName);
    g.append('rect')
      .attr('x', safeX)
      .attr('y', marginY)
      .attr('width', safeRange[1] - safeRange[0])
      .attr('height', hh - 2 * marginY)
      .style('fill', 'none')
      .style('stroke', '#dedede')
      .style('stroke-width', safeWidth);
    g.selectAll('sets')
    .data(dataList)
    .enter()
    .append('path')
    .attr('class', 'eventSets cor-chart')
    .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
    .attr('d', d => d.d)
    .style('fill', '#666')
    .style('fill-opacity', 0.2)
    .on('mouseover', d => {
      d3.selectAll('.eventNodes')
      .style('stroke', dd => ifAinB(dd.id, d.list)? '#1866BB':'none');
    })
    .on('mouseout', () => {
      d3.selectAll('.eventNodes').style('stroke', 'none');
    })

    function ifAinB(a, b) {
      for (let i = 0; i < b.length; i++) {
        if (a === b[i]) return true;
      }
      return false;
    }

    function makePolygon(edgeNum, radius) {
      if (edgeNum === 1) return "M 0, 0 M" + -radius + ", 0 A " + radius + "," + radius + "0 1,0 " + 
        radius * 2 +",0 A" + radius + "," + radius + "0 1,0 " + -radius * 2 +",0";
      if (edgeNum === 2) {
        let wi = radius / 4, hi = radius;
        return "M" + -wi +"," + hi + "L" + wi + "," + hi + "L" + wi + "," + -hi + "L" + -wi + "," + -hi + "Z";
      }
      let angle = 0, d = "";
      const deltaAngle = 2 * Math.PI/ edgeNum;
      for (let i = 0; i <= edgeNum; i++) {
        d+= (i === 0)?"M":"L";
        d += (radius * Math.cos(angle + i * deltaAngle)) + "," + (radius * Math.sin(angle + i * deltaAngle));
      }
      return d;
    }

    
  }

  render() {
    return ( <
      g ref = {
        g => {
          this.g = g;
        }
      }
      width = {
        this.props.width
      }
      height = {
        this.props.height
      }
      />
    );
  }
}