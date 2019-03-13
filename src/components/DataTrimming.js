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
import SlashIcon from '../assets/image/stripe.png'
@inject(['store'])
@observer
export default class DistTrimming extends React.Component {
  constructor(props) {
    super(props);
    this.setSize = this.setSize.bind(this);
    // this.scrollLeft = this.scrollLeft.bind(this);
    // this.scrollRight = this.scrollRight.bind(this);
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
    // this.scrollLeft();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
  }

  componentWillMount() {
    // this.props.store.getTrimList();
  }

  setSize() {
    const dom = this.wrapper;
    const count = (this.props.store.selectedAttributes || []).length;
    if (!count || !dom) return;
    const { height: h, width: w } = dom.getBoundingClientRect();
    let height = 200;
    let width = w - 40;
    // let width = Math.ceil(w / count);
    // if (width < 200 || !width) {
    //   width = 200;
    // } else if (width > 320) {
    //   width = 320;
    // }

    // width -= 35; //for margin

    // const height = Math.ceil(h - 90);

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

  // scrollRight() {
  //   let x = parseInt(d3.select('.attr-trim').style('left'));
  //   if (!x) {
  //     d3.select('.attr-trim').style('left', 0);
  //     x = 0;
  //   }
  //   const w = this.state.attrSize.width;
  //   const count = (this.props.store.selectedAttributes || []).length;
  //   const maxDistance = parseInt(d3.select('.trim-content').style('width')) - count * (w + 40);
  //   const moveLeft = (x - w >= maxDistance) ? x - w : maxDistance;
  //   d3.select('.attr-trim').transition().style('left', moveLeft + 'px').duration(200);
  //   d3.select('.trim-left').attr('class', 'trim-left');
  //   if (moveLeft === maxDistance) d3.select('.trim-right').attr('class', 'trim-right trim-stop');
  // }

  // scrollLeft() {
  //   let x = parseInt(d3.select('.attr-trim').style('left'));
  //   if (!x) {
  //     d3.select('.attr-trim').style('left', 0);
  //     x = 0;
  //   }
  //   const w = this.state.attrSize.width;
  //   const moveLeft = (x + w >= 0) ? 0 : (x + w);
  //   d3.select('.attr-trim').transition().style('left', moveLeft + 'px').duration(200);
  //   d3.select('.trim-right').attr('class', 'trim-right');
  //   if (moveLeft === 0) d3.select('.trim-left').attr('class', 'trim-left trim-stop');
  // }

  getCatePerRow() {
    const { trimList } = this.props.store;
    const cateAttrs = toJS(trimList).filter(({ type }) => type === 'categorical');
    let binMax = 10;
    const binTotal = cateAttrs.reduce((p, v) => p + v.data.length, 0);
    let rows = [];

    for (let i =0 ; i < Math.ceil(binTotal / cateAttrs.length); ++i) {
      rows.push({ total: 0, attrs: [] });
    }
  
    cateAttrs.forEach((attr) => {
      let max = -1;
      let t = -1;
      for (let i = 0; i < rows.length; ++i) {
        if (rows[i].total + attr.data.length <= binMax && binMax - rows[i].total - attr.data.length > max) {
          max = binMax - rows[i].total - attr.data.length;
          t = i;
        } 
      }

      if (t < 0) {
        rows.push({ attrs: [attr], total: attr.data.length });
      } else {
        rows[t].attrs.push(attr);
        rows[t].total += attr.data.length;
      }
    })

    return rows.filter(r => r.total > 0).map(({ attrs }) => attrs);
  }

  renderAttr(attr, width) {
    const { attrSize } = this.state;

    switch (attr.type) {
      case 'numerical': {
        return (
          <NumeTrim data={attr.data} {...attrSize} attrName={attr.attrName} trimmed={attr.trimmed}
          utilityDic = {this.props.store.eventUtilityList} />
        );
      }
      case 'categorical': {
        return (
          <CateTrim {...attrSize} width={width} data={attr.data} attrName={attr.attrName} trimmed={attr.trimmed} />
        );
      }
      default:
        return null;
    }
  }

  render() {
    const trimList = toJS(this.props.store.trimList);
    // const flag = (trimList || []).length * (this.state.attrSize.width + 35) > 940;
    const rowCate = this.getCatePerRow();
    return (
      <div className="data-trim-view">
        <div className="view-title">Data Trimming View</div>
        <div className="trim-content">
          <div className="attr-trim" ref={dom => {
            if (dom) this.wrapper = dom;
          }}>
            {trimList.filter(attr => attr.type === 'numerical').map(attr => (
              <div className="chart" key={'trim-' + attr.attrName}>
                <div className="attr-info">
                  <div className="title" >{attr.attrName}</div>
                  <div className="form-block">
                    <Button onClick={() => this.trim(attr.attrName) }>{attr.trimmed? "Cancel" : "Trim"}</Button>
                  </div>
                </div>
                {this.renderAttr(attr)}
              </div>
            ))}
            {rowCate.map((row, idx) => (
              <div key={idx} style={{ display: 'flex' }}>
                { row.map((attr) => (
                  <div className="chart" key={'trim-' + attr.attrName}>
                    <div className="attr-info">
                      <div className="title">{attr.attrName}</div>
                      <div className="form-block">
                        <Button onClick={() => this.trim(attr.attrName) }>{attr.trimmed? "Cancel" : "Trim"}</Button>
                      </div>
                    </div>
                    {this.renderAttr(attr, this.state.attrSize.width / row.length - 20)}
                  </div>
                )) }
              </div>
            )) }
          </div>
        </div>
        <div className="trim-legend">
          <div className='trim-legend-unit'>
            <div className="trim-original" />
            <label>Original distribution</label>
          </div>
          <div className='trim-legend-unit'>
            <div className="trim-current" >
              <div className="trim-tt" style={{backgroundImage: `url(${SlashIcon})`}}/>
            </div>
            <label>Current distribution</label>
          </div>
          <div className='trim-legend-unit'>
            <div className="trim-trim" style={{backgroundImage: `url(${SlashIcon})`}}/>
            <label>Suggested removal parts</label>
          </div>
        </div>
      </div>
    );
  }
}
