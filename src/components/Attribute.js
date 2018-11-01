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
    filterValue: 0.3,
    attributes: {
      attr: [{ name: '??' }],
      description: { name: { '??': '???' }, unit: { '??': '???' } }
    }
  };

  changeCho(name) {
    if (d3.select('#lodused' + name).attr('class') == 'lodDisable') {
      d3.select('#lodused' + name)
        .attr('class', 'lodActive')
        .attr('src', './image/check.svg');
      this.props.store.addAttributes(name);
    } else {
      d3.select('#lodused' + name)
        .attr('class', 'lodDisable')
        .attr('src', './image/notcheck.svg');
      this.props.store.removeAttributes(name);
    }
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

  render() {
    let data;
    let canvas;
    return (
      <div className="attribute-view">
        <div className="title">Attribute View</div>
        {this.props.store.systemStage === 0 ? (
          <div className="data-list">
            <ul className="dataset">
              <li
                id="dataset-two"
                className="dataset-tab"
                onClick={() => this.handleTabChange('data2', 'dataset-two')}
              >
                Enterprises
              </li>
              <li
                id="dataset-three"
                className="dataset-tab"
                onClick={() => this.handleTabChange('data3', 'dataset-three')}
              >
                Residents
              </li>
              <li
                id="dataset-four"
                className="dataset-tab"
                onClick={() => this.handleTabChange('data4', 'dataset-four')}
              >
                Graduates
              </li>
            </ul>
            <div className="lodTh">
              <p style={{ position: 'absolute', left: 60 }}>Attr</p>
              <p style={{ position: 'absolute', left: 140 }}>Description</p>
            </div>
            <div className="lodAuto">
              <table className="lodTable">
                <tbody>
                  {this.state.attributes.attr.map((at, i) => (
                    <tr className="lodTr" key={i}>
                      <td
                        className="dataset-check"
                        style={{ width: '60px', paddingLeft: '20px' }}
                      >
                        <img
                          src={'./image/notcheck.svg'}
                          id={'lodused' + at.name}
                          className={'lodDisable'}
                          onClick={name => {
                            this.changeCho(at.name);
                          }}
                        />
                      </td>
                      <td style={{ width: '120px' }}>{at.name}</td>
                      <td style={{ width: '350px' }}>
                        {this.state.attributes.description.name[at.name]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="attr-operations">
            <div className="operation">
              <span className="label">Correlation filter:</span>
              <Slider
                min={0.3}
                max={1}
                step={0.01}
                onChange={value => this.setState({ filterValue: value })}
                value={this.state.filterValue}
              />
            </div>
            <div className="operation">
              <span className="label">Merge attribute:</span>
              <Switch
                checked={this.state.mergeAttribute}
                onChange={value => this.setState({ mergeAttribute: value })}
              />
            </div>
            <div className="attr-network">
              <svg width="100%" height="100%">
                <AttrNetwork data={data} canvas={canvas} />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
}
