import React from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';

export default class NumeTrim extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidMount() {
    const {
      data,
      width,
      height,
      margin,
      trimmed,
      attrName
    } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, margin, attrName, trimmed);
  }

  componentDidUpdate() {
    const {
      data,
      width,
      height,
      margin,
      attrName,
      trimmed
    } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, margin, attrName, trimmed);
  }

  draw(dom, data, width, height, margin, attrName, trimmed) {
    const oriV = data.map(item => item.oriV);
    const curV = data.map(item => item.curV);
    const labels = data.map(item => item.label);
    dom.innerHTML = '';
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(...oriV)])
      .range([0, width - 25]);

    const yScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, height - 20]);

    const line = d3
      .line()
      .x(d => xScale(d))
      .y((d, i) => yScale(i))
      .curve(d3.curveMonotoneY);

    const area = d3
      .area()
      .x0(0)
      .x1(d => xScale(d))
      .y((d, i) => yScale(i))
      .curve(d3.curveMonotoneY);

    // const lineNeg = d3
    //   .line()
    //   .x(d => xScale(-d))
    //   .y((d, i) => yScale(i))
    //   .curve(d3.curveMonotoneY);

    // const areaNeg = d3
    //   .area()
    //   .x0(width / 2)
    //   .x1(d => xScale(-d))
    //   .y((d, i) => yScale(i))
    //   .curve(d3.curveMonotoneY);

    const svg = d3
      .select(dom)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + (margin.left + 25) + ',' + (margin.top * 1.5) + ')');

    if (d3.selectAll('#trim-stripe'.length === 0)) {
      let pattern = svg.append('pattern')
        .attr('id', 'trim-stripe')
        .attr('width', 4)
        .attr('height', 4)
        .attr('patternUnits', 'userSpaceOnUse');
      pattern.append('rect')
        .attr('width', 4)
        .attr('height', 4)
        .style('fill', '#d0e0f0')
      pattern.append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .style('stroke', '#333')
        .style('stroke-width', 1);
    }

    svg
      .append('path')
      .attr('d', area(curV))
      .style('stroke', 'none')
      .style('fill', trimmed? '#d0e0f0':'url(#trim-stripe)');
    // svg
    //   .append('path')
    //   .attr('d', areaNeg(curV))
    //   .style('stroke', 'none')
    //   .style('fill', 'url(#trim-stripe)');
    if (!trimmed) {
      const triV = data.map(item => item.triV);
      svg.append('path')
        .attr('d', area(triV))
        .style('stroke', 'none')
        .style('fill', '#d0e0f0');
    }
    
    // svg.append('path')
    //   .attr('d', areaNeg(triV))
    //   .style('stroke', 'none')
    //   .style('fill', '#d0e0f0');

    svg
      .append('path')
      .attr('class', 'line')
      .attr('d', line(oriV))
      .style('stroke', '#1866BB')
      .style('fill', 'none')
      .style('stroke-width', 1);

    // svg
    //   .append('path')
    //   .attr('class', 'line')
    //   .attr('d', lineNeg(oriV))
    //   .style('stroke', '#1866BB')
    //   .style('fill', 'none')
    //   .style('stroke-width', 1);

    svg
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.oriV))
      .attr('cy', (d, i) => yScale(i))
      .attr('r', d => {return d.oriV === 0 ? 0: 2})
      // .style('stroke', '#1866BB')
      // .style('stroke-width', 2)
      .style('fill', '#1866BB')
      .on('mouseover', d => {
        const x = d3.event.x + 15 - margin.left,
          y = d3.event.y - 35 - margin.top;
        d3.select('.tooltip').html(attrName + '(' + d.label + '): ' + d.oriV + '/' + d.curV + '/' + trimmed ? '' : d.triV)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });

    const axisElem = svg
      .append('g')
      .attr('class', 'axis-ver')
      .call(
        d3.axisLeft(
          d3
            .scaleLinear()
            .range([0, height - 20])
            .domain([Math.min(...labels), Math.max(...labels)])
        )
      )
      .attr('transform', `translate(0, 0)`);
    axisElem.select('.domain').attr('transform', 'translate(-3, 0)');

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

    if (trimmed) {
      svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .style('fill', '#333')
      .style('opacity', 0.1);
    }
  }

  render() {
    return (<div className="numerical-view">
      <
        svg ref={
          dom => (this.chartDom = dom)
        }
      /> </div>
    );
  }
}

NumeTrim.defaultProps = {
  width: 300,
  height: 900,
  margin: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
};