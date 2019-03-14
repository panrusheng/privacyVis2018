import React from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';

export default class CateTrim extends React.Component {
  draw(dom, data, width, height, trimmed) {
    if (height === 0) return;
    dom.innerHTML = '';
    const dataValue = data.map(item => item.oriV);
    const marginAxis = 15, marginLeft = 30, chartWidth = width - marginAxis - marginLeft;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(...dataValue)])
      .range([0, height - marginAxis]);

    const svg = d3
      .select(dom)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + marginLeft + ', 0)');
    const rectWidth = (chartWidth) / data.length;

    for (let i = 0; i < data.length; i++) {
      let pattern = svg.append('pattern')
        .attr('id', 'trim-stripe'+ data[i].category)
        .attr('width', 4)
        .attr('height', 4)
        .attr('patternUnits', 'userSpaceOnUse');
      pattern.append('rect')
        .attr('width', 4)
        .attr('height', 4)
        .style('fill', '#d0e0f0');
      pattern.append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .style('stroke', '#333')
        .style('stroke-width', 1);
    }

    let rect = svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .enter();
    rect.append('rect')
      .style('fill', 'none')
      .style('stroke', '#1866BB')
      .style('stroke-width', 1)
      .attr('x', (d, i) => i * rectWidth)
      .attr('y', (d, i) => height - yScale(d.oriV))
      .attr('height', d => yScale(d.oriV))
      .attr('width', rectWidth)
      .on('mouseover', d => {
        const x = d3.event.x + 15 - marginLeft,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(d.category + ': ' + d.oriV + '/' + d.curV + '/' + trimmed ? '' : d.triV)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });
    
    // rect.append('rect')
    //   .style('fill', '#fff')
    //   .attr('x', 0)
    //   .attr('y', (d, i) => i * rectWidth)
    //   .attr('height', rectWidth)
    //   .attr('width', d => xScale(d.curV));
    rect.append('rect')
      .style('fill', '#d0e0f0')
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .attr('y', d => trimmed? (height - yScale(d.triV)) : (height - yScale(d.curV)))
      .attr('x', (d, i) => i * rectWidth)
      .attr('width', rectWidth)
      .attr('height', d => trimmed? yScale(d.triV) : yScale(d.curV));
    if (!trimmed)
      rect.append('rect')
      .style('fill', d => 'url(#trim-stripe' + d.category + ')')
      .style('stroke', 'none')
      .attr('y', (d, i) => height - yScale(d.curV))
      .attr('x', (d, i) => i * rectWidth)
      .attr('width', rectWidth)
      .attr('height', d => yScale(d.curV) - yScale(d.triV));

    // rect.append('rect')
    //   .style('fill', 'url(#trim-stripe)')
    //   .style('stroke', 'none')
    //   .attr('x', (d, i) => {
    //     return (width + xScale(d.triV)) / 2;
    //   })
    //   .attr('y', (d, i) => {
    //     return i * rectWidth;
    //   })
    //   .attr('height', rectWidth)
    //   .attr('width', d => xScale(d.curV - d.triV) / 2);

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
    svg
      .append('g')
      .attr('class', 'axis-ver')
      // .attr("transform", "translate(0," + height + ")")
      .call(
        d3.axisLeft(d3
          .scaleLinear()
          .domain([0, Math.max(...dataValue)])
          .range([height, marginAxis]))
      ).attr('x1', 0)
      .attr('y1', height)
      .attr('x2', 0)
      .attr('y2', 0)
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

    let textSvg = svg
      .append('g')
      .selectAll('text')
      .data(data)
      .enter();
    textSvg.append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('y', (d, i) => height + 5)
      .attr('x', (d, i) => i * rectWidth + rectWidth / 2)
      .style('text-anchor', 'middle')
      .text(d => d.category);
    textSvg.append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('y', (d, i) => height - yScale(d.oriV) - 20)
      .attr('x', (d, i) => i * rectWidth + rectWidth / 2)
      .style('text-anchor', 'middle')
      .text(d => d.oriV);
    textSvg.append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('y', (d, i) => yScale(d.triV) < 20 ? height - yScale(d.triV) - 20 : height - yScale(d.triV))
      .attr('x', (d, i) => i * rectWidth + rectWidth / 2)
      .style('text-anchor', 'middle')
      .text(d => (d.triV === d.oriV) ? "" : d.triV);
    svg.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('text-anchor', 'middle')
      .text('Amount');
    svg.append('text')
      .attr('x', chartWidth + marginAxis)
      .attr('y', height + 30)
      .style('text-anchor', 'end')
      .text('Category');

    if (trimmed) {
      svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', height)
      .style('fill', '#333')
      .style('opacity', 0.1);
    } else {
      textSvg.append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('y', (d, i) => yScale(d.curV) < 20 ? height - yScale(d.curV) - 20 : height - yScale(d.curV))
      .attr('x', (d, i) => i * rectWidth + rectWidth / 2)
      .style('text-anchor', 'middle')
      .text(d => (d.curV === d.triV || d.curV === d.oriV) ? "" : d.curV);
    }
  }

  componentDidMount() {
    const {
      data,
      width,
      height,
      trimmed,
    } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, trimmed);
  }

  componentDidUpdate() {
    const {
      data,
      width,
      height,
      trimmed,
    } = this.props;
    this.draw(this.chartDom, data, width, height, trimmed);
  }

  render() {
    return ( <div className = "categorical-view" style={{textAlign: "center"}} >
      <svg ref = {
        dom => {
          this.chartDom = dom;
        }
      } /> </div>
    );
  }
}

CateTrim.defaultProps = {
  width: 300,
  height: 900,
};