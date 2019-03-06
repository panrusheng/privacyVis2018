import React from 'react';
import { inject, observer } from 'mobx-react';
import './RecView.scss';
import * as d3 from 'd3';
import { Radio, Button, Switch } from 'antd';
import OverviewInf from './RecInfer/OverviewInf'
import SubInfer from './RecInfer/SubInfer'
import { toJS, autorun, set } from 'mobx';

const RadioGroup = Radio.Group;
@inject(['store'])
@observer
export default class RecView extends React.Component {
  state = {
    select: null,
    show: false
  };

  prevRecNum = null;
  prevSubgroup = null;

  constructor(props) {
    super(props);
    this.reset = this.reset.bind(this);
    this.changeState = this.changeState.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.prevRecNum = this.props.store.recNum;
    this.prevSubgroupId = this.props.store.currentSubgroup ? this.props.store.currentSubgroup.id : undefined;
  }

  componentDidUpdate() {
    const { recNum, currentSubgroup } = this.props.store;
    const { prevRecNum, prevSubgroupId } = this;
    const subgId = currentSubgroup ? currentSubgroup.id : undefined;

    this.prevRecNum = recNum;
    this.prevSubgroupId = subgId;

    if ((recNum !== prevRecNum) || (subgId && !prevSubgroupId) || (!subgId && prevSubgroupId) ||
      (subgId && prevSubgroupId && subgId !== prevSubgroupId)) {
      this.reset();
    }
  }

  componentWillMount() {
    this.props.store.getRecList()
    // this.setState({select: this.props.store.recSelectedList[this.props.store.recNum]})
  }

  reset() {
    this.setState({
      select: null
    });
  }

  submit() {
    const { currentSubgroup, subgroupRecSelectedList, recNum, groupSelectList } = this.props.store;

    let groupSel = groupSelectList[recNum];

    if (currentSubgroup) {
      let subgIdx = subgroupRecSelectedList.findIndex(item => item.id === currentSubgroup.id);

      if (groupSel === this.state.select) {
        if (subgIdx >= 0) {
          this.props.store.subgroupRecSelectedList.splice(subgIdx, 1);
        }
        this.props.store.currentSubgroup = null;
      } else if (currentSubgroup.records.length === this.props.store.dataGroups[recNum].records.length) {
        // all group;
        this.props.store.groupSelectList.splice(recNum, 1, this.state.select);
        this.props.store.subgroupRecSelectedList = subgroupRecSelectedList.filter(item => item.group !== recNum);
      } else {
        let subg = subgIdx >= 0 ? toJS(subgroupRecSelectedList[subgIdx]) : toJS(currentSubgroup);
        let dupSelIndex = subgroupRecSelectedList.findIndex(item => item.group === subg.group &&  item.select === this.state.select);
        let dupSelSubg = subgroupRecSelectedList[dupSelIndex];

        if (dupSelIndex >= 0 && dupSelSubg.id !== subg.id) {
          subg.records = [...new Set([...subg.records, ...dupSelSubg.records])];
        }

        subg.select = this.state.select;
        
        let selectedList = toJS(subgroupRecSelectedList);
        
        if (subgIdx >= 0) selectedList[subgIdx] = subg;
        else selectedList.push(subg);

        if (dupSelIndex >= 0) selectedList.splice(dupSelIndex, 1);
      
        this.props.store.subgroupRecSelectedList = selectedList;

        this.props.store.currentSubgroup = subg;
      }

    } else {
      let sgIndex = subgroupRecSelectedList.findIndex(item => item.group === recNum && item.select === this.state.select);

      if (sgIndex >= 0) {
        this.props.store.subgroupRecSelectedList.splice(sgIndex, 1);
      }

      this.props.store.groupSelectList.splice(recNum, 1, this.state.select);
    }

    this.props.store.updateRecSelectedList(recNum);

    this.reset();
  }

  changeState(value) {
    this.setState({
      select: value
    });
  }

  forceDirected(n, l) {
    const links = l;
    const nodes = n;
    let layout = this.props.store.getGraphLayout();
    let simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force(
        'link',
        d3
          .forceLink(links)
          .id(d => d.eventNo)
          .distance(5)
          .strength(0.5)
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

    if ('nodes' in layout) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < layout.nodes.length; j++) {
          if (nodes[i].id.split(':')[0] === layout.nodes[j].id) {
            nodes[i].x = layout.nodes[j].x;
            nodes[i].y = layout.nodes[j].y;
            break;
          }
        }
      }
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
    let list = recSelectedList[recNum] || [];

    if (this.state.select === null) {
      let subg;
      if (this.props.store.currentSubgroup) {
        subg = this.props.store.subgroupRecSelectedList.find(item => item.id === this.props.store.currentSubgroup.id);
      }

      if (subg) {
        for (let i = 0; i < 3; ++i) {
          if (i === subg.select) select.push(1);
          else select.push(0);
        }
      } else {
        select = [];
        let maxNo = 0;
        for (let i = 0; i < list.length; i++) {
            select.push(false);
            if (list[maxNo] < list[i]) maxNo = i;
        }
        select[maxNo] = true;
      }
    }
    else {
      for (let i = 0; i < 3; i++) {
        if (i === this.state.select) select.push(1);
        else select.push(0);
      }
    }

    const ww = 218, hh = 198, width = 900, height = 670;
    return (
      <div className="rec-view">
        <div>
          <div className="view-title">Solution Recommendation View</div>
          <div className="operation">
            <div className="rec-overview">
              <svg width={width} height={height}>
                <OverviewInf data={recData} sch={deleteList} selected={this.state.select} change={this.changeState} 
                  show={this.state.show} ww={width}z hh={height} name={"rec-big"} />
              </svg>
              <div className="rec-panel">
                <Button className="rec-button" onClick={this.reset} disabled={(this.state.select === null)}>Reset</Button>
                <Button className="rec-button" onClick={this.submit} disabled={(this.state.select === null)}>Submit</Button>
                <p>Amount: {recData.num}</p>
                <div className="rec-switch">
                  <label>Remove</label>
                  <Switch checked={this.state.show} onChange={checked => this.setState({ show: checked })} />
                  <label>Preserve</label>
                </div>
              </div>
            </div>
            <div className="rec-solution">
              <div className="rec-list">
                {deleteList && deleteList.map((d, i) => (
                  <div className="rec-td" key={"rec-graph-" + i}>
                    <svg width={ww} height={hh}>
                      <SubInfer data={recData} sch={d} rec={list[i]} select={select[i]} change={this.changeState} ww={ww} hh={hh} num={i} />
                    </svg>
                  </div>
                ))}
              </div>
              <div className='rec-selection'>
                <RadioGroup onChange={e => this.setState({ select: e.target.value })} value={this.state.select} id="solution-selected">
                {deleteList && deleteList.map((d, i) => (
                  <Radio value={i} key={'radio' + i}>{"Utility loss: " + d.uL.toFixed(2)}</Radio>
                ))}
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
