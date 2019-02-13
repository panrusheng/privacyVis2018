import React from 'react';
import { inject, observer } from 'mobx-react';
import './ModelView.scss';
import * as d3 from 'd3';
import { Select, Button, Menu } from 'antd';
import { toJS } from 'mobx';
const Option = Select.Option;
@inject(['store'])
@observer
export default class ModelView extends React.Component {
  state = {

  };
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { original, processed } = this.props.store.piechart;
    const r = 180;
    const colorList = {TP:"#efb1ef", TN:"#742dd2", FP:"#ffd933", FN:"#935900"};
    const pie_o = d3.select('#pie-chart').append('g').attr('width', r*2).attr('height', r*2).attr("transform", "translate("+(r+40)+","+(r+50)+")");
    const pie_p = d3.select('#pie-chart').append('g').attr('width', r*2).attr('height', r*2).attr("transform", "translate("+(3*r+170)+","+(r+50)+")");
    pie_o.append('text').attr('x', 0).attr('y', -r-35).style('font-size', '20px').style('text-anchor', 'middle').style('fill', '#333').text('Original Dataset');
    pie_p.append('text').attr('x', 0).attr('y', -r-35).style('font-size', '20px').style('text-anchor', 'middle').style('fill', '#333').text('Processed Dataset');
    const legendSvg = d3.select('#pie-chart').append('g').attr("transform", "translate(90,"+(2*r+100)+")");
    this.pieChart(pie_o, original, r, colorList);
    this.pieChart(pie_p, processed, r, colorList);
    this.legend(legendSvg, colorList);
  }

  pieChart(g, data, r, colorList){
    let sum = 0;
    for (let i =0; i < data.length; i++) {
      sum += data[i].freq;
    }
    let arcData = [], a = -Math.PI/2;
    for (let i =0; i < data.length; i++) {
      let angle = data[i].freq/sum * 2 * Math.PI;
      arcData.push({startAngle: a, endAngle: a+angle, type: data[i].type});
      a += angle;
    }
    g.selectAll('arc-path').data(arcData).enter().append('path').attr('d', d => arcPath(r, d.startAngle, d.endAngle))
    .style('fill', d=>colorList[d.type]).style('stroke', '#ffffff').style('opacity', 0.8);

    function arcPath(r, startAngle, endAngle) {
        let x1 = r*Math.cos(startAngle), x2 = r*Math.cos(endAngle), y1 = r*Math.sin(startAngle), y2 = r*Math.sin(endAngle);
        let flag = (endAngle - startAngle) > Math.PI? 1:0;
        return 'M0 0 L'+x1+' ' +y1+'A'+r+' '+r+' '+(startAngle*180/Math.PI)+' '+ flag +' 1 '+x2+' '+y2+'Z';
    }
}

legend(g, colorList){
    let legendList = [];
    for (let i in colorList) {
        let j = 'True positive';
        if (i == 'TN') j = 'True Negative';
        if (i == 'FN') j = 'False Negative';
        if (i == 'FP') j = 'False Positive';
        legendList.push({type: j, color: colorList[i]});
    }
    g.append('rect').attr('x', 0). attr('y', 0).attr('width', 750).attr('height', 50).attr('rx', 5).attr('ry',5).style('fill', 'none')
    .style('stroke', '#ccc').style('stroke-dasharray', '5 5');
    g.selectAll('legend-text').data(legendList).enter().append('text').attr('x', (d, i) => 40 + i * 180).attr('y', 30).style('fill', '#333').text(d => d.type);
    g.selectAll('legend-text').data(legendList).enter().append('rect').attr('x', (d, i) => 15 + i * 180).attr('y', 15)
    .attr('width', 20).attr('height', 20).attr('rx', 5).attr('ry',5).style('fill', d => d.color).style('opacity', 0.8);
}

  modelSelected(e) {

  }

  submit() {

  }

  render() {
    const ww = 900, hh = 550;
    const menu = (<Menu onClick={this.modelSelected}>
        <Menu.Item key='SVM'>Support vector machine</Menu.Item>
        <Menu.Item key='BN'>Bayesian network</Menu.Item>
        <Menu.Item key='?'>???</Menu.Item>
      </Menu>);
    
    return (
      <div className="mod-view">
       <div>
          <div className="view-title">Attack Simulation View</div>
          <div className="operation">
            <div className='mod-panel'>
              <div>
              <span className="label">Model: </span>
              <Select defaultValue="bn" style={{ width: 220 }} onChange={ this.modelSelected }>
                <Option value="bn">Bayesian Network</Option>
                <Option value="svm">Support Vector Machine</Option>
              </Select>
              </div>
              <Button className='model-submit' onClick={ this.submit }>Submit</Button>
            </div>
            <div className='mod-chart'>
              <svg width={ww} height={hh} id="pie-chart">
              </svg>
            </div>
            <div className='mod-report'>
              <span className='report-title'>Report</span>  
              <ul className='report-list'>
                  <li>The current specificity is <span className='report-h'>??</span>, which is <span className='report-h'>?? lower/higher</span> than the orignial dataset.</li>
                  <li>The current Sensitivity is <span className='report-h'>??</span>, which is <span className='report-h'>?? lower/higher</span> than the orignial dataset.</li>
              </ul>
            </div>     
          </div>  
        </div>
      </div>
    );
  }
}
