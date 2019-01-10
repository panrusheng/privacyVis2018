import React from 'react';
import { Switch, Slider } from 'antd';
import * as d3 from 'd3';
import './Attribute.scss';
import '../components/AttrView/AttrNetwork';
import AttrNetwork from '../components/AttrView/AttrNetwork';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
@inject(['store'])
@observer
export default class Attribute extends React.Component {
  state = {
    mergeAttribute: false,
    filterValue: 0
    // attributes: {
    //   attr: [{ name: '??' }],
    //   description: { name: { '??': '???' }, unit: { '??': '???' } }
    // }
  };

  // changeCho(name) {
  //   if (d3.select('#lodused' + name).attr('class') == 'lodDisable') {
  //     d3.select('#lodused' + name)
  //       .attr('class', 'lodActive')
  //       .attr('src', './image/check.svg');
  //     this.props.store.addAttributes(name);
  //   } else {
  //     d3.select('#lodused' + name)
  //       .attr('class', 'lodDisable')
  //       .attr('src', './image/notcheck.svg');
  //     this.props.store.removeAttributes(name);
  //   }
  // }

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
    // let links = l.map(function (i) { return { source: i.start, target: i.end, value: i.weight }; });
    // let nodes = n.map(function (i) { return { id: i.eventName, group: i.attrName }; });
    const links = l;
    const nodes = n;
    var simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-50))
      .force(
        'link',
        d3
          .forceLink(links)
          .distance(10)
          .strength(1)
          .iterations(1)
      )
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .stop();

    for (
      var i = 0,
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
  mergeGraph(n, l) {
    let attrN = [],
      attrL = [],
      attrDic = {},
      linkDic = {},
      nodeDic = [];
    for (let i = 0; i < n.length; i++) {
      if (!(n[i].attrName in attrDic)) {
        attrDic[n[i].attrName] = { no: attrN.length, child: [] };
        attrN.push({ id: n[i].attrName, value: n[i].value });
      }
      nodeDic.push({
        id: attrDic[n[i].attrName].no,
        no: attrDic[n[i].attrName].child.length
      });
      attrDic[n[i].attrName].child.push(n[i].id);
    }
    for (let i = 0; i < attrN.length; i++) {
      attrN[i].child = attrDic[attrN[i].id].child;
    }
    for (let i = 0; i < l.length; i++) {
      const sA = nodeDic[l[i].source];
      const tA = nodeDic[l[i].target];
      if (sA.id == tA.id) continue;
      const label = sA.id + ',' + tA.id;
      if (!(label in linkDic)) {
        linkDic[label] = { no: attrL.length, child: [], value: 0 };
        attrL.push({ source: sA.id, target: tA.id });
      }
      linkDic[label].child.push({
        source: sA.no,
        target: tA.no,
        value: l[i].value,
        cpb: l[i].cpb,
        cpbo: l[i].cpbo
      });
      linkDic[label].value =
        linkDic[label].value < l[i].value ? l[i].value : linkDic[label].value;
    }
    for (let i = 0; i < attrL.length; i++) {
      const label = attrL[i].source + ',' + attrL[i].target;
      attrL[i].value = linkDic[label].value;
      attrL[i].child = linkDic[label].child;
    }
    return { nodes: attrN, links: attrL };
  }

  copy(o) {
    var output, v, key;
    output = Array.isArray(o) ? [] : {};
    for (key in o) {
      v = o[key];
      output[key] = typeof v === 'object' ? this.copy(v) : v;
    }
    return output;
  }

  render() {
    let data = toJS(this.props.store.GBN); // deep copy
    let canvas;
    const filterRange = d3.extent(data.links, d => d.value);
    canvas = { ww: 520, hh: 460 };
    if (this.state.mergeAttribute) {
      data = this.mergeGraph(data.nodes, data.links);
    }
    let layout = this.forceDirected(data.nodes, data.links);
    return (
      <div className="attribute-view">
        <div className="title">Inference View</div>
        <div className="attr-operations">
          <div className="operation">
            <span className="label">Correlation filter:</span>
            <Slider
              min={filterRange[0]}
              max={filterRange[1]}
              step={0.05}
              onChange={value => this.setState({ filterValue: value })}
              value={this.state.filterValue}
            />
          </div>
          <div className="operation r5">
            <span className="label">Merge attribute:</span>
            <Switch
              checked={this.state.mergeAttribute}
              onChange={value => this.setState({ mergeAttribute: value })}
            />
          </div>
        </div>
        <div className="attr-network">
          <svg width={canvas.ww} height={canvas.hh}>
            <AttrNetwork
              data={layout}
              canvas={canvas}
              filter={this.state.filterValue}
            />
          </svg>
        </div>
      </div>
    );
  }
}
