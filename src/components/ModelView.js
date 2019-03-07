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
    model: 'KNN',
    options: {
      crossValidate: 'false', distanceWeighting: 0, k: 1, meanSquared: 'false',
      searchAlgorithm: 'LinearNNSearch', distanceFunction: 'EculideanDistance',
    }
  };

  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.changeModel = this.changeModel.bind(this);
  }

  changeModel(model) {
    let options;
    switch (model) {
      case 'KNN': {
        options = {
          crossValidate: 'false', distanceWeighting: 0, k: 1, meanSquared: 'false',
          searchAlgorithm: 'LinearNNSearch', distanceFunction: 'EculideanDistance',
        };
        break;
      }
      case 'bayesianNetwork': {
        options = { searchAlgorithm: 'K2' };
        break;
      }
      case 'SVM': {
        options = { kernelType: 0, degree: 3, gamma: this.props.store.selectedAttributes.length > 0 ?  parseFloat((1/this.props.store.selectedAttributes.length).toFixed(2)) : 1 , coef0: 0 };
        break;
      }
      case 'decisionTree': {
        options =  { unpruned: 'false', confidenceThreshold: 0.25, minInstance: 2, laplaceSmoothing: 'false',
          reducedErrorPruning: 'false', MDLCorrection: 'true', collapseTree: 'true', subtreeRaising: 'true' };
        break;
      }
      case 'randomForest': {
        options = { maxDepth: 0 };        
        break;
      }
    }

    this.setState({ options, model });
  }

  componentDidMount() {
    const comparison = this.props.store.comparison;
    const width = 500, height = 300, marginLeft = 150, margin = 20, marginTop = 50;
    const gap = 5, hh = (height - margin - marginTop) / 5 - gap;
    const text = ['#Occurrences', '#Positives', '(original dataset)', '#True positives',
      '(original dataset)', '#Positives', '(processed dataset)', '#True positives', '(processed dataset)'];
    for (let i = 0; i < comparison.length; i++) {
      const data = comparison[i];
      const canvas = d3.select('#bar-chart' + i).append('g').attr('width', width).attr('height', height);
      const barChart = canvas.append('g').attr("transform", "translate(" + marginLeft + "," + margin + ")");
      const max = Math.max(data.oriD, data.oriC, data.proC);
      const scaleX = d3.scaleLinear().domain([0, max]).range([0, width - margin - marginLeft]).nice();
      const tickX = scaleX.ticks(5);
      const bars = [data.oriD, data.oriC, data.oriC * data.oriT, data.proC, data.proC * data.proT];
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
        .attr('y2', height - margin - marginTop)
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
        .attr('y1', height - margin - marginTop)
        .attr('x2', width - margin - marginLeft + 10)
        .attr('y2', height - margin - marginTop)
        .attr('marker-end', 'url(#arrow-axis)')
        .style('stroke', '#666')
        .style('stroke-width', 2);
      let tx = barChart.selectAll('tick')
        .data(tickX)
        .enter()
        .append('g')
        .attr('transform', d => 'translate(' + scaleX(d) + ',' + (height - marginTop - margin) + ')');
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

  // barChart(g, data, r, colorList) {
  //   let sum = 0;
  //   for (let i = 0; i < data.length; i++) {
  //     sum += data[i].freq;
  //   }
  //   let arcData = [], a = -Math.PI / 2;
  //   for (let i = 0; i < data.length; i++) {
  //     let angle = data[i].freq / sum * 2 * Math.PI;
  //     arcData.push({ startAngle: a, endAngle: a + angle, type: data[i].type });
  //     a += angle;
  //   }
  //   g.selectAll('arc-path').data(arcData).enter().append('path').attr('d', d => arcPath(r, d.startAngle, d.endAngle))
  //     .style('fill', d => colorList[d.type]).style('stroke', '#ffffff').style('opacity', 0.8);

  //   function arcPath(r, startAngle, endAngle) {
  //     let x1 = r * Math.cos(startAngle), x2 = r * Math.cos(endAngle), y1 = r * Math.sin(startAngle), y2 = r * Math.sin(endAngle);
  //     let flag = (endAngle - startAngle) > Math.PI ? 1 : 0;
  //     return 'M0 0 L' + x1 + ' ' + y1 + 'A' + r + ' ' + r + ' ' + (startAngle * 180 / Math.PI) + ' ' + flag + ' 1 ' + x2 + ' ' + y2 + 'Z';
  //   }
  // }

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

  handleOptionUpdate(name, value) {
    this.setState({ options: Object.assign({}, this.state.options, { [name]: value }) });
  }

  renderPanel(model) {
    switch(model) {
      case "bayesianNetwork": return (<div className="model-panel">
        <div className="model-unit" key="bn-1">
          <span className="label">Search algorithm: </span>
          <Select value={this.state.options.searchAlgorithm} style={{ width: 270 }} onChange={value => this.handleOptionUpdate('searchAlgorithm', value)}>
            <Option value="K2">K2</Option>
            <Option value="GeneticSearch">Genetic Search</Option>
            <Option value="HillClimber">Hill Climber</Option>
            <Option value="LAGDHillClimber">LAGD Hill Climber</Option>
            <Option value="LocalScoreSearchAlgorithm">Local Score Search</Option>
            <Option value="RepeatedHillClimber">Repeated Hill Climber</Option>
            <Option value="SimulatedAnnealing">Simulated Annealing</Option>
            <Option value="TabuSearch">Tabu Search</Option>
            <Option value="TAN">Transductive Adversarial Networks</Option>
          </Select>
        </div>
      </div>);
      case "SVM": return (
      <div className="model-panel">
        <div className="model-unit" key="svm-1">
          <span className="label" style={{ width: 75}}>Kernel type:</span>
          <Select value={this.state.options.kernelType} onChange={value => this.handleOptionUpdate('kernelType', value)}>
            <Option value={0}>Linear</Option>
            <Option value={1}>Polynomial</Option>
            <Option value={2}>Exponential</Option>
            <Option value={3}>Sigmoid</Option>
          </Select>
        </div>
        <div className="model-unit" key="svm-2">
          <span className="label"  style={{ width: 75}}>Degree:</span>
          <InputNumber value={this.state.options.degree} onChange={value => this.handleOptionUpdate('degree', value)}  min={1} max={5} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit" key="svm-3">
          <span className="label" style={{ width: 75}}>Gamma:</span>
          <InputNumber value={this.state.options.gamma} onChange={value => this.handleOptionUpdate('gamma', value)} min={0} max={5} step={0.01} style={{ width: 70, textAlign: 'left' }} />
        </div>
        <div className="model-unit" key="svm-4">
          <span className="label" style={{ width: 75}}>Coef0:</span>
          <InputNumber value={this.state.options.coef0} onChange={value => this.handleOptionUpdate('coef0', value)} min={0} max={5} step={0.01} style={{ width: 70, textAlign: 'left' }} />
        </div>
      </div>);
      case "randomForest": return (
      <div className="model-panel">
        <div className="model-unit" key="rf-1">
          <span className="label">Max depth:</span>
          <InputNumber value={this.state.options.maxDepth} onChange={value => this.handleOptionUpdate('maxDepth', value)} min={0} max={10} defaultValue={0} step={1} style={{ width: 70, textAlign: 'left' }} />
        </div>
      </div>);
      case "KNN": return (
      <div className="model-panel">
        <div className="model-unit" key="knn-1">
          <span className="label" style={{"minWidth": 125}}>Cross Validate:</span>
          <Select value={this.state.options.crossValidate} onChange={value => this.handleOptionUpdate('crossValidate', value)} style={{ width: 100}}>
            <Option value={'true'}>True</Option>
            <Option value={'false'}>False</Option>
          </Select>
        </div>
        <div className="model-unit" key="knn-2">
          <span className="label" style={{"minWidth": 100}}>K:</span>
          <InputNumber value={this.state.options.k} onChange={value => this.handleOptionUpdate('k', value)} min={1} max={5} defaultValue={1} step={1} style={{ width: 75, textAlign: 'left' }} />
        </div>
        <div className="model-unit" key="knn-3">
          <span className="label" style={{"minWidth": 125}}>Distance weighting:</span>
          <Select  value={this.state.options.distanceWeighting} onChange={value => this.handleOptionUpdate('distanceWeighting', value)} style={{ width: 100}}>
            <Option value={0}>None</Option>
            <Option value={1}>Inverse</Option>
            <Option value={2}>Similarity</Option>
          </Select>
        </div>
        <div className="model-unit" key="knn-4">
          <span className="label" style={{"minWidth": 100}}>Mean squared:</span>
          <Select  value={this.state.options.meanSquared} onChange={value => this.handleOptionUpdate('meanSquared', value)}>
            <Option value={'true'}>True</Option>
            <Option value={'false'}>False</Option>
          </Select>
        </div>
        <div className="model-unit" key="knn-5">
          <span className="label" style={{"minWidth": 125}}>Distance Function:</span>
          <Select  value={this.state.options.distanceFunction} onChange={value => this.handleOptionUpdate('distanceFunction', value)} style={{ width: 220}}>
            <Option value={'EculideanDistance'}>Eculidean Distance</Option>
            <Option value={'FilteredDistance'}>Filtered Distance</Option>
            <Option value={'ChebyshevDistance'}>Chebyshev Distance</Option>
            <Option value={'ManhattanDistance'}>Manhattan Distance</Option>
            <Option value={'MinkowskiDistance'}>Minkowski Distance</Option>  
          </Select>
        </div>
        <div className="model-unit" key="knn-6">
          <span className="label" style={{"minWidth": 125}}>Search Algorithm:</span>
          <Select  value={this.state.options.searchAlgorithm} onChange={value => this.handleOptionUpdate('searchAlgorithm', value)} style={{ width: 220}}>
            <Option value={'LinearNNSearch'}>Linear NN Search</Option>
            <Option value={'BallTree'}>Ball Tree</Option>
            <Option value={'CoverTree'}>Cover Tree</Option>
            <Option value={'FilteredNeighbourSearch'}>Filtered Neighbour Search</Option>
            <Option value={'KDTree'}>KDTree</Option>  
          </Select>
        </div>
      </div>);
      case "decisionTree": return (
        <div className="model-panel">
          <div className="model-unit" key="dt-7">
            <span className="label" style={{"minWidth": 147}}>Unpruned:</span>
            <Select  value={this.state.options.unpruned} onChange={value => this.handleOptionUpdate('unpruned', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
          <div className="model-unit" key="dt-8">
            <span className="label" style={{"minWidth": 147}}>Confidence threshold:</span>
            <InputNumber  value={this.state.options.confidenceThreshold} onChange={value => this.handleOptionUpdate('confidenceThreshold', value)}  min={0.05} max={1} defaultValue={0.25} step={0.05} style={{ width: 75, textAlign: 'left' }} />
          </div>
          <div className="model-unit" key="dt-9">
            <span className="label" style={{"minWidth": 147}}>Min instance:</span>
            <InputNumber  value={this.state.options.minInstance} onChange={value => this.handleOptionUpdate('minInstance', value)}  min={1} max={5} defaultValue={2} step={1} style={{ width: 75, textAlign: 'left' }} />
          </div>
          <div className="model-unit" key="dt-1">
            <span className="label" style={{"minWidth": 147}}>Laplace smoothing:</span>
            <Select  value={this.state.options.laplaceSmoothing} onChange={value => this.handleOptionUpdate('laplaceSmoothing', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
          <div className="model-unit" key="23-1">
            <span className="label" style={{"minWidth": 147}}>Reduced error pruning:</span>
            <Select  value={this.state.options.reducedErrorPruning} onChange={value => this.handleOptionUpdate('reducedErrorPruning', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
          <div className="model-unit"  key="1-1">
            <span className="label" style={{"minWidth": 147}}>MDL correction:</span>
            <Select  value={this.state.options.MDLCorrection} onChange={value => this.handleOptionUpdate('MDLCorrection', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
          <div className="model-unit" key="2-1">
            <span className="label" style={{"minWidth": 147}}>Collapse tree:</span>
            <Select  value={this.state.options.collapseTree} onChange={value => this.handleOptionUpdate('collapseTree', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
          <div className="model-unit" key="3-1">
            <span className="label" style={{"minWidth": 147}}>Subtree raising:</span>
            <Select  value={this.state.options.subtreeRaising} onChange={value => this.handleOptionUpdate('subtreeRaising', value)} style={{ width: 75}}>
              <Option value={'true'}>True</Option>
              <Option value={'false'}>False</Option>
            </Select>
          </div>
        </div>);
    }
  }

  submit() {
    this.props.store.setModel(this.state.model, this.state.options);
  }

  render() {
    const ww = 500, hh = 280;

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
                  <Select defaultValue={ this.state.model } id="modelSelect" style={{ width: 220 }} onChange={this.changeModel}>
                    <Option value="bayesianNetwork">Bayesian Network</Option>
                    <Option value="SVM">Support Vector Machine</Option>
                    <Option value="randomForest">Random Forest</Option>
                    <Option value="decisionTree">Decision Tree</Option>
                    <Option value="KNN">K-nearest Neighbors</Option>
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
                  <p className="event-title">{d.eventName}</p>
                  <div className="event-content">
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
