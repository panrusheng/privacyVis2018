import React from 'react';
import { inject, observer } from 'mobx-react';
import './ModelView.scss';
import * as d3 from 'd3';
import { Select, Button, InputNumber, Input, Menu } from 'antd';
// import { toJS } from 'mobx';
const Option = Select.Option;
@inject(['store'])
@observer
export default class ModelView extends React.Component {
  state = {
    model: 'knn',
  };
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const comparison = this.props.store.comparison;
    const width = 500, height = 300, marginLeft = 150, margin = 20, marginTop = 50;
    const gap = 10, hh = (height - marginTop * 2) / 5 - gap;
    const text = ['#Occurrences', '#Positives', '(original dataset)', '#True positives',
      '(original dataset)', '#Positives', '(processed dataset)', '#True positives', '(processed dataset)'];
    for (let i = 0; i < comparison.length; i++) {
      const data = comparison[i];
      const canvas = d3.select('#bar-chart' + i).append('g').attr('width', width).attr('height', height);
      const barChart = canvas.append('g').attr("transform", "translate(" + marginLeft + "," + marginTop + ")");
      const max = Math.max(data.oriD, data.oriC, data.proC);
      const scaleX = d3.scaleLinear().domain([0, max]).range([0, width - margin - marginLeft]).nice();
      const tickX = scaleX.ticks(5);
      const bars = [data.oriD, data.oriC, data.oriC * data.oriT, data.proC, data.proC * data.proT];
      canvas.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .style('text-anchor', 'middle')
        .style('font-size', 20)
        .text(data.eventName);
      barChart.selectAll('bars')
        .data(bars)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * hh + (i + 1) * gap)
        .attr('width', d => scaleX(d))
        .attr('height', hh)
        .style('fill', (d, i) => (i === 0) ? '#d0e0f0' : (i % 2) ? '#dedede' : 'rgba(254,41,1, 0.3)')
        .style('stroke', '#fff');

      if (d3.selectAll('#arrow-axis'.length == 0)) {
        barChart.append('defs')
          .append('marker')
          .attr('id', 'arrow-axis')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 5)
          .attr('refY', 0)
          .attr('markerWidth', 5)
          .attr('markerHeight', 5)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-4L10,0L0,4L3,0');
      }
      barChart.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', height - 2 * marginTop)
        .style('stroke', '#666')
        .style('stroke-width', 2);
      barChart.selectAll('text')
        .data(text)
        .enter()
        .append('text')
        .attr('x', -5)
        .attr('y', (d, i) => (i === 0) ? hh : (gap + hh) * (i + i % 2) / 2 + (i % 2 ? hh - 7 : hh + 7))
        .style('text-anchor', 'end')
        .text(d => d);
      barChart.append('line')
        .attr('x1', 0)
        .attr('y1', height - 2 * marginTop)
        .attr('x2', width - margin - marginLeft + 10)
        .attr('y2', height - 2 * marginTop)
        .attr('marker-end', 'url(#arrow-axis)')
        .style('stroke', '#666')
        .style('stroke-width', 2);
      let tx = barChart.selectAll('tick')
        .data(tickX)
        .enter()
        .append('g')
        .attr('transform', d => 'translate(' + scaleX(d) + ',' + (height - 2 * marginTop) + ')');
      tx.append('line')
        .attr('x1', 0)
        .attr('y1', -3)
        .attr('x2', 0)
        .attr('y2', 0)
        .style('stroke', '#666')
        .style('stroke-width', 2);
      tx.append('text')
        .attr('y', 15)
        .style('text-anchor', 'middle')
        .text(d => d);
    }

    // const r = 180;
    // const colorList = { TP: "#efb1ef", TN: "#742dd2", FP: "#ffd933", FN: "#935900" };
    // const pie_o = d3.select('#pie-chart').append('g').attr('width', r * 2).attr('height', r * 2).attr("transform", "translate(" + (r + 40) + "," + (r + 50) + ")");
    // const pie_p = d3.select('#pie-chart').append('g').attr('width', r * 2).attr('height', r * 2).attr("transform", "translate(" + (3 * r + 170) + "," + (r + 50) + ")");
    // pie_o.append('text').attr('x', 0).attr('y', -r - 35).style('font-size', '20px').style('text-anchor', 'middle').style('fill', '#333').text('Original Dataset');
    // pie_p.append('text').attr('x', 0).attr('y', -r - 35).style('font-size', '20px').style('text-anchor', 'middle').style('fill', '#333').text('Processed Dataset');
    // const legendSvg = d3.select('#pie-chart').append('g').attr("transform", "translate(90," + (2 * r + 100) + ")");
    // this.pieChart(pie_o, original, r, colorList);
    // this.pieChart(pie_p, processed, r, colorList);
    // this.legend(legendSvg, colorList);
  }

  barChart(g, data, r, colorList) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i].freq;
    }
    let arcData = [], a = -Math.PI / 2;
    for (let i = 0; i < data.length; i++) {
      let angle = data[i].freq / sum * 2 * Math.PI;
      arcData.push({ startAngle: a, endAngle: a + angle, type: data[i].type });
      a += angle;
    }
    g.selectAll('arc-path').data(arcData).enter().append('path').attr('d', d => arcPath(r, d.startAngle, d.endAngle))
      .style('fill', d => colorList[d.type]).style('stroke', '#ffffff').style('opacity', 0.8);

    function arcPath(r, startAngle, endAngle) {
      let x1 = r * Math.cos(startAngle), x2 = r * Math.cos(endAngle), y1 = r * Math.sin(startAngle), y2 = r * Math.sin(endAngle);
      let flag = (endAngle - startAngle) > Math.PI ? 1 : 0;
      return 'M0 0 L' + x1 + ' ' + y1 + 'A' + r + ' ' + r + ' ' + (startAngle * 180 / Math.PI) + ' ' + flag + ' 1 ' + x2 + ' ' + y2 + 'Z';
    }
  }

  legend(g, colorList) {
    let legendList = [];
    for (let i in colorList) {
      let j = 'True positive';
      if (i === 'TN') j = 'True Negative';
      if (i === 'FN') j = 'False Negative';
      if (i === 'FP') j = 'False Positive';
      legendList.push({ type: j, color: colorList[i] });
    }
    g.append('rect').attr('x', 0).attr('y', 0).attr('width', 750).attr('height', 50).attr('rx', 5).attr('ry', 5).style('fill', 'none')
      .style('stroke', '#ccc').style('stroke-dasharray', '5 5');
    g.selectAll('legend-text').data(legendList).enter().append('text').attr('x', (d, i) => 40 + i * 180).attr('y', 30).style('fill', '#333').text(d => d.type);
    g.selectAll('legend-text').data(legendList).enter().append('rect').attr('x', (d, i) => 15 + i * 180).attr('y', 15)
      .attr('width', 20).attr('height', 20).attr('rx', 5).attr('ry', 5).style('fill', d => d.color).style('opacity', 0.8);
  }

  renderPanel(model) {
    switch(model) {
      case "bn": return (<div className="model-panel">
        <div className="model-unit">
          <span className="label">Search algorithm: </span>
          <Select defaultValue="k2" style={{ width: 270 }}>
            <Option value="k2">K2</Option>
            <Option value="gs">Genetic Search</Option>
            <Option value="hc">Hill Climber</Option>
            <Option value="lhc">LAGD Hill Climber</Option>
            <Option value="lcs">Local Score Search</Option>
            <Option value="rhc">Repeated Hill Climber</Option>
            <Option value="sa">Simulated Annealing</Option>
            <Option value="ts">Tabu Search</Option>
            <Option value="tan">Transductive Adversarial Networks</Option>
          </Select>
        </div>
      </div>);
      case "svm": return (
      <div className="model-panel">
        <div className="model-unit">
          <span className="label">Kernel type:</span>
          <Select defaultValue={0}>
            <Option value={0}>Linear</Option>
            <Option value={1}>Polynomial</Option>
            <Option value={2}>Exponential</Option>
            <Option value={3}>Sigmoid</Option>
          </Select>
        </div>
        <div className="model-unit">
          <span className="label">Degree:</span>
          <InputNumber value={3} min={1} max={5} defaultValue={3} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit">
          <span className="label">Gamma:</span>
          <InputNumber value={1} min={0} max={5} defaultValue={1} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit">
          <span className="label">Coef0:</span>
          <InputNumber value={0} min={0} max={5} defaultValue={0} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
      </div>);
      case "rf": return (
      <div className="model-panel">
        <div className="model-unit">
          <span className="label">BatchSize:</span>
          <InputNumber value={100} min={1} max={100} defaultValue={100} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit">
          <span className="label">Max Depth:</span>
          <InputNumber value={0} min={0} max={10} defaultValue={0} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
      </div>);
      case "knn": return (
      <div className="model-panel">
        <div className="model-unit">
          <span className="label">Cross Validate:</span>
          <Select defaultValue={true}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        </div>
        <div className="model-unit">
          <span className="label">K:</span>
          <InputNumber min={1} max={5} defaultValue={1} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit">
          <span className="label">Distance Weighting:</span>
          <Select defaultValue={0}>
            <Option value={0}>None</Option>
            <Option value={1}>Inverse</Option>
            <Option value={2}>Similarity</Option>
          </Select>
        </div>
        <div className="model-unit">
          <span className="label">Search Algorithm:</span>
          <Input/>
        </div>
        <div className="model-unit">
          <span className="label">Mean Squared:</span>
          <Select defaultValue={true}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        </div>
        <div className="model-unit">
          <span className="label">Distance Function:</span>
          <Input/>
        </div>
      </div>);
    }
  }

  submit() {

  }

  render() {
    const ww = 500, hh = 300;

    return (
      <div className="mod-view">
        <div>
          <div className="view-title">Attack Simulation View</div>
          <div className="operation">
            <div className='mod-panel'>
              <div>
                <div className="model-title">
                  <div>
                  <span className="label">Model: </span>
                  <Select defaultValue={ this.state.model } id="modelSelect" style={{ width: 220 }} onChange={(e) => this.setState({model: e})}>
                    <Option value="bn">Bayesian Network</Option>
                    <Option value="svm">Support Vector Machine</Option>
                    <Option value="rf">Random Forest</Option>
                    <Option value="knn">K-nearest Neighbors</Option>
                  </Select>
                  </div>
                  <Button className='model-submit' style={{width: 100}} onClick={this.submit}>Submit</Button>
                </div>
              </div>
              {this.renderPanel(this.state.model)}
            </div>
            <div className="mod-mainContent">
              {this.props.store.comparison.map((d, i) => (
                <div className="single-event" key={d.eventName}>
                  <div className='mod-chart'>
                    <svg width={ww} height={hh} id={"bar-chart" + i}>
                    </svg>
                  </div>
                  <div className='mod-report'>
                    <span className='report-title'>Report</span>
                    <ul className='report-list'>
                      <li>Original occurrence number is {d.oriD.toFixed(2)}.</li>
                      <li>The specificity of original dataset is <span className='report-h'>{((d.oriT - d.oriC * d.oriT) / (d.oriT + d.oriC)).toFixed(2)}.</span></li>
                      <li>The specificity of processed dataset is <span className='report-h'>{((d.proT - d.proC * d.proT) / (d.proT + d.proC)).toFixed(2)}.</span></li>
                      <li>The sensitivity of original datasets is <span className='report-h'>{((d.oriT - d.oriC * d.oriT) / (1 + d.oriC * d.oriT - 2 * d.oriC * d.oriT)).toFixed(2)}.</span></li>
                      <li>The sensitivity of original datasets is <span className='report-h'>{((d.proT - d.proT * d.proT) / (1 + d.proT * d.proT - 2 * d.proT * d.proT)).toFixed(2)}.</span></li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div className="model-legend">
              <div className='model-legend-unit'>
                <div className="model-dis" />
                <label>Real occurrences</label>
              </div>
              <div className='model-legend-unit'>
                <div className="model-pos" />
                <label>Identified as positives</label>
              </div>
              <div className='model-legend-unit'>
                <div className="model-tp" />
                <label>Correctly identified as positives</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
