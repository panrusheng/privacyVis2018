import React from 'react';
import './AttrInitialize.scss';
import Numerical from './Numerical.js';
import Categorical from './Categorical.js';
import { ContextMenu, ContextMenuTrigger } from 'react-contextmenu';
import { hideMenu } from 'react-contextmenu/modules/actions';
import MergePanel from './MergePanel.js';
import { inject, observer } from 'mobx-react';
import { InputNumber, Input } from 'antd';
import * as d3 from 'd3';
import leftIcon from '../../assets/image/left-arrow.svg';
import rightIcon from '../../assets/image/right-arrow.svg';
import { toJS } from 'mobx';
// import { toJS } from 'mobx';

@inject(['store'])
@observer
export default class AttrInitialize extends React.Component {
  constructor(props) {
    super(props);

    this.openMenu = this.openMenu.bind(this);
    this.hideMenu = this.hideMenu.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.confirmMerge = this.confirmMerge.bind(this);
    this.addBreakPoint = this.addBreakPoint.bind(this);
    this.setSize = this.setSize.bind(this);
    this.removeBreakPoint = this.removeBreakPoint.bind(this);
    this.updateBreakPoint = this.updateBreakPoint.bind(this);
    this.demergeGroup = this.demergeGroup.bind(this);
    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollRight = this.scrollRight.bind(this);
    this.hideInputNumber = this.hideInputNumber.bind(this);
  }

  state = {
    open: false,
    x: 0,
    y: 0,
    current: undefined,
    groups: undefined,
    attrName: undefined,
    attrSize: {
      height: 0,
      width: 0
    },
    inputAttr: null,
    inputIndex: -1,
    inputX: 0,
    inputY: 0,
    inputValue: 0,
  };

  componentDidMount() {
    window.addEventListener('resize', this.setSize);
    if (this.props.store.selectedAttributes.length <= 0) return;
    if (this.wrapper) {
      this.setSize();
    }

    window.addEventListener('mousedown', this.hideInputNumber);
  }

  componentDidUpdate() {
    this.setSize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize);
    window.removeEventListener('mousedown', this.hideInputNumber);
  }

  hideInputNumber(e, pressEnter = false) {
    if (!this.state.inputAttr || (!pressEnter && this.numInputContainer && this.numInputContainer.contains(e.target)) || e.target.classList.contains('breakpoint-label')) return;

    let value = parseFloat(this.state.inputValue);
    if (isNaN(value)) return this.setState({ inputAttr: null });
    
    if (value < this.state.inputAttr.range[0]) value = this.state.inputAttr.range[0];
    if (value > this.state.inputAttr.range[1]) value = this.state.inputAttr.range[1];

    this.props.store.updateBreakPoint(this.state.inputAttr.attrName, this.state.inputIndex, value, true);
    this.setState({ inputAttr: null });
  }

  handleTitleMouseOver(e, attr) {
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

  setSize() {
    const dom = this.wrapper;
    const count = (this.props.store.selectedAttributes || []).length;
    if (!count || !dom) return;
    let height = 200;
    let width = 768;

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

  demergeGroup(groupName) {
    this.props.store.demergeGroup(groupName, this.state.attrName);

    hideMenu({ id: 'merge-panel-menu' });
  }

  handleResize() {
    if (
      !this.props.store.selectedAttributes ||
      this.props.store.selectedAttributes.length <= 0
    )
      return;
    if (this.wrapper) {
      this.setSize();
    }
  }

  hideMenu() {
    this.setState({ open: false });

    hideMenu({
      id: 'merge-panel-menu'
    });
  }

  openMenu(data, attrName, event) {
    this.trigger.handleContextMenu(event);

    const groups = this.props.store.selectedAttributes.find(
      item => item.attrName === attrName
    ).groups;

    this.setState({ current: data, groups, attrName });
  }

  confirmMerge(name, selectedGroups) {
    selectedGroups.push(this.state.current);
    this.props.store.mergeGroups(name, selectedGroups, this.state.attrName);

    hideMenu({
      id: 'merge-panel-menu'
    });
  }

  addBreakPoint(attrName, point) {
    this.props.store.addBreakPoint(attrName, point);
  }

  removeBreakPoint(attrName, index) {
    this.props.store.removeBreakPoint(attrName, index);
  }

  updateBreakPoint(attrName, index, value) {
    this.props.store.updateBreakPoint(attrName, index, value);
  }

  updateUtility(attrName, value) {
    let utility = parseFloat(value);
    if (isNaN(utility)) utility = 0;
    if (utility > 1) utility = 1;
    if (utility < 0) utility = 0;
    this.props.store.updateUtility(attrName, utility);
  }

  handleUtilityChange(attrName, value) {
    this.props.store.updateUtility(attrName, value);
  }

  scrollRight() {
    let x = parseInt(d3.select('.attr-init').style('left'));
    if (!x) {
      d3.select('.attr-init').style('left', 0);
      x = 0;
    }
    const w = this.state.attrSize.width;
    const count = (this.props.store.selectedAttributes || []).length;
    const maxDistance = parseInt(d3.select('.init-content').style('width')) - count * (w + 55);
    const moveLeft = (x - w >= maxDistance) ? x - w : maxDistance;
    d3.select('.attr-init').transition().style('left', moveLeft + 'px').duration(200);
    d3.select('.init-left').attr('class', 'init-left');
    if (moveLeft === maxDistance) d3.select('.init-right').attr('class', 'init-right init-stop');
  }

  scrollLeft() {
    let x = parseInt(d3.select('.attr-init').style('left'));
    if (!x) {
      d3.select('.attr-init').style('left', 0);
      x = 0;
    }
    const w = this.state.attrSize.width;
    const moveLeft = (x + w >= 0) ? 0 : (x + w);
    d3.select('.attr-init').transition().style('left', moveLeft + 'px').duration(200);
    d3.select('.init-right').attr('class', 'init-right');
    if (moveLeft === 0) d3.select('.init-left').attr('class', 'init-left init-stop');
  }

  getCatePerRow() {
    const { selectedAttributes } = this.props.store;
    const cateAttrs = toJS(selectedAttributes).filter(({ type }) => type === 'categorical');
    let binMax = 10;
    let rows = [];

    let lenArr = cateAttrs.map(({ groups }) => groups.length).filter(l => l <= binMax);
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
        if (rows[i].total + attr.groups.length <= binMax && binMax - rows[i].total - attr.groups.length > max) {
          max = binMax - rows[i].total - attr.groups.length;
          t = i;
        } 
      }

      if (t < 0) {
        let emptyRow = rows.findIndex(r => r.total === 0);
        if (emptyRow >= 0) {
          rows[emptyRow].attrs.push(attr);
          rows[emptyRow].total = attr.groups.length;
        }
        else rows.push({ attrs: [attr], total: attr.groups.length });
      } else {
        rows[t].attrs.push(attr);
        rows[t].total += attr.groups.length;
      }
    })

    rows.forEach(row => {
      row.attrs.sort((a, b) => {
        return b.groups.length - a.groups.length;
      });
    });

    rows.sort((a, b) => {
      return b.total - a.total;
    });

    if (rows.length === 2) {
      if (rows[0].total === 7 && rows[1].total === 5 && rows[0].attrs[0].groups.length === 3) {
        let attrs = [...rows[0].attrs, ...rows[1].attrs];
        attrs.sort((a, b) => b.groups.length - a.groups.length)
        rows[0].attrs = attrs.splice(0, 2);
        rows[1].attrs = attrs;

        rows[0].total = 6;
        rows[1].total = 6;
      }
    }

    return rows.filter(r => r.total > 0);
  }

  renderAttr(attr, width) {
    const { attrSize } = this.state;

    switch (attr.type) {
      case 'numerical': {
        return (
          <Numerical
            key={attr.attrName}
            addBreakPoint={this.addBreakPoint}
            removeBreakPoint={this.removeBreakPoint}
            updateBreakPoint={this.updateBreakPoint}
            editGBN={() => this.props.store.editGBN()}
            attr={attr}
            eventUtilityList={this.props.store.eventUtilityList}
            eventColorList={this.props.store.eventColorList}
            {...attrSize}
            setInput={(opt) => this.setState(opt)}
          />
        );
      }
      case 'categorical': {
        return (
          <Categorical
            key={attr.attrName}
            openMenu={this.openMenu}
            {...attrSize}
            width={width}
            attr={attr}
            eventUtilityList={this.props.store.eventUtilityList}
            eventColorList={this.props.store.eventColorList}
          />
        );
      }
      default:
        return null;
    }
  }

  render() {
    const { selectedAttributes } = this.props.store;
    const { x, y, current, groups } = this.state;
    const flag = (selectedAttributes || []).length * (this.state.attrSize.width + 35) > 940;
    const rowCate = this.getCatePerRow();
    let minRectWidth = this.state.attrSize.width;
    let chartMargin = 15;
    rowCate.forEach(({ attrs, total }) => {
      let rw = (this.state.attrSize.width - 45 * attrs.length - chartMargin * (attrs.length - 1)) / total;
      if (rw < minRectWidth) minRectWidth = rw;
    });

    return (
      <div className="attr-init-view">
        <div className="view-title">State Initialization View</div>
        <div className="init-content">
          <div
            className="attr-init"
            ref={dom => {
              if (dom) this.wrapper = dom;
            }}
          >
            {selectedAttributes.filter(attr => attr.type === 'numerical').map(attr => (
              <div className="chart" key={attr.attrName}>
                <div className="attr-info" style={attr.type === 'numerical' ? { height: 45, display:  'flex', justifyContent: 'center',
                  alignItems: 'center' } : undefined}>
                  <div className="title"
                    onMouseOver={(e) => this.handleTitleMouseOver(e, attr)}
                    onMouseLeave={this.handleTitleMouseLeave}
                    style={attr.type === 'numerical' ? {
                      marginRight: 15,
                      display: 'flex',
                      alignItems: 'center'} : undefined} 
                  >{attr.attrName}</div>
                  {attr.sensitive?(
                  <div className="form-block" style={{color: '#FE2901', 'fontSize': 25}}>
                    Sensitive
                  </div>
                  ):(
                    <div className="form-block">
                      <div style={{ margin: 5, display: 'flex', alignItems: 'center' }}>Utility:</div>
                      <InputNumber value={attr.utility} min={0} max={1} defaultValue={0} step={0.05} style={{ width: 70, textAlign: 'left' }} onChange={e =>
                      this.handleUtilityChange(attr.attrName, e)
                    } />
                  </div>
                  )}
                </div>
                {this.renderAttr(attr)}
              </div>
            ))}
            { rowCate.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                { row.attrs.map((attr) => (
                  <div className="chart" key={attr.attrName}>
                    <div className="attr-info">
                      <div className="title"
                        onMouseOver={(e) => this.handleTitleMouseOver(e, attr)}
                        onMouseLeave={this.handleTitleMouseLeave}>{attr.attrName}</div>
                      {attr.sensitive?(
                      <div className="form-block">
                        <p style={{color: '#FE2901', 'fontSize': 25}}>Sensitive</p>
                      </div>
                      ):(
                        <div className="form-block">
                          <p style={{ margin: 5 }}>Utility:</p>
                          <InputNumber value={attr.utility} min={0} max={1} defaultValue={0} step={0.05} style={{ width: 70, textAlign: 'left' }} onChange={e =>
                          this.handleUtilityChange(attr.attrName, e)
                        } />
                      </div>
                      )}
                    </div>
                    {this.renderAttr(attr, 45 + minRectWidth * attr.groups.length)}
                  </div>
                )) }
              </div>
            )) }
            <ContextMenu
              id="merge-panel-menu"
              onShow={() => {
                this.panel && this.panel.resetState();
              }}
            >
              <MergePanel
                ref={dom => (this.panel = dom)}
                confirmMerge={this.confirmMerge}
                demergeGroup={this.demergeGroup}
                hideMenu={this.hideMenu}
                position={{ x, y }}
                current={current}
                groups={groups}
              />
            </ContextMenu>
            <ContextMenuTrigger
              id="merge-panel-menu"
              ref={dom => (this.trigger = dom)}
            >
              <div />
            </ContextMenuTrigger>
            {this.state.inputAttr && <div ref={dom => this.numInputContainer = dom} className="num-input" style={{ position: 'fixed', top: this.state.inputY, left: this.state.inputX, width: 60 }}>
              <Input size="small" onPressEnter={e => this.hideInputNumber(e, true)} onChange={e => this.setState({ inputValue: e.target.value })} value={this.state.inputValue} />
            </div>}
          </div>
        </div>
      </div>
    );
  }
}
