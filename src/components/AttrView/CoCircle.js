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
    showP: false,
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
    eventName = (eventName === null) ? this.props.store.sensitiveEventList[0] : eventName;
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
    let range = d3.extent(data, d => d.cor);
    if (that.state.showP) {
      range[0] = (range[0] > pro) ? pro : range[0];
      range[1] = (range[1] < pro) ? pro : range[1];
    } else {
      range[0] = (range[0] < safeRange[1] && range[0] > safeRange[0])? safeRange[1]: range[0];
      range[1] = (range[1] > safeRange[0] && range[1] < safeRange[1])? safeRange[0]: range[1];
    }
    if (range[0] === range[1]) return;
    const ScaleX = d3
      .scaleLinear()
      .domain(range)
      .range([marginX, ww - 3 * marginX]);
    let dataList = [];
    for (let i = 0; i < data.length; i++) {
      let p = data[i].cor;
      if (p <= pro + riskLimit && p >= pro - riskLimit) continue;
      let x = ScaleX(p),
        y = r + Math.random() * (hh - 2 * marginY),
        num = data[i].eventLists.length;
      dataList.push({
        d: makePolygon(num, r),
        x,
        y,
        list: data[i].eventLists
      })
    }
    safeRange = safeRange.map((d) => {
      return d > range[1] ? range[1] : d
    });
    safeRange = safeRange.map((d) => {
      return d < range[0] ? range[0] : d
    });
    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);
    d3.selectAll('.cor-chart').remove();
    g.append('g')
      .attr('class', 'cor-chart')
      .attr('transform', 'translate(0,' + (hh - marginY) + ')')
      .call(d3.axisBottom(ScaleX));

    g.append('rect')
      .attr('class', 'cor-chart')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', ww)
      .attr('height', hh)
      .style('opacity', 0)
      .style('cursor', 'pointer')
      .on('click', () => {
        that.setState({showP: !that.state.showP});
      });
    g.append('rect')
      .attr('class', 'cor-chart')
      .attr('x', ScaleX(safeRange[0]))
      .attr('y', 0)
      .attr('width', ScaleX(safeRange[1]) - ScaleX(safeRange[0]))
      .attr('height', hh - marginY)
      .style('fill', '#cdcdcd');
    g.append('line')
      .attr('class', 'cor-chart')
      .attr('x1', ScaleX(pro))
      .attr('x2', ScaleX(pro))
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
      .attr('x', ScaleX(pro) + 5)
      .attr('y', hh - marginY - 10)
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
          .style('stroke', dd => (d === dd)? '#1866bb' : 'none')
        d3.selectAll('.eventNodes')
          .style('stroke', dd => ifAinB(dd.id, d.list) ? '#333' : 'none');
      })
      .on('mouseout', () => {
        d3.selectAll('.eventNodes').style('stroke', 'none');
        d3.selectAll('.eventSets').style('stroke', 'none');
      })

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
      let angle = 0,
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