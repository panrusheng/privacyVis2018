import React from 'react';
import './AttrInitialize.scss';
import Numerical from './Numerical.js';
import Categorical from './Categorical.js';
import { ContextMenu, ContextMenuTrigger } from 'react-contextmenu';
import { hideMenu } from 'react-contextmenu/modules/actions';
import MergePanel from './MergePanel.js';
import { inject, observer } from 'mobx-react';
import { Checkbox } from 'antd';

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
    if (width < 280 || !width) {
      width = 280;
    } else if (width > 320) {
      width = 320;
    }

    width -= 20; //for margin

    const height = Math.ceil(h - 220);

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

  toggleAttrSensitive(attrName) {
    const attr = this.props.store.selectedAttributes.find(
      item => item.attrName === attrName
    );
    this.props.store.updateAttr(attrName, { sensitive: !attr.sensitive });
  }

  toggleUtility(attrName) {
    const attr = this.props.store.selectedAttributes.find(
      item => item.attrName === attrName
    );
    this.props.store.updateAttr(attrName, {
      utility: attr.utility === undefined ? 0 : undefined
    });
  }

  updateUtility(attrName, value) {
    let utility = parseFloat(value);
    if (isNaN(utility)) utility = 0;
    if (utility > 1) utility = 1;
    if (utility < 0) utility = 0;
    this.props.store.updateAttr(attrName, { utility });
  }

  handleUtilityChange(attrName, value) {
    this.props.store.updateAttr(attrName, { utility: value });
  }

  renderAttr(attr) {
    const { attrSize } = this.state;

    switch (attr.type) {
      case 'numerical': {
        return (
          <Numerical
            addBreakPoint={this.addBreakPoint}
            removeBreakPoint={this.removeBreakPoint}
            updateBreakPoint={this.updateBreakPoint}
            attr={attr}
            {...attrSize}
          />
        );
      }
      case 'categorical': {
        return (
          <Categorical openMenu={this.openMenu} {...attrSize} attr={attr} />
        );
      }
      default:
        return null;
    }
  }

  render() {
    const { selectedAttributes } = this.props.store;
    const { x, y, current, groups } = this.state;
    return (
      <div className="attr-init-view">
        <div className="view-title">Event Initialize</div>
        <div
        className="attr-init"
        ref={dom => {
          if (dom) this.wrapper = dom;
        }}
      >
        {selectedAttributes.map(attr => (
          <div className="chart" key={attr.attrName}>
            <div className="attr-info">
              <div className="title">{attr.attrName}</div>
              <div>
                <div className="form-block">
                  <Checkbox
                    onChange={() => this.toggleAttrSensitive(attr.attrName)}
                    checked={attr.sensitive}
                  />
                  Sensitive
                </div>
                <div className="form-block">
                  <Checkbox
                    checked={attr.utility !== undefined}
                    onChange={() => this.toggleUtility(attr.attrName)}
                  />
                  Utility {attr.utility !== undefined && ':'}
                  {attr.utility !== undefined && (
                    <input
                      type="text"
                      size={new String(attr.utility).length + 1}
                      value={attr.utility}
                      onChange={e =>
                        this.handleUtilityChange(attr.attrName, e.target.value)
                      }
                      onBlur={e =>
                        this.updateUtility(attr.attrName, e.target.value)
                      }
                    />
                  )}
                </div>
              </div>
            </div>
            {this.renderAttr(attr)}
          </div>
        ))}
        <ContextMenu
          id="merge-panel-menu"
          onShow={() => {
            this.panel && this.panel.resetState();
          }}
        >
          <MergePanel
            ref={dom => (this.panel = dom)}
            confirmMerge={this.confirmMerge}
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
      </div>
      </div>
    );
  }
}
