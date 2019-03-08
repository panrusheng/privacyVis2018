import React from 'react';
import * as d3 from 'd3';
import './Numerical.scss';
import { toJS } from 'mobx';

export default class Numerical extends React.Component {
  static defaultProps = {
    data: []
  };

  dragging = false;

  constructor(props) {
    super(props);

    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    const {
      attr,
      width,
      height,
    } = this.props;
    if (!attr || !this.chartDom) return;
    
    this.draw(this.chartDom, attr, width, height);
  }

  componentDidUpdate() {
    const {
      attr,
      width,
      height,
    } = this.props;
    if (!attr || !this.chartDom) return;

    this.draw(this.chartDom, attr, width, height);
  }

  draw(dom, attr, width, height) {
    let data = attr.data;

    const values = data.map(item => item.value);
    const labels = data.map(item => item.label);
    const breakPoints = attr.breakPoints; // break points range from 0 to 1
    const [valueMin, valueMax] = d3.extent(values);
    const [labelMin, labelMax] = d3.extent(labels);

    dom.innerHTML = '';
    const xScale = d3
      .scaleLinear()
      .domain([0, valueMax])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, values.length - 1])
      .range([0, height - 20]);

    const area = d3
      .area()
      .x0(0)
      .x1(function (d) {
        return xScale(d);
      })
      .y(function (d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);

    const svg = d3
      .select(dom)
      .attr('width', width)
      .attr('height', height)
      .append('g');

    let breakIndex = 0;
    let lastHeight = 0;

    for (let eventName in this.props.eventUtilityList) {
      let attrName = eventName.split(':')[0];
      if(attrName !== attr.attrName) continue;
      let { max, min, includeMin, count } = this.props.eventUtilityList[eventName];

      let areaData = [];
      values.forEach((v, index) => {
        if ((labels[index] > min || (includeMin && labels[index] === min) ) && labels[index] <= max) areaData.push(v);
      });
      
      let h;

      if (breakIndex < breakPoints.length) {
        //(d * ((height - 2) / height) * yScale(values.length - 1)) + 1
        h = (breakPoints[breakIndex] * yScale(values.length - 1)) - lastHeight;
      } else {
        h = height - 20 - lastHeight;
      }

      svg.append("defs")
        .append('clipPath')
        .attr("id", attrName + breakIndex)
        .append('rect')
        .attr('x', 0)
        .attr('y', lastHeight)
        .attr('width', width)
        .attr('height', h)
      lastHeight += h;
      svg.append('path')
        .data([values])
        .attr('d', area)
        .attr('fill', this.props.eventColorList[eventName])
        .attr('clip-path', `url(#${attrName + breakIndex})`)
        .on('mouseover', () => {
          const x = d3.event.x + 15,
            y = d3.event.y - 35;
          d3.select('.tooltip')
            .html(eventName + ': ' + count + '</br> Utility: ' + this.props.eventUtilityList[eventName].utility.toFixed(2) )
            .style('left', x + 'px')
            .style('top', y + 'px')
            .style('display', 'block');
        })
        .on('mouseout', () => {
          d3.select('.tooltip').style('display', 'none')
        });

      breakIndex++;
    }

    svg
      .selectAll('circle')
      .data(values)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d))
      .attr('cy', (d, i) => yScale(i))
      .attr('r', d => { return d === 0 ? 0 : 2 })
      // .style('stroke', '#1866BB')
      // .style('stroke-width', 2)
      .style('fill', '#1866BB')
      .on('mouseover', (d, i) => {
        const x = d3.event.x + 15,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(chartThis.props.attr.attrName + '(' + data[i].label + '): ' + d)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });

    svg
      .append('g')
      .attr('class', 'axis-ver')
      .call(
        d3.axisLeft(
          d3
            .scaleLinear()
            .range([0, height - 20])
            .domain([labelMin, labelMax])
        )
      );
  
    if (d3.selectAll('#biggerArrow'.length === 0)) {
      svg.append('defs').attr('class', 'axis-ver')
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
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', height - 2)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);

    // add break points to group attributes
    const chartThis = this;

    svg
      .append('g')
      .selectAll('line')
      .data(breakPoints)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => (d * ((height - 2) / height) * yScale(values.length - 1)) + 1)
      .attr('y2', d => (d * ((height - 2) / height) * yScale(values.length - 1)) + 1)
      .style('stroke', '#333')
      .style('stroke-dasharray', '10 5')
      .attr('class', 'breakpoint')
      .on('click', (d, i) => {
        d3.event.stopPropagation();
        this.props.removeBreakPoint &&
          this.props.removeBreakPoint(this.props.attr.attrName, i);
      })
      .attr('class', 'break-point')
      .call(
        d3
          .drag()
          .on('drag', function (d, i) {
            const [, y] = d3.mouse(dom);
            let value = y / height;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            chartThis.props.updateBreakPoint(
              chartThis.props.attr.attrName,
              i,
              value
            );
          })
      );

    svg
      .append('g')
      .selectAll('text')
      .data(breakPoints)
      .enter()
      .append('text')
      .attr('x', () => width - 6)
      .attr('y', d => {
        return d * ((height - 2) / height) * yScale(values.length - 1) - 2;
      })
      .text(d => (d * (labelMax - labelMin) + labelMin).toFixed(2))
      .style('text-anchor', 'end')
      .style('fill', '#333');

    svg
      .append('g')
      .selectAll('circle')
      .data(breakPoints)
      .enter()
      .append('circle')
      .attr('r', () => 5)
      .attr('cx', () => width)
      .attr('cy', d => d * ((height - 2) / height) * yScale(values.length - 1))
      .attr('stroke', '#333')
      .attr('fill', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (d, i) => {
        d3.event.stopPropagation();
        this.props.removeBreakPoint &&
          this.props.removeBreakPoint(this.props.attr.attrName, i);
      })
      .call(
        d3
          .drag()
          .on('drag', function (d, i) {
            const [, y] = d3.mouse(dom);
            let value = y / height;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            chartThis.props.updateBreakPoint(
              chartThis.props.attr.attrName,
              i,
              value
            );
          })
          .on('end', this.props.editGBN)
      );

  }

  handleChartClick(e) {
    const type = e.target.tagName;
    let point;

    switch (type) {
      case 'path':
        {
          const {
            height
          } = this.props;
          const {
            top
          } = e.target.getBoundingClientRect();
          const y = e.clientY - top;
          point = y / height;
          break;
        }
      case 'svg':
        {
          const {
            height,
          } = this.props;
          const y = e.clientY - e.target.getBoundingClientRect().top;
          point = y / height;
          break;
        }
      default:
        {
          point = -1;
        }
    }

    point = point.toFixed(2);

    if (point > 0 && point < 1) {
      this.props.addBreakPoint &&
        this.props.addBreakPoint(this.props.attr.attrName, point);
    }
  }

  render() {
    return (<div className="numerical-view">
      <
        svg ref={
          dom => (this.chartDom = dom)
        }
        onClick={
          this.handleChartClick
        }
      /> </div>
    );
  }
}

Numerical.defaultProps = {
  width: 300,
  height: 900,
  breakPoints: [],
};