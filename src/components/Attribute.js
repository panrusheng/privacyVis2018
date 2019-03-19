import React from 'react';
import { Switch, Slider } from 'antd';
import * as d3 from 'd3';
import './Attribute.scss';
import '../components/AttrView/AttrNetwork';
import AttrNetwork from '../components/AttrView/AttrNetwork';
import CoCircle from '../components/AttrView/CoCircle';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
@inject(['store'])
@observer
export default class Attribute extends React.Component {
  state = {
    mergeAttribute: false,
    filterValue: 0,
    selectEvent: null
  };

  constructor(props) {
    super(props);
    this.changeState = this.changeState.bind(this);
  }
  
  handleTabChange(dataset, domID) {
    this.props.store.getAttrList(dataset).then(attributes => {
      this.setState({ attributes }, () => {
        this.forceUpdate();
      });
    });
    d3.selectAll('.dataset-tab').attr('class', 'dataset-tab');
    d3.select('#' + domID).attr('class', 'dataset-tab dataset-tab-active');
    d3.selectAll('.dataset-check')
      .selectAll('img')
      .attr('src', './image/notcheck.svg');
    d3.selectAll('.dataset-check')
      .selectAll('img')
      .attr('class', 'lodDisable');
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
          .distance(10)
          .strength(2)
          .iterations(2)
          .id(d => d.eventNo)
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

  changeState(event) {
    this.setState({
      selectEvent: event
    });
  }

  mergeGraph (layout, n, l) {
    let attrN = [],
    attrL = [],
    attrDic = {},
    linkDic = {},
    nodeDic = [];
  for (let i = 0; i < n.length; i++) {
    if (!(n[i].attrName in attrDic)) {
      attrDic[n[i].attrName] = { no: attrN.length, child: [] };
      attrN.push({ id: n[i].attrName, value: n[i].value, x: 0, y:0 });
      attrN[attrN.length - 1].x = 0;
      attrN[attrN.length - 1].y = 0;
    }
    nodeDic.push({
      id: attrDic[n[i].attrName].no,
      no: attrDic[n[i].attrName].child.length
    });
    attrN[attrDic[n[i].attrName].no].x += layout.nodes[i].x;
    attrN[attrDic[n[i].attrName].no].y += layout.nodes[i].y;
    attrDic[n[i].attrName].child.push(n[i].id);
  }
  for (let i = 0; i < attrN.length; i++) {
    attrN[i].child = attrDic[attrN[i].id].child;
    attrN[i].x /= attrN[i].child.length; 
    attrN[i].y /= attrN[i].child.length; 
  }
  for (let i = 0; i < l.length; i++) {
    const sA = nodeDic[l[i].source.index];
    const tA = nodeDic[l[i].target.index];
    if (sA.id === tA.id) continue;
    const label = sA.id + ',' + tA.id;
    if (!(label in linkDic)) {
      linkDic[label] = { no: attrL.length, child: [], value: 0 };
      attrL.push({ source: {index: sA.id}, target: {index: tA.id} });
    }
    linkDic[label].child.push({
      source: sA.no,
      target: tA.no,
      value: l[i].value,
      cpt: l[i].cpt,
    });
    linkDic[label].value =
      linkDic[label].value < l[i].value ? l[i].value : linkDic[label].value;
  }
  for (let i = 0; i < attrL.length; i++) {
    const label = attrL[i].source.index + ',' + attrL[i].target.index;
    attrL[i].value = linkDic[label].value;
    attrL[i].child = linkDic[label].child;
  }
  return { nodes: attrN, links: attrL };
}
  // mergeGraph(n, l) {
  //   let attrN = [],
  //     attrL = [],
  //     attrDic = {},
  //     linkDic = {},
  //     nodeDic = [];
  //   for (let i = 0; i < n.length; i++) {
  //     if (!(n[i].attrName in attrDic)) {
  //       attrDic[n[i].attrName] = { no: attrN.length, child: [] };
  //       attrN.push({ id: n[i].attrName, value: n[i].value });
  //     }
  //     nodeDic.push({
  //       id: attrDic[n[i].attrName].no,
  //       no: attrDic[n[i].attrName].child.length
  //     });
  //     attrDic[n[i].attrName].child.push(n[i].id);
  //   }
  //   for (let i = 0; i < attrN.length; i++) {
  //     attrN[i].child = attrDic[attrN[i].id].child;
  //   }
  //   for (let i = 0; i < l.length; i++) {
  //     const sA = nodeDic[l[i].source];
  //     const tA = nodeDic[l[i].target];
  //     if (sA.id === tA.id) continue;
  //     const label = sA.id + ',' + tA.id;
  //     if (!(label in linkDic)) {
  //       linkDic[label] = { no: attrL.length, child: [], value: 0 };
  //       attrL.push({ source: sA.id, target: tA.id });
  //     }
  //     linkDic[label].child.push({
  //       source: sA.no,
  //       target: tA.no,
  //       value: l[i].value,
  //       cpt: l[i].cpt,
  //     });
  //     linkDic[label].value =
  //       linkDic[label].value < l[i].value ? l[i].value : linkDic[label].value;
  //   }
  //   for (let i = 0; i < attrL.length; i++) {
  //     const label = attrL[i].source + ',' + attrL[i].target;
  //     attrL[i].value = linkDic[label].value;
  //     attrL[i].child = linkDic[label].child;
  //   }
  //   return { nodes: attrN, links: attrL };
  // }

  render() {
    // this.props.store.getGBN();
    let data = toJS(this.props.store.GBN); // deep copy
    let canvasA = { ww: 840, hh: 860 };
    let canvasB = { ww: 220, hh: 960 };
    const filterRange = [0, d3.max(toJS(data.links), d => Math.abs(d.value))];
    let layout = this.forceDirected(data.nodes, data.links);
    this.props.store.setGraphLayout(this.mergeGraph(layout, data.nodes, data.links));
    if (this.state.mergeAttribute) {
      layout = this.props.store.getGraphLayout();
    }
    return (
      <div className="attribute-view">
        <div className="title">Inference Simulation View</div>
        <div className="attr-mainContent">
          <div className="attr-left">
            <div className="attr-operations">
              <div className="operation">
                <span className="label">Edge filter:</span>
                <Slider
                  min={filterRange[0]}
                  max={filterRange[1]}
                  step={0.01}
                  onChange={value => this.setState({ filterValue: value })}
                  value={this.state.filterValue}
                />
                <span style = {{marginRight: 250}}>{filterRange[1] ? filterRange[1].toFixed(2) : 1}</span>
              </div>
              <div className="operation" style = {{marginRight: 25}}>
                <span className="label">Merge by attributes:</span>
                <Switch
                  checked={this.state.mergeAttribute}
                  onChange={value => this.setState({ mergeAttribute: value })}
                />
              </div>
            </div>
            <div className="attr-network">
              <svg width={canvasA.ww} height={canvasA.hh}>
                <AttrNetwork
                  data={layout}
                  canvas={canvasA}
                  filter={this.state.filterValue}
                  nullList={data.nullNodes}
                  eventColorList={this.props.store.eventColorList}
                  change={this.changeState}
                />
              </svg>
              {(data.nullNodes && data.nullNodes.length)?(<div className="irr-events">
                <div style={{ fontSize: 18, textAlign: 'center' }}>Irrelevant events</div>
                <div className="irr-li">
                  { data.nullNodes.map(({ id }) => <div className="irr">{id}</div>)  }
                </div>
              </div>):(<div />)}
            </div>
          <div className="gbn-legend">
            <div className='gbn-legend-unit'>
              <div className="gbn-sen" />
              <label>Sensitive</label>
            </div>
            <div className='gbn-legend-unit'>
              <div className="gbn-non" />
              <label>Utility</label>
            </div>
            <div className='gbn-legend-unit'>
              <div className="gbn-edge-o" />
              <label>|P(Target|Source) - P(Target)|</label>
            </div>
            <div className='gbn-legend-unit'>
              <div className="gbn-edge-np" />
                <div className="gbn-edge-np-label">
                  <label>+</label>
                  <label>-</label>
                </div>
              </div>
            </div>
          </div>
          <div className="attr-right">
            <svg width={canvasB.ww} height={canvasB.hh}>
              <CoCircle
                coData={this.props.store.sensitiveCorrelation}
                eventName={this.state.selectEvent}
                canvas={canvasB}
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
}