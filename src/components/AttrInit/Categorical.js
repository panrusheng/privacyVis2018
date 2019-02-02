import React from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';
import './Categorical.scss';

export default class Categorical extends React.Component {
  draw(dom, attr, width, height, margin) {
    const data = toJS(attr.groups);
    const attrName = attr.attrName;
    const openMenu = this.props.openMenu;
    dom.innerHTML = '';
    const dataValue = data.map(item => item.value);
    const n = dataValue.length + 1;
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(...dataValue)])
      .range([0, width]);

    const svg = d3
      .select(dom)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const rectWidth = height / data.length;

    const yScale = d3
      .scaleLinear()
      .domain([0, height])
      .range([0, height]);
    
    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .style('fill', 'aliceblue')
      .style('stroke', '#1866BB')
      .style('stroke-width', 1)
      .attr('x', (d, i) => {
        return (width - xScale(d.value)) / 2;
      })
      .attr('y', (d, i) => {
        return i * rectWidth;
      })
      .attr('height', rectWidth)
      .attr('width', d => xScale(d.value))
      .on('click', function(d, i) {
        openMenu && openMenu(data[i], attrName, d3.event);
      })
      .on('mouseover', d => {
        const x = d3.event.x - 10 - margin.left,
          y = d3.event.y - 155 - margin.top;
          d3.select('.tooltip').html(d.name+ ': '  + d.value)	
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
      .call(d3.axisLeft(yScale))
      .attr('transform', `translate(${width / 2}, 0)`);

    axisElem.selectAll('text').remove();
    axisElem.selectAll('.tick').remove();

    svg
      .append('g')
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .style('fill', '#333')
      .attr('dominant-baseline', 'text-before-edge')
      .attr('x', (d, i) => width / 2 + 10)
      .attr('y', (d, i) => i * rectWidth + (rectWidth - 18) / 2)
      .text(d => d.name);
  }

  componentDidMount() {
    const { attr, width, height, margin } = this.props;
    if (!attr || !this.chartDom) return;

    this.draw(this.chartDom, attr, width, height, margin);
  }

  componentDidUpdate() {
    const { attr, width, height, margin } = this.props;
    this.draw(this.chartDom, attr, width, height, margin);
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

Categorical.defaultProps = {
  width: 300,
  height: 900,
  margin: { top: 10, right: 10, bottom: 10, left: 10 }
};
