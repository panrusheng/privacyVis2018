import React from 'react';
import { inject, observer } from 'mobx-react';
import './RecView.scss';
import * as d3 from 'd3';
import SubInfer from './RecInfer/SubInfer'
import { toJS } from 'mobx';

@inject(['store'])
@observer
export default class RecView extends React.Component {
  state = {
  };
  // constructor(props) {
  //   super(props);
  // }

  componentDidMount() {
    let g1 = d3.select('#rec-arrow-row').append('g');
    g1.append('defs').attr('class', 'rec-arrow')
      .append('marker')
      .attr('id', 'arrow-r')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#999');
    g1.append('line')
      .attr('class', 'rec-arrow')
      .attr('x1', 25)
      .attr('y1', 880)
      .attr('x2', 25)
      .attr('y2', 7)
      .attr('marker-end', 'url(#arrow-r)')
      .style('stroke', '#ccc')
      .style('stroke-width', 6);
    g1.append('text')
      .attr('transform', 'rotate(90) translate(400, -35)')
      .style('text-anchor', 'middle')
      .style('fill', '#999')
      .text('Number of occurrence');
    let g2 = d3.select('#rec-arrow-col').append('g');
    
    g2.append('line')
      .attr('class', 'rec-arrow')
      .attr('x1', 220)
      .attr('y1', 20)
      .attr('x2', 873)
      .attr('y2', 20)
      .attr('marker-end', 'url(#arrow-r)')
      .style('stroke', '#ccc')
      .style('stroke-width', 6);
    g2.append('text')
      .attr('transform', 'translate(550, 40)')
      .style('text-anchor', 'middle')
      .style('fill', '#999')
      .text('Utility loss');
  }

  componentDidUpdate() {
  }

  componentWillMount() {
    this.props.store.getRecList()
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
    if (recList.group. length === 0) return (<div />);
    const recData = this.setPosition(recList.group[recNum]);
    const ww = 218, hh = 198, width = 900, height = 680;

    return (
      <div className="rec-view">
        <div>
          <div className="view-title">Solution Recommendation View</div>
          <div className="operation">
            <div className="rec-overview">
              <svg width={width} height={height}>
                <SubInfer data={recData} sch={{dL:[]}} rec={-1} ww={width} hh={height} name={"rec-tr" + recNum} />
              </svg>
            </div>
            <div className="rec-solution">
              {recList.rec[recNum] && recList.rec[recNum].map((dd, ii) => (
                <div className="rec-td" key={"rec-graph" + recNum + "-" + ii}>
                  <svg width={ww} height={hh}>
                    <SubInfer data={recData[recNum]} sch={dd} rec={recSelectedList[recNum][ii]} ww={ww} hh={hh} name={"rec-graph" + recNum + "-" + ii} />
                  </svg>
                </div>
              ))}
            </div>
            <div className="rec-col-arrow" style={{ width: 880, height: 60 }}>
              <svg width="100%" height="100%" id="rec-arrow-col" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
