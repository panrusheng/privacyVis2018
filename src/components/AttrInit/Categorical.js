import React from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';
import './Categorical.scss';

export default class Categorical extends React.Component {
  draw(dom, attr, width, height) {
    const data = toJS(attr.groups);
    const attrName = attr.attrName;
    const openMenu = this.props.openMenu;
    dom.innerHTML = '';
    const dataValue = data.map(item => item.value);
    // const n = dataValue.length + 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(...dataValue)])
      .range([0, height]);

    const svg = d3
      .select(dom)
      .attr('width', width)
      .attr('height', height)
      .append('g');
    const rectWidth = width / data.length;

    let colorDic = this.props.eventColorList;
    let uilityDic = this.props.eventUtilityList;
    
    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .style('fill', (d) => colorDic[attrName + ': ' + d.name])
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .attr('x', (d, i) => {
        return i * rectWidth;
      })
      .attr('y', (d, i) => {
        return height - yScale(d.value);
      })
      .attr('height', d => yScale(d.value))
      .attr('width', rectWidth)
      .on('click', function (d, i) {
        openMenu && openMenu(data[i], attrName, d3.event);
      })
      .on('mouseover', d => {
        const x = d3.event.x + 15,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(d.name + ': ' + d.value + '</br> Utility: ' 
          + uilityDic[attrName + ': ' + d.name].utility.toFixed(2))
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      });

    // const axisElem = svg
    //   .append('g')
    //   .attr('class', 'axis-ver')
    //   .call(d3.axisLeft(yScale))
    //   .attr('transform', `translate(${width / 2}, 0)`);

    // axisElem.selectAll('text').remove();
    // axisElem.selectAll('.tick').remove();
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
      .attr('x2', width)
      .attr('y1', height)
      .attr('y2', height)
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
      .attr('y', (d, i) => height - yScale(d.value))
      .attr('x', (d, i) => i * rectWidth + (rectWidth - 18) / 2)
      .style('text-anchor', 'start')
      .text(d => d.name);
  }

  componentDidMount() {
    const { attr, width, height } = this.props;
    if (!attr || !this.chartDom) return;

    this.draw(this.chartDom, attr, width, height );
  }

  componentDidUpdate() {
    const { attr, width, height } = this.props;
    this.draw(this.chartDom, attr, width, height );
  }

  render() {
    if (this.props.height === 0) return (<div />);
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

Categorical.defaultProps = {
  width: 300,
  height: 900,
};
