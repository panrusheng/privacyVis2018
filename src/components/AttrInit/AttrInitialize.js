import React from 'react';
import './AttrInitialize.scss';
import Numerical from './Numerical.js';
import Categorical from './Categorical.js';
import { ContextMenu, ContextMenuTrigger } from 'react-contextmenu';
import { showMenu, hideMenu } from 'react-contextmenu/modules/actions';
import MergePanel from './MergePanel.js';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import { Checkbox, Input } from 'antd';

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
  }

  state = {
    open: false,
    x: 0,
    y: 0,
    current: undefined,
    groups: undefined,
    attrName: undefined,
    attrSize: {
      height: 1000,
      width: 300
    }
  };

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    if (this.props.store.selectedAttributes.length <= 0) return;

    if (this.wrapper) {
      const { width } = this.wrapper.getBoundingClientRect();
      this.setState({
        attrSize: {
          width: width / this.props.store.selectedAttributes.length - 20
        }
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    if (this.props.store.selectedAttributes.length <= 0) return;
    if (this.wrapper) {
      const { width } = this.wrapper.getBoundingClientRect();
      this.setState({
        attrSize: {
          width: width / this.props.store.selectedAttributes.length - 20
        }
      });
    }
  }

  hideMenu() {
    this.setState({ open: false });
  }

  openMenu(data, attrName, event) {
    // showMenu({
    //   position: {x: event.clientX, y: event.clientY},
    //   trigger: event.target,
    //   id: 'merge-panel-menu'
    // });
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
      <div className="attr-init" ref={dom => (this.wrapper = dom)}>
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
    );
  }
}
