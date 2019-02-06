import React from 'react';
import { Button } from 'antd';
import './DataTrimming.scss';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import NumeTrim from './DataTrim/NumeTrim';
import CateTrim from './DataTrim/CateTrim';
@inject(['store'])
@observer
export default class DistTrimming extends React.Component {
  constructor(props) {
    super(props);
    this.setSize = this.setSize.bind(this);
  }

  state = {
    attrSize: {
      height: 0,
      width: 0
    }
  };

  componentDidMount() {
    window.addEventListener('resize', this.setSize);
    if (this.props.store.selectedAttributes.length <= 0) return;
    if (this.wrapper) {
      this.setSize();
    }
  }

  componentDidUpdate() {
    this.setSize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  setSize() {
    const dom = this.wrapper;
    const count = (this.props.store.selectedAttributes || []).length;
    if (!count || !dom) return;
    const { height: h, width: w } = dom.getBoundingClientRect();
    let width = Math.ceil(w / count);
    if (width < 200 || !width) {
      width = 200;
    } else if (width > 320) {
      width = 320;
    }

    width -= 15; //for margin

    const height = Math.ceil(h - 130);

    if (
      height === this.state.attrSize.height &&
      width === this.state.attrSize.width
    )
      return;

    this.setState({
      attrSize: {
        height,
        width
      }
    });
  }

  trim (attrName) {

  }

  renderAttr(attr) {
    const { attrSize } = this.state;

    switch (attr.type) {
      case 'numerical': {
        return (
          <NumeTrim
            attr={attr}
            {...attrSize}
          />
        );
      }
      case 'categorical': {
        return (
          <CateTrim {...attrSize} attr={attr} />
        );
      }
      default:
        return null;
    }
  }

  render() {
    const { selectedAttributes } = this.props.store;
    return (
      <div className="data-trim-view">
        <div className="title">Data Trimming View</div>
        <div className="attr-trim" ref={dom => {
            if (dom) this.wrapper = dom;
          }}>
          {selectedAttributes.map(attr => (
            <div className="chart" key={attr.attrName}>
              <div className="attr-info">
                <div className="title">{attr.attrName}</div>
                <div className="form-block">
                  <Button onChange={this.trim(attr.attrName)}>Trim</Button>
                </div>
              </div>
              {this.renderAttr(attr)}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
