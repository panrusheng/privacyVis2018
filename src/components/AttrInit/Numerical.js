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
    const [valueMin, valueMax] = d3.extent(values);
    const [labelMin, labelMax] = d3.extent(labels);
    const lDiff = labelMax - labelMin;
    const breakPoints = attr.breakPoints;
    const marginAxis = 15, marginLeft = 30;
    const chartWidth = width - marginAxis - marginLeft;

    dom.innerHTML = '';
    const xScale = d3
      .scaleLinear()
      .domain([0, labels.length - 1])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, valueMax])
      .range([height, marginAxis]);

    const area = d3
      .area()
      .x0(0)
      .y0(height)
      .y1(function (d) {
        return yScale(d);
      })
      .x(function (d, i) {
        return xScale(i);
      })
      .curve(d3.curveMonotoneX);

    const svg = d3
      .select(dom)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + marginLeft + ', 0)');
    
    let axis = svg
      .append('g')
      .attr('class', 'axis-ver')
      // .attr("transform", "translate(0," + height + ")")
      .call(
        d3.axisLeft(yScale)
      ).attr('x1', 0)
      .attr('y1', height)
      .attr('x2', 0)
      .attr('y2', 0);

    let backLines = svg.append('g').attr('class', 'bg-line')
      
    axis.selectAll('.tick').each(function() {
      let y = parseFloat(d3.select(this).attr("transform").split(/[\(\),]/g)[2]);
      backLines.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', y)
        .attr('y2', y)
        .style('stroke', '#ececec')
    })

    let breakIndex = 0;
    let lastWidth = 0;

    let eventNames = [];
    for (let eventName in this.props.eventUtilityList) eventNames.push(eventName);
    eventNames.sort((a, b) => this.props.eventUtilityList[a].min - this.props.eventUtilityList[b].min);
    let sortedBreakPoints = toJS(attr.breakPoints).sort((a, b) => a - b);
    
    for (let i = 0; i < eventNames.length; ++i) {
      let eventName = eventNames[i];
      let attrName = eventName.split(':')[0];
      if(attrName !== attr.attrName) continue;
      let { count } = this.props.eventUtilityList[eventName];

      let w;

      if (breakIndex < sortedBreakPoints.length) {
        w = (((sortedBreakPoints[breakIndex] - labelMin) / lDiff) * chartWidth) - lastWidth;
      } else {
        w = chartWidth - lastWidth;
      }

      svg.append("defs")
        .append('clipPath')
        .attr("id", attrName + breakIndex)
        .append('rect')
        .attr('x', lastWidth)
        .attr('y', 0)
        .attr('width', w)
        .attr('height', height)
      lastWidth += w;
      svg.append('path')
        .data([values])
        .attr('d', area)
        .style('fill', this.props.eventColorList[eventName])
        .style('opacity', attr.sensitive? 0.5 : 1)
        .attr('clip-path', `url(#${attrName + breakIndex})`)
        .on('mouseover', () => {
          if (attr.sensitive) return;
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
      .attr('cy', d => yScale(d))
      .attr('cx', (d, i) => xScale(i))
      .attr('r', d => { return d === 0 ? 0 : 2 })
      .style('fill', '#1866BB')
      .on('mouseover', (d, i) => {
        const x = d3.event.x + 15,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(chartThis.props.attr.attrName + '(' + data[i].label.toFixed(2) + '): ' + d)
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
      .attr("transform", "translate(0," + height + ")")
      .call(
        d3.axisBottom(
          d3
          .scaleLinear()
          .range([0, width - marginAxis - marginLeft])
          .domain([labelMin, labelMax])
        )
      ).attr('x1', 0)
      .attr('y1', height)
      .attr('x2', chartWidth + marginAxis)
      .attr('y2', height)

  
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
      .attr('x2', chartWidth + marginAxis)
      .attr('y1', height)
      .attr('y2', height)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);
    svg.append('text')
      .attr('x', chartWidth + marginAxis)
      .attr('y', height + 30)
      .style('text-anchor', 'end')
      .text('Value');

    svg.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', height)
      .attr('y2', 0)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);
    svg.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .text('Amount');

    // add break points to group attributes
    const chartThis = this;

    svg
      .append('g')
      .selectAll('line')
      .data(breakPoints)
      .enter()
      .append('line')
      .attr('y1', 5)
      .attr('y2', height)
      .attr('x1', d => ((d - labelMin) / lDiff * ((chartWidth - 2) / chartWidth) * xScale(values.length - 1)) + 1)
      .attr('x2', d => ((d - labelMin) / lDiff * ((chartWidth - 2) / chartWidth) * xScale(values.length - 1)) + 1)
      .style('stroke', '#333')
      .style('stroke-dasharray', '10 5')
      .attr('class', 'break-point')

    svg
      .append('g')
      .selectAll('text')
      .data(breakPoints)
      .enter()
      .append('text')
      .attr('y', () => 11)
      .attr('x', d => {
        return (d - labelMin) / lDiff * ((chartWidth - 2) / chartWidth) * xScale(values.length - 1) + 10;
      })
      .text(d => (d -parseInt(d) === 0) ? d : (d).toFixed(2))
      .style('text-anchor', 'start')
      .style('fill', '#333');

    svg
      .append('g')
      .selectAll('circle')
      .data(breakPoints)
      .enter()
      .append('circle')
      .attr('r', () => 5)
      .attr('cy', 5)
      .attr('cx', d => (d - labelMin) / lDiff * ((chartWidth - 2) / chartWidth) * xScale(values.length - 1) + 2)
      .attr('stroke', '#333')
      .attr('fill', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      // .on('click', (d, i) => {
      //   this.props.removeBreakPoint &&
      //     this.props.removeBreakPoint(this.props.attr.attrName, i);
      // })
      .on('contextmenu', (d, i) => {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        this.props.removeBreakPoint &&
          this.props.removeBreakPoint(this.props.attr.attrName, i);
      })
      .call(
        d3
          .drag()
          .on('drag', function (d, i) {
            const [x, y] = d3.mouse(dom);
            let value = ((x - marginLeft) / (chartWidth)) * lDiff + labelMin;

            if (value < labelMin) value = labelMin;
            if (value > labelMax) value = labelMax;

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
    const [ labelMin, labelMax ] = d3.extent(this.props.attr.data.map(({label}) => label));
    const width = this.props.width;
    const marginAxis = 15, marginLeft = 30;
    const chartWidth = width - marginAxis - marginLeft;

    switch (type) {
      case 'path':
        {
          const {
            left
          } = e.target.getBoundingClientRect();
          const x = e.clientX - left;
          point = (x / chartWidth) * (labelMax - labelMin) + labelMin;
          break;
        }
      case 'svg':
        {
          const x = e.clientX - e.target.getBoundingClientRect().left - 30;
          point = (x / chartWidth) * (labelMax - labelMin) + labelMin;
          break;
        }
      default:
        {
          point = -1;
        }
    }

    if (point > labelMin && point < labelMax) {
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
  width: 280,
  height: 900,
  breakPoints: [],
};