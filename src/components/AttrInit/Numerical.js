import React from 'react';
import * as d3 from 'd3';
import './Numerical.scss';

function decimalPrecision(numbers) {
  let res = 0;
  
  for (let number of numbers) {
    let n = number.toString().split('.')[1];
    if (!n) continue;
    if (n.length > res) res = n.length;
  }

  return res;
}


function dataPreprocess(data) {
  data.sort((a, b) => a.label - b.label);
  const labels = data.map(item => item.label);
  const [labelMin, labelMax] = d3.extent(labels);

  let minInterval = -1;
  for (let i = 1; i < labels.length; ++i) {
    if (minInterval < 0 || labels[i] - labels[i - 1] < minInterval) minInterval = labels[i] - labels[i - 1];
  }

  let binNum = Math.ceil((labelMax - labelMin) / minInterval);
  let interval = minInterval;
  
  if (binNum > 50) {
    binNum = 50;
    interval = (labelMax - labelMin) / binNum;
  }

  const newData = [{ label: labelMin, value: 0 }];
  const numD = decimalPrecision(labels);

  let index = 0;
  for (let i = 0; i < binNum; ++i) {
    // [start, end) if i < binNum - 1
    // [start, end] if i == binNum - 1
    let start = i * interval + labelMin;
    let end = (i + 1) * interval + labelMin;
    let label = ((start + end) / 2).toFixed(numD);
    let value = 0;
    while (index < data.length &&
      ((i < binNum - 1 && data[index].label >= start && data[index].label < end) ||
      (i === binNum - 1 && data[index].label >= start && data[index].label <= end ))) {
        value += data[index].value;
        index++;
    }

    newData.push({ label, value });
  }

  newData.push({ label: labelMax, value: 0 });

  console.log(interval, newData);
  return newData;
}

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
    data = dataPreprocess(data);

    const values = data.map(item => item.value);
    const labels = data.map(item => item.label);
    const breakPoints = attr.breakPoints; // break points range from 0 to 1
    const [valueMin, valueMax] = d3.extent(values);
    const [labelMin, labelMax] = d3.extent(labels);

    dom.innerHTML = '';
    const xScale = d3
      .scaleLinear()
      .domain([-valueMax, valueMax])
      .range([width, 0]);

    const yScale = d3
      .scaleLinear()
      .domain([0, values.length - 1])
      .range([0, height - 20]);

    const line = d3
      .line()
      .x(function (d) {
        return xScale(d);
      })
      .y(function (d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);

    const area = d3
      .area()
      .x0(width / 2)
      .x1(function (d) {
        return xScale(d);
      })
      .y(function (d, i) {
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
      .x1(function (d) {
        return xScale(-d);
      })
      .y(function (d, i) {
        return yScale(i);
      })
      .curve(d3.curveMonotoneY);

    const svg = d3
      .select(dom)
      .attr('width', width)
      .attr('height', height)
      .append('g');

    svg
      .append('path')
      .datum(values)
      .attr('class', 'line')
      .attr('d', line);

    svg
      .append('path')
      .datum(values)
      .attr('class', 'line')
      .attr('d', lineNeg);

    svg
      .append('path')
      .data([values])
      .attr('class', 'area')
      .attr('d', area);
    svg
      .append('path')
      .data([values])
      .attr('class', 'area')
      .attr('d', areaNeg);

    svg
      .selectAll('circle')
      .data(values)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(-d))
      .attr('cy', (d, i) => yScale(i))
      .attr('r', d => { return d === 0 ? 0 : 2 })
      // .style('stroke', '#1866BB')
      // .style('stroke-width', 2)
      .style('fill', '#1866BB')
      .on('mouseover', (d, i) => {
        const x = d3.event.x + 15,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(chartThis.props.attr.attrName + '(' + data[i].label + '): ' + d)
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
      .attr('transform', `translate(${width / 2 + 2}, 0)`);
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
      .attr('x1', width / 2)
      .attr('x2', width / 2)
      .attr('y1', 0)
      .attr('y2', height - 2)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);

    // add break points to group attributes
    const chartThis = this;

    svg
      .append('g')
      .selectAll('line')
      .data(breakPoints)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => (d * ((height - 2) / height) * yScale(values.length - 1)) + 1)
      .attr('y2', d => (d * ((height - 2) / height) * yScale(values.length - 1)) + 1)
      .style('stroke', '#333')
      .style('stroke-dasharray', '10 5')
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
          .on('drag', function (d, i) {
            const [, y] = d3.mouse(dom);
            let value = y / height;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            chartThis.props.updateBreakPoint(
              chartThis.props.attr.attrName,
              i,
              value
            );
          })
      );

    svg
      .append('g')
      .selectAll('text')
      .data(breakPoints)
      .enter()
      .append('text')
      .attr('x', () => width - 6)
      .attr('y', d => {
        return d * ((height - 2) / height) * yScale(values.length - 1) - 2;
      })
      .text(d => (d * (labelMax - labelMin) + labelMin).toFixed(2))
      .style('text-anchor', 'end')
      .style('fill', '#333');

    svg
      .append('g')
      .selectAll('circle')
      .data(breakPoints)
      .enter()
      .append('circle')
      .attr('r', () => 5)
      .attr('cx', () => width)
      .attr('cy', d => d * ((height - 2) / height) * yScale(values.length - 1))
      .attr('stroke', '#333')
      .attr('fill', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (d, i) => {
        d3.event.stopPropagation();
        this.props.removeBreakPoint &&
          this.props.removeBreakPoint(this.props.attr.attrName, i);
      })
      .call(
        d3
          .drag()
          .on('drag', function (d, i) {
            const [, y] = d3.mouse(dom);
            let value = y / height;
            if (value < 0) value = 0;
            if (value > 1) value = 1;

            chartThis.props.updateBreakPoint(
              chartThis.props.attr.attrName,
              i,
              value
            );
          })
      );

  }

  handleChartClick(e) {
    const type = e.target.tagName;
    let point;

    switch (type) {
      case 'path':
        {
          const {
            height
          } = this.props;
          const {
            top
          } = e.target.getBoundingClientRect();
          const y = e.clientY - top;
          point = y / height;
          break;
        }
      case 'svg':
        {
          const {
            height,
          } = this.props;
          const y = e.clientY - e.target.getBoundingClientRect().top;
          point = y / height;
          break;
        }
      default:
        {
          point = -1;
        }
    }

    point = point.toFixed(2);

    if (point > 0 && point < 1) {
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
  width: 300,
  height: 900,
  breakPoints: [],
};