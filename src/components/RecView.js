import React from 'react';
import { inject, observer } from 'mobx-react';
import './RecView.scss';
import * as d3 from 'd3';
import { Radio, Button } from 'antd';
import OverviewInf from './RecInfer/OverviewInf'
import SubInfer from './RecInfer/SubInfer'
import { toJS } from 'mobx';

const RadioGroup = Radio.Group;
@inject(['store'])
@observer
export default class RecView extends React.Component {
  state = {
    select: null
  };
  constructor(props) {
    super(props);
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  componentWillMount() {
    this.props.store.getRecList()
    // this.setState({select: this.props.store.recSelectedList[this.props.store.recNum]})
  }

  reset() {
    this.setState({ select: null });
  }

  submit() {

  }

  forceDirected(n, l) {
    const links = l;
    const nodes = n;
    let simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force(
        'link',
        d3
          .forceLink(links)
          .id(d => d.eventNo)
          .distance(15)
          .strength(2)
          .iterations(1)
      )
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .stop();

    for (
      let i = 0,
      iter = Math.ceil(
        Math.log(simulation.alphaMin()) /
        Math.log(1 - simulation.alphaDecay())
      );
      i < iter;
      ++i
    ) {
      simulation.tick();
    }

    return { nodes: nodes, links: links };
  }

  setPosition(data) {
    let layout = this.forceDirected(data.nodes, data.links);
    layout.num = data.num;
    return layout;
  }

  render() {
    const { recList, recSelectedList, recNum } = toJS(this.props.store);

    // const title = ["Original Data", "Recommendation 1", "Recommendation 2", "Recommendation 3"];
    if (recList.group.length === 0) return (<div />);
    const recData = this.setPosition(recList.group[recNum]);
    let deleteList = recList.rec[recNum];
    let select = [];
    if (this.state.select === null) select = [1, 0, 0];//select = recSelectedList[recNum];
    else {
      for (let i = 0; i < 3; i++) {
        if (i === this.state.select) select.push(1);
        else select.push(0);
      }
    }
    if (!deleteList || deleteList === []) {
      deleteList = [{ dL: [0, 1, 4], uL: 0.5 }, { dL: [0, 2, 3], uL: 0.8 }, { dL: [0, 2, 5], uL: 1 }];
    }
    const ww = 218, hh = 198, width = 900, height = 670;

    return (
      <div className="rec-view">
        <div>
          <div className="view-title">Solution Recommendation View</div>
          <div className="operation">
            <div className="rec-overview">
              <svg width={width} height={height}>
                <OverviewInf data={recData} sch={deleteList} selected={this.state.select} ww={width} hh={height} name={"rec-big"} />
              </svg>
              <div className="rec-panel">
                <p>Amount: {recData.num}</p>
                <Button className="rec-button" onClick={this.reset} disabled={(this.state.select === null)}>Reset</Button>
                <Button className="rec-button" onClick={this.submit} disabled={(this.state.select === null)}>Submit</Button>
              </div>
            </div>
            <div className="rec-solution">
              <div className="rec-list">
                {deleteList.map((d, i) => (
                  <div className="rec-td" key={"rec-graph-" + i}>
                    <svg width={ww} height={hh}>
                      <SubInfer data={recData} sch={d} rec={select[i]} ww={ww} hh={hh} name={"rec-small-" + i} />
                    </svg>
                  </div>
                ))}
              </div>
              <div className='rec-selection'>
                <RadioGroup onChange={e => this.setState({ select: e.target.value })} value={this.state.select} id="solution-selected">
                  <Radio value={0}>{"Utility loss: " + deleteList[0].uL.toFixed(2)}</Radio>
                  <Radio value={1}>{"Utility loss: " + deleteList[1].uL.toFixed(2)}</Radio>
                  <Radio value={2}>{"Utility loss: " + deleteList[2].uL.toFixed(2)}</Radio>
                </RadioGroup>
              </div>
            </div>
            <div className="rec-col-arrow" style={{ width: 880, height: 60 }}>
              <svg width={880} height={40} id="utility-arrow" className="arrow-canvas">
                <g>
                  <defs>
                    <marker id="arrow-r" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M0,-4L10,0L0,4L3,0" style={{ fill: '#999' }} />
                    </marker>
                  </defs>
                  <line x1="40" y1="10" x2="873" y2="10" markerEnd="url(#arrow-r)" style={{ stroke: '#ccc', strokeWidth: 6 }} />
                  <text transform="translate(460, 30)" style={{ textAnchor: 'middle', fill: '#999' }}>Utility loss </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
