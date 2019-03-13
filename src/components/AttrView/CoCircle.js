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
  state = {
    // showP: false,
  };

  constructor(props) {
    super(props);
    this.renderGraph = this.renderGraph.bind(this);
  }
  componentDidMount() {
    if (this.props.coData)
      this.renderGraph(this.g, this.props);
  }

  componentDidUpdate() {
    if (this.props.coData)
      this.renderGraph(this.g, this.props);
  }

  renderGraph(gDOM) {
    const that = this;
    let {
      coData,
      canvas,
      eventName
    } = this.props;
    let {
      ww,
      hh
    } = canvas;
    eventName = (eventName === null) ? that.props.store.sensitiveEventList[0] : eventName;
    const corData = coData[eventName];

    const {
      pro,
      data
    } = corData;
    const riskLimit = this.props.store.riskLimit;
    let safeRange = [pro - riskLimit, pro + riskLimit];
    const marginX = 50,
      marginY = 20,
      r = 10;
    let ScaleB, ScaleA;
    let ticks = [];
    let range = d3.extent(data, d => d.cor);
    // if (that.state.showP) {
    let safeWidth = 40, safeX;

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);
    d3.selectAll('.cor-chart').remove();

    let rangeChange = [safeRange[0], safeRange[1], range[0], range[1]];
    rangeChange.sort((a, b) => {
      return a - b;
    })
    if (rangeChange[0] === safeRange[0]) {
      if (rangeChange[3] === safeRange[1]) return;
      ScaleA = d3.scaleLinear()
        .domain([safeRange[1], range[1]])
        .range([marginX + safeWidth, ww - 3 * marginX]);
      safeX = 0;
      ScaleB = d3.scaleLinear()
        .domain([safeRange[0], safeRange[1]])
        .range([marginX, marginX + safeWidth]);
      let tickA = ScaleA.ticks(5);
      ticks = tickA.map((t) => { return {v: t, x: ScaleA(t)} });
      ticks.push({v: safeRange[0].toFixed(2), x: marginX});
      ticks.push({v: safeRange[1].toFixed(2), x: marginX + safeWidth});
    } else if (rangeChange[3] === safeRange[1]) {
      ScaleB = d3.scaleLinear()
        .domain([range[0], safeRange[0]])
        .range([marginX, ww - 3 * marginX - safeWidth]);
      safeX = ww - 3 * marginX - safeWidth;
      ScaleA = d3.scaleLinear()
        .domain([safeRange[0], safeRange[1]])
        .range([ww - 3 * marginX - safeWidth, ww - 3 * marginX]);
      let tickB = ScaleB.ticks(5);
      ticks = tickB.map((t) => { return {v: t, x: ScaleB(t)} });
      ticks.push({v: safeRange[1].toFixed(2), x: ww - 3 * marginX});
      ticks.push({v: safeRange[0].toFixed(2), x: ww - 3 * marginX - safeWidth});
    } else {
      let scale = (ww - 4 * marginX - safeWidth) / (safeRange[0] - range[0] + range[1] - safeRange[1]);
      safeX = marginX + scale * (safeRange[0] - range[0]);
      ScaleB = d3.scaleLinear()
        .domain([range[0], safeRange[0]])
        .range([marginX, safeX])
      ScaleA = d3.scaleLinear()
        .domain([safeRange[1], range[1]])
        .range([safeX + safeWidth, ww - 3 * marginX]);
      let tickB = ScaleB.ticks(3);
      tickB = tickB.map((t) => { return {v: t, x: ScaleB(t)} });
      let tickA = ScaleA.ticks(3);
      tickA = tickA.map((t) => { return {v: t, x: ScaleA(t)} });
      ticks = [...tickA, ...tickB];
      ticks.push({v: safeRange[1].toFixed(2), x: safeX + safeWidth});
      ticks.push({v: safeRange[0].toFixed(2), x: safeX});
    }
    // } else {
    //   range[0] = (range[0] < safeRange[1] && range[0] > safeRange[0])? safeRange[1]: range[0];
    //   range[1] = (range[1] > safeRange[0] && range[1] < safeRange[1])? safeRange[0]: range[1];
    //   if (range[0] === range[1]) return;
    //   ScaleX = d3.scaleLinear()
    //   .domain(range)
    //   .range([marginX, ww - 3 * marginX]);
    // }
    let dataList = [];
    for (let i = 0; i < data.length; i++) {
      let p = data[i].cor;
      if (p <= pro + riskLimit && p >= pro - riskLimit) continue;
      let x = (p > pro) ? ScaleA(p): ScaleB(p),
        y = r + 2 + Math.random() * (hh - 2 * marginY),
        num = data[i].eventLists.length;
      dataList.push({
        d: makePolygon(num, r),
        x,
        y,
        list: data[i].eventLists
      })
    }
    // safeRange = safeRange.map((d) => {
    //   return d > range[1] ? range[1] : d
    // });
    // safeRange = safeRange.map((d) => {
    //   return d < range[0] ? range[0] : d
    // });
    
    // g.append('g')
    //   .attr('class', 'cor-chart')
    //   .attr('transform', 'translate(0,' + (hh - marginY) + ')')
    //   .call(d3.axisBottom(ScaleB));
    // g.append('g')
    //   .attr('class', 'cor-chart')
    //   .attr('transform', 'translate(0,' + (hh - marginY) + ')')
    //   .call(d3.axisBottom(ScaleA));

    let tickSvg = g.append('g')
      .attr('class', 'cor-chart')
      .selectAll('ticks')
      .data(ticks)
      .enter();
    tickSvg.append("line")
      .attr('x1', d => d.x)
      .attr('x2', d => d.x)
      .attr('y1', hh - marginY)
      .attr('y2', hh - marginY + 6)
      .style('stroke', '#666')
      .style('stroke-width', 1);
    
    tickSvg.append('text')
      .attr('x', d => d.x)
      .attr('y', hh - marginY + 20)
      .style('text-anchor', "middle")
      .style('fill', '#666')
      .text(d => d.v);


    g.append('rect')
      .attr('class', 'cor-chart')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', ww)
      .attr('height', hh)
      .style('opacity', 0)
      .style('cursor', 'pointer')
      .on('click', () => {
        d3.selectAll('.eventSets').attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
      });
    g.append('rect')
      .attr('class', 'cor-chart')
      .attr('x', safeX)
      .attr('y', 0)
      .attr('width', safeWidth)
      .attr('height', hh - marginY)
      .style('fill', '#cdcdcd');
    g.append('line')
      .attr('class', 'cor-chart')
      .attr('x1', safeX + safeWidth / 2)
      .attr('x2', safeX + safeWidth / 2)
      .attr('y1', 0)
      .attr('y2', hh - marginY)
      .style('stroke', '#333');
    g.append('line')
      .attr('class', 'cor-chart')
      .attr('x1', marginX)
      .attr('x2', ww - 2.5 * marginX)
      .attr('y1', hh - marginY)
      .attr('y2', hh - marginY)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);
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
    g.append('text')
      .attr('class', 'cor-chart')
      .attr('x', ww - 2.5 * marginX + 5)
      .attr('y', 2.5 * marginY)
      .style('fill', '#666')
      .text('P(' + eventName + '|Events)');
    g.append('text')
      .attr('class', 'cor-chart')
      .attr('x', safeX + safeWidth / 2 + 5)
      .attr('y', hh - marginY - 15)
      .style('fill', '#666')
      .text('P(' + eventName + ')');
    g.selectAll('sets')
      .data(dataList)
      .enter()
      .append('path')
      .attr('class', 'eventSets cor-chart')
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')')
      .attr('d', d => d.d)
      .style('fill', '#666')
      .style('fill-opacity', 0.2)
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        d3.selectAll(".eventSets")
          .style('stroke', dd => (d === dd) ? '#1866bb' : 'none')
        d3.selectAll('.eventNodes')
          .style('stroke', dd => ifAinB(dd.id, d.list) ? '#333' : 'none');
      })
      .on('mouseout', () => {
        d3.selectAll('.eventNodes').style('stroke', 'none');
        d3.selectAll('.eventSets').style('stroke', 'none');
      })
      .on('click', d => {
        d3.selectAll('.eventSets').attr('transform', dd => {
          return 'translate(' + dd.x + ',' + ((dd.list.length === d.list.length) ? r : r + (hh - 2 * marginY)) + ')';
        });
      });

    function ifAinB(a, b) {
      for (let i = 0; i < b.length; i++) {
        if (a === b[i]) return true;
      }
      return false;
    }

    function makePolygon(edgeNum, radius) {
      if (edgeNum === 1) return "M 0 0 m " + (-radius) + ", 0 a " + radius + "," + radius + " 0 1,0 " +
        radius * 2 + ",0 a" + radius + "," + radius + " 0 1,0 " + -radius * 2 + ",0";
      if (edgeNum === 2) {
        let wi = radius / 3,
          hi = radius;
        return "M" + -wi + "," + hi + "L" + wi + "," + hi + "L" + wi + "," + -hi + "L" + -wi + "," + -hi + "Z";
      }
      let angle = -Math.PI / 2,
        d = "";
      const deltaAngle = 2 * Math.PI / edgeNum;
      for (let i = 0; i <= edgeNum; i++) {
        d += (i === 0) ? "M" : "L";
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