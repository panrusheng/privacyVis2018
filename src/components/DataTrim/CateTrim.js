import React from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';

export default class CateTrim extends React.Component {
  draw(dom, data, width, height, margin) {
    dom.innerHTML = '';
    const dataValue = data.map(item => item.oriV);
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(...dataValue)])
      .range([0, width]);

    const svg = d3
      .select(dom)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + (margin.top * 2) + ')');
    const rectWidth = (height - 20) / data.length;

    if (d3.selectAll('#trim-stripe'.length == 0)) {
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

    let rect = svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .enter();
    rect.append('rect')
      .style('fill', '#fff')
      .style('stroke', '#1866BB')
      .style('stroke-width', 1)
      .attr('x', (d, i) => {
        return (width - xScale(d.oriV)) / 2;
      })
      .attr('y', (d, i) => {
        return i * rectWidth;
      })
      .attr('height', rectWidth)
      .attr('width', d => xScale(d.oriV))
      .on('mouseover', d => {
        const x = d3.event.x + 15 - margin.left,
          y = d3.event.y - 35 - margin.top;
        d3.select('.tooltip').html(d.name + ': ' + d.oriV + '/' + d.curV + '/' + d.triV)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });

    rect.append('rect')
      .style('fill', '#d0e0f0')
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .attr('x', (d, i) => {
        return (width - xScale(d.curV)) / 2;
      })
      .attr('y', (d, i) => {
        return i * rectWidth;
      })
      .attr('height', rectWidth)
      .attr('width', d => xScale(d.curV));

    rect.append('rect')
      .style('fill', 'url(#trim-stripe)')
      .style('stroke', 'none')
      .attr('x', (d, i) => {
        return (width - xScale(d.curV)) / 2;
      })
      .attr('y', (d, i) => {
        return i * rectWidth;
      })
      .attr('height', rectWidth)
      .attr('width', d => xScale(d.curV - d.triV) / 2);

    rect.append('rect')
      .style('fill', 'url(#trim-stripe)')
      .style('stroke', 'none')
      .style('stroke', 'none')
      .attr('x', (d, i) => {
        return (width + xScale(d.triV)) / 2;
      })
      .attr('y', (d, i) => {
        return i * rectWidth;
      })
      .attr('height', rectWidth)
      .attr('width', d => xScale(d.curV - d.triV) / 2);

    if (d3.selectAll('#biggerArrow'.length == 0)) {
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
      .attr('x1', width / 2)
      .attr('x2', width / 2)
      .attr('y1', 0)
      .attr('y2', height - 2)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);

    svg
      .append('g')
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('x', (d, i) => width / 2 - 5)
      .attr('y', (d, i) => i * rectWidth + (rectWidth - 18) / 2)
      .style('text-anchor', 'end')
      .text(d => d.name);
  }

  componentDidMount() {
    const { data, width, height, margin } = this.props;
    if (!data || !this.chartDom) return;

    this.draw(this.chartDom, data, width, height, margin);
  }

  componentDidUpdate() {
    const { data, width, height, margin } = this.props;
    this.draw(this.chartDom, data, width, height, margin);
  }

  render() {
    return (
      <div className="categorical-view">
        <svg
          ref={dom => {
            this.chartDom = dom;
          }}
        />
      </div>
    );
  }
}

CateTrim.defaultProps = {
  width: 300,
  height: 900,
  margin: { top: 10, right: 10, bottom: 10, left: 10 }
};
