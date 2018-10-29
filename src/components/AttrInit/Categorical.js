import React from 'react';
import * as d3 from 'd3';
import { toJS } from 'mobx';

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

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('fill', 'aliceblue')
      .attr('stroke', '#e0e8ff')
      .attr('stroke-width', '1')
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
      });
  }

  static getMockData() {
    function randomInt(lower, upper) {
      return Math.round(Math.random() * (upper - lower) + lower);
    }

    let data = [];
    for (let i = 0; i < 30; ++i) {
      data.push({
        category: randomInt(0, 1000000).toString(36),
        value: randomInt(200, 1000)
      });
    }

    return {
      attrName: randomInt(0, 10000).toString(36),
      type: 'categorical',
      data
    };
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
