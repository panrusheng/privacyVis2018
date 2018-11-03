import React from 'react';
import * as d3 from 'd3';
import './Numerical.scss';
import normalize from '../../utils/normalize';

export default class Numerical extends React.Component {
  static defaultProps = {
    data: []
  };

  constructor(props) {
    super(props);

    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    const { attr, width, height, margin } = this.props;
    if (!attr || !this.chartDom) return;

    this.draw(this.chartDom, attr, width, height, margin);
  }

  componentDidUpdate() {
    const { attr, width, height, margin } = this.props;
    if (!attr || !this.chartDom) return;

    this.draw(this.chartDom, attr, width, height, margin);
  }

  draw(dom, attr, width, height, margin) {
    const data = normalize(attr.data.map(item => item.value));
    const breakPoints = attr.breakPoints;
    dom.innerHTML = '';

    const xScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([width, 0]);

    const yScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, height]);

    const line = d3
      .line()
      .x(function(d) {
        return xScale(d);
      })
      .y(function(d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);
    const area = d3
      .area()
      .x0(width / 2)
      .x1(function(d) {
        return xScale(d);
      })
      .y(function(d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);
    const lineNeg = d3
      .line()
      .x(d => xScale(-d))
      .y((d, i) => yScale(i))
      .curve(d3.curveMonotoneY);
    const areaNeg = d3
      .area()
      .x0(width / 2)
      .x1(function(d) {
        return xScale(-d);
      })
      .y(function(d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);

    const svg = d3
      .select(dom)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg
      .append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);

    svg
      .append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', lineNeg);

    svg
      .append('path')
      .data([data])
      .attr('class', 'area')
      .attr('d', area);
    svg
      .append('path')
      .data([data])
      .attr('class', 'area')
      .attr('d', areaNeg);
  }

  static getMockData() {
    function randomInt(lower, upper) {
      return Math.round(Math.random() * (upper - lower) + lower);
    }

    let data = [];
    for (let i = 0; i < 30; ++i) {
      let d = new Date(
        randomInt(1900, 2018),
        randomInt(1, 12),
        randomInt(1, 27)
      );

      data.push({
        label: d.toDateString(),
        value: randomInt(0, 1000)
      });
    }

    return {
      attrName: randomInt(0, 1000).toString(36),
      type: 'numerical',
      data
    };
  }

  handleChartClick(e) {
    const {
      height,
      width,
      margin: { top, bottom, left, right }
    } = this.props;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.
    const point = y / (height - top - bottom);
    if (point > 0 && point < 1) {
      this.props.addBreakPoint &&
        this.props.addBreakPoint(this.props.attr.attrName, point);
    }
  }

  render() {
    return (
      <div className="numberical-view">
        <svg
          ref={dom => (this.chartDom = dom)}
          onClick={this.handleChartClick}
        />
      </div>
    );
  }
}

Numerical.defaultProps = {
  data: Numerical.getMockData(),
  width: 300,
  height: 900,
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
  breakPoints: [],
  addBreakPoints: console.log
};
