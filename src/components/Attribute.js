import React from 'react';
import { Switch, Slider } from 'antd';
import * as d3 from 'd3';
import './Attribute.scss';
import '../components/AttrView/AttrNetwork';
import AttrNetwork from '../components/AttrView/AttrNetwork';
import { inject } from 'mobx-react';
@inject(['store'])
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
  forceDirected(n, l, ww, hh) {
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
          .iterations(100)
      )
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .stop();
    // Use a timeout to allow the rest of the page to load first.
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

  render() {
    let data;
    let canvas;
    data = {
      nodes: [
        { id: 'Myriel', attrName: 1 },
        { id: 'Napoleon', attrName: 3 },
        { id: 'Mlle', attrName: 1 },
        { id: 'Mme', attrName: 3 },
        { id: 'CountessdeLo', attrName: 1 },
        { id: 'Geborand', attrName: 2 },
        { id: 'Champtercier', attrName: 1 }
      ],
      links: [
        { source: 0, target: 1, value: 0.2 },
        { source: 2, target: 6, value: 0.8 },
        { source: 3, target: 4, value: 0.7 },
        { source: 1, target: 3, value: 0.4 },
        { source: 5, target: 6, value: 0.4 },
        { source: 1, target: 5, value: 0.6 },
        { source: 2, target: 3, value: 0.8 },
        { source: 3, target: 0, value: 0.6 },
        { source: 1, target: 4, value: 0.5 },
        { source: 5, target: 3, value: 0.3 },
        { source: 0, target: 5, value: 0.8 }
      ]
    };
    const filterRange = d3.extent(data.links, d => d.value);
    canvas = { ww: 520, hh: 460 };
    let layout = this.forceDirected(
      data.nodes,
      data.links,
      canvas.ww,
      canvas.hh
    );
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
