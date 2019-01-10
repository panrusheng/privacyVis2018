import React from 'react';
import * as d3 from 'd3';
import './Numerical.scss';
import normalize from '../../utils/normalize';

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
    const labels = attr.data.map(item => item.label);
    const breakPoints = attr.breakPoints;
    // const breakPoints = [0.1, 0.3, 0.5, 0.9];
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

    const lineGraph = svg
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

    const axisElem = svg
      .append('g')
      .attr('class', 'axis-ver')
      .call(
        d3.axisLeft(
          d3
            .scaleLinear()
            .range([0, height])
            .domain([Math.min(...labels), Math.max(...labels)])
        )
      )
      .attr('transform', `translate(${width / 2 + 2}, 0)`);
    axisElem.select('.domain').attr('transform', 'translate(-3, 0)');

    // add break points to group attributes
    const chartThis = this;

    svg
      .append('g')
      .selectAll('rect')
      .data(breakPoints)
      .enter()
      .append('rect')
      .attr('fill', '#777C83')
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('x', () => {
        return 0;
      })
      .attr('y', d => {
        return d * ((height - 2) / height) * yScale(data.length - 1);
      })
      .attr('height', 4)
      .attr('width', width)
      .attr('stroke-width', 2)
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
          .on('start', function(d, i) {
            chartThis.dragging = true;
            d3.select(this).classed('active', true);
            console.log('start');
          })
          .on('end', function(d, i) {
            chartThis.dragging = false;
            d3.select(this).classed('active', false);
            console.log('end');
          })
          .on('drag', function(d, i) {
            const [, y] = d3.mouse(dom);
            let value = (y - margin.top) / (height - margin.top);
            if (value < 0) value = 0;
            if (value > 1) value = 1;
            console.log(d3.select(this).attr('class'));

            chartThis.props.updateBreakPoint(
              chartThis.props.attr.attrName,
              i,
              value
            );
          })
      );
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
    const type = e.target.tagName;
    let point;

    switch (type) {
      case 'path': {
        const { height } = this.props;
        const { top } = e.target.getBoundingClientRect();
        const y = e.clientY - top;
        point = y / height;
        break;
      }
      case 'svg': {
        const {
          height,
          margin: { top }
        } = this.props;
        const y = e.clientY - e.target.getBoundingClientRect().top;
        point = (y - top) / height;
        break;
      }
      default: {
        point = -1;
      }
    }

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
