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
    // this.scrollLeft = this.scrollLeft.bind(this);
    // this.scrollRight = this.scrollRight.bind(this);
    this.trim = this.trim.bind(this);
  }

  state = {
    attrSize: {
      height: 200,
      width: 914,
    }
  };

  trim(attrName) {
    this.props.store.trim(attrName);
  }

  getCatePerRow() {
    const { trimList } = this.props.store;
    const cateAttrs = toJS(trimList).filter(({ type }) => type === 'categorical');
    let binMax = 10;
    let rows = [];

    let lenArr = cateAttrs.map(({ data }) => data.length).filter(l => l <= binMax);
    lenArr.sort((a, b) => a - b);
    let temp = [];
    let cur = 0;
    for (let i = 0; i < lenArr.length; ++i) {
      if (cur > temp.length - 1) temp.push(0);

      if (temp[cur] + lenArr[i] <= binMax) {
        temp[cur] += lenArr[i];
      } else {
        temp.push(0);
        temp[++cur] = lenArr[i];
      }
    }
    
    for (let i =0 ; i < temp.length; ++i) {
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
        let emptyRow = rows.findIndex(r => r.total === 0);
        if (emptyRow >= 0) {
          rows[emptyRow].attrs.push(attr);
          rows[emptyRow].total = attr.data.length;
        }
        else rows.push({ attrs: [attr], total: attr.data.length });
      } else {
        rows[t].attrs.push(attr);
        rows[t].total += attr.data.length;
      }
    })

    rows.forEach(row => {
      row.attrs.sort((a, b) => {
        return b.data.length - a.data.length;
      });
    });

    rows.sort((a, b) => {
      return b.total - a.total;
    });

    return rows.filter(r => r.total > 0);
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

  handleTitleMouseOver(e, attrName) {
    let attr = this.props.store.selectedAttributes.find(a => a.attrName === attrName);
    if (attr) {  
      d3.select('.tooltip').html(attr.description)
        .style('left', (e.clientX + 15) + 'px')
        .style('display', 'block')
        .style('top', (e.clientY - 35) + 'px');
    } else {
      d3.select('.tooltip').style('display', 'none');
    }
  }

  handleTitleMouseLeave() {
    d3.select('.tooltip').style('display', 'none');
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
                  <div className="title" onMouseLeave={this.handleTitleMouseLeave} onMouseOver={e => this.handleTitleMouseOver(e, attr.attrName)} >{attr.attrName}</div>
                  <div className="form-block">
                    <Button onClick={() => this.trim(attr.attrName) }>{attr.trimmed? "Cancel" : "Trim"}</Button>
                  </div>
                </div>
                {this.renderAttr(attr)}
              </div>
            ))}
            {rowCate.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                { row.attrs.map((attr) => (
                  <div className="chart" key={'trim-' + attr.attrName}>
                    <div className="attr-info" style={{marginBottom: 20}}>
                      <div className="title" onMouseLeave={this.handleTitleMouseLeave} onMouseOver={e => this.handleTitleMouseOver(e, attr.attrName)} >{attr.attrName}</div>
                      <div className="form-block">
                        <Button onClick={() => this.trim(attr.attrName) }>{attr.trimmed? "Cancel" : "Trim"}</Button>
                      </div>
                    </div>
                    {this.renderAttr(attr, 45 + (this.state.attrSize.width - 60 * row.attrs.length + 15) * (attr.data.length / row.total))}
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
