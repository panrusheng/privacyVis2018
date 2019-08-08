import React from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';

export default class NumeTrim extends React.Component {
  constructor(props) {
    super(props);

  }

  componentDidMount() {
    const {
      data,
      width,
      height,
      trimmed,
      attrName
    } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, attrName, trimmed);
  }

  componentDidUpdate() {
    const {
      data,
      width,
      height,
      attrName,
      trimmed
    } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, attrName, trimmed);
  }

  draw(dom, data, width, height, attrName, trimmed) {
    const oriV = data.map(item => item.oriV);
    const curV = data.map(item => item.curV);
    const labels = data.map(item => item.label);
    const marginAxis = 15, marginLeft = 30;
    const chartWidth = width - marginAxis - marginLeft;
    dom.innerHTML = '';

    const xScale = d3
      .scaleLinear()
      .domain([0, labels.length - 1])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(...oriV)])
      .range([height, marginAxis]);

    const line = d3
      .line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const area = d3
      .area()
      .x0(0)
      .y0(height)
      .x((d, i) => xScale(i))
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX);

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
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + marginLeft + ', 0)');

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

    svg
      .append('g')
      .attr('class', 'axis-ver')
      .attr("transform", "translate(0," + height + ")")
      .call(
        d3.axisBottom(
          d3
            .scaleLinear()
            .range([0, width - marginAxis - marginLeft])
            .domain(d3.extent(labels))
        )
      ).attr('x1', 0)
      .attr('y1', height)
      .attr('x2', chartWidth + marginAxis)
      .attr('y2', height)
    svg.append('text')
      .attr('x', chartWidth + marginAxis)
      .attr('y', height + 30)
      .style('text-anchor', 'end')
      .text('Value');
    let axis = svg
      .append('g')
      .attr('class', 'axis-ver')
      // .attr("transform", "translate(0," + height + ")")
      .call(
        d3.axisLeft(yScale)
      ).attr('x1', 0)
      .attr('y1', height)
      .attr('x2', 0)
      .attr('y2', 0)
    svg.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .text('Amount');

    let backLines = svg.append('g');

    axis.selectAll('.tick').each(function () {
      let y = parseFloat(d3.select(this).attr("transform").split(/[\(\),]/g)[2]);
      backLines.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', y)
        .attr('y2', y)
        .style('stroke', '#ececec')
    })
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
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth + marginAxis)
      .attr('y1', height)
      .attr('y2', height)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', height)
      .attr('y2', 0)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);

    // svg
    //   .append('path')
    //   .attr('d', areaNeg(curV))
    //   .style('stroke', 'none')
    //   .style('fill', 'url(#trim-stripe)');
    if (!trimmed) {
      svg
        .append('path')
        .attr('d', area(curV))
        .style('stroke', 'none')
        .style('fill', 'url(#trim-stripe)');
    }
    const triV = data.map(item => item.triV);
    svg.append('path')
      .attr('d', area(triV))
      .style('stroke', 'none')
      .style('fill', '#d0e0f0');

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
      .attr('cy', d => yScale(d.oriV))
      .attr('cx', (d, i) => xScale(i))
      .attr('r', d => { return d.oriV === 0 ? 0 : 2 })
      // .style('stroke', '#1866BB')
      // .style('stroke-width', 2)
      .style('fill', '#1866BB')
      .on('mouseover', d => {
        const x = d3.event.x + 15 - marginLeft,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(attrName + '(' + d.label + '): ' + d.oriV + '/' + d.curV + '/' + trimmed ? '' : d.triV)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });

    if (trimmed) {
      svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', chartWidth)
        .attr('height', height)
        .style('fill', '#333')
        .style('opacity', 0.1);
    }
  }

  render() {
    return (<div className="numerical-view" style={{
      width: 800,
      textAlign: "center"
    }}>
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
};