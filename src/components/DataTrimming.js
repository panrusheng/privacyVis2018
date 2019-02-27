import React from 'react';
import { Button } from 'antd';
import './DataTrimming.scss';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
// import { toJS } from 'mobx';
import * as d3 from 'd3';
import NumeTrim from './DataTrim/NumeTrim';
import CateTrim from './DataTrim/CateTrim';
import leftIcon from '../assets/image/left-arrow.svg';
import rightIcon from '../assets/image/right-arrow.svg';
@inject(['store'])
@observer
export default class DistTrimming extends React.Component {
  constructor(props) {
    super(props);
    this.setSize = this.setSize.bind(this);
    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollRight = this.scrollRight.bind(this);
    this.trim = this.trim.bind(this);
  }

  state = {
    attrSize: {
      height: 0,
      width: 0
    }
  };

  componentDidMount() {
    window.addEventListener('resize', this.setSize);
    if (this.props.store.trimList.length <= 0) return;
    if (this.wrapper) {
      this.setSize();
    }
  }

  componentDidUpdate() {
    this.setSize();
    this.scrollLeft();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  componentWillMount() {
    this.props.store.getTrimList();
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

    width -= 35; //for margin

    const height = Math.ceil(h - 90);

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

  trim(attrName) {
    this.props.store.trim(attrName);
  }

  scrollRight() {
    let x = parseInt(d3.select('.attr-trim').style('left'));
    if (!x) {
      d3.select('.attr-trim').style('left', 0);
      x = 0;
    }
    const w = this.state.attrSize.width;
    const count = (this.props.store.selectedAttributes || []).length;
    const maxDistance = parseInt(d3.select('.trim-content').style('width')) - count * (w + 35);
    const moveLeft = (x - w >= maxDistance) ? x - w : maxDistance;
    d3.select('.attr-trim').transition().style('left', moveLeft + 'px').duration(200);
    d3.select('.trim-left').attr('class', 'trim-left');
    if (moveLeft === maxDistance) d3.select('.trim-right').attr('class', 'trim-right trim-stop');
  }

  scrollLeft() {
    let x = parseInt(d3.select('.attr-trim').style('left'));
    if (!x) {
      d3.select('.attr-trim').style('left', 0);
      x = 0;
    }
    const w = this.state.attrSize.width;
    const moveLeft = (x + w >= 0) ? 0 : (x + w);
    d3.select('.attr-trim').transition().style('left', moveLeft + 'px').duration(200);
    d3.select('.trim-right').attr('class', 'trim-right');
    if (moveLeft === 0) d3.select('.trim-left').attr('class', 'trim-left trim-stop');
  }

  renderAttr(attr) {
    const { attrSize } = this.state;

    switch (attr.type) {
      case 'numerical': {
        const data = [{ label: 0.3, curV: 28, oriV: 34, triV: 25 },
        { label: 0.4, curV: 2, oriV: 2, triV: 2 },
        { label: 0.9, curV: 9, oriV: 10, triV: 7 }];
        return (
          <NumeTrim data={data} {...attrSize} attrName={attr.attrName} trimmed={attr.trimmed}/>
        );
      }
      case 'categorical': {
        //const data = attr.group
        const data = [{ name: 'Western', curV: 20, oriV: 21, triV: 16 },
        { name: 'S.Eastern', curV: 10, oriV: 12, triV: 10 },
        { name: 'N.Eastern', curV: 28, oriV: 34, triV: 20 },
        { name: 'Belfast', curV: 3, oriV: 4, triV: 3 }];
        return (
          <CateTrim {...attrSize} data={data} attrName={attr.attrName} trimmed={attr.trimmed}/>
        );
      }
      default:
        return null;
    }
  }

  render() {
    const trimList = toJS(this.props.store.trimList);
    const flag = (trimList || []).length * (this.state.attrSize.width + 35) > 940;
    return (
      <div className="data-trim-view">
        <div className="view-title">Data Trimming View</div>
        <div className="trim-content">
          <div className="attr-trim" ref={dom => {
            if (dom) this.wrapper = dom;
          }}>
            {trimList.map(attr => (
              <div className="chart" key={'trim-' + attr.attrName}>
                <div className="attr-info">
                  <div className="title">{attr.attrName}</div>
                  <div className="form-block">
                    <Button onClick={() => this.trim(attr.attrName) } disabled={attr.trimmed}>Trim</Button>
                  </div>
                </div>
                {this.renderAttr(attr)}
              </div>
            ))}
          </div>
          {flag ? (<input className="trim-left" onClick={this.scrollLeft} type="image" src={leftIcon}/>) : (null)}
          {flag ? (<input className="trim-right" onClick={this.scrollRight} type="image" src={rightIcon} />) : (null)}
        </div>
        <div className="trim-legend">
          <div className='trim-legend-unit'>
            <div className="trim-original" />
            <label>Original distribution</label>
          </div>
          <div className='trim-legend-unit'>
            <div className="trim-current" />
            <label>Current distribution</label>
          </div>
          <div className='trim-legend-unit'>
            <div className="trim-trim" />
            <label>Suggested removal parts</label>
          </div>
        </div>
      </div>
    );
  }
}
