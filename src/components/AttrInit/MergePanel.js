import React from 'react';
import './MergePanel.scss';

export default class MergePanel extends React.Component {
  constructor(props) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.hideMenu = this.hideMenu.bind(this);
    this.resetState = this.resetState.bind(this);
  }

  state = {
    selectedGroups: [],
    groupName: ''
  };

  componentDidMount() {
    window.addEventListener('click', this.hideMenu);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.hideMenu);
  }

  resetState() {
    this.setState({ selectedGroups: [], groupName: '' });
  }

  hideMenu(e) {
    if (e.target.classList.contains('merge-panel')) {
      this.props.hideMenu && this.props.hideMenu();
    } else {
      e.preventDefault();
    }
  }

  addSelectedGroup(item) {
    if (this.state.selectedGroups.find(g => g.name === item.name)) return;
    this.setState({
      selectedGroups: [...this.state.selectedGroups, item]
    });
  }

  removeSelectedGroup(name) {
    const selectedGroups = this.state.selectedGroups.slice();
    const index = selectedGroups.findIndex(item => item.name === name);
    if (index >= 0) {
      selectedGroups.splice(index, 1);
      this.setState({ selectedGroups });
    }
  }

  demergeGroup() {
    this.props.demergeGroup(this.props.current.name);
  }

  handleConfirm() {
    const { groupName, selectedGroups } = this.state;
    const disabled = !groupName || selectedGroups.length === 0;
    if (disabled) return;

    this.props.confirmMerge &&
      this.props.confirmMerge(this.state.groupName, this.state.selectedGroups);
  }

  handleClose() {
    this.props.hideMenu && this.props.hideMenu();
  }

  render() {
    const { groups = [], current = {} } = this.props;
    const { selectedGroups, groupName } = this.state;
    const disabled = !groupName || selectedGroups.length === 0;

    return (
      <div className="merge-panel">
        <div className="title">Merge Groups</div>
        <div className="group-list">
          <div className="list-title">Groups:</div>
          <div className="groups">
            {groups.map(
              item =>
                item.name !== current.name && (
                  <div
                    className={`group ${
                      selectedGroups.findIndex(t => t.name === item.name) >= 0
                        ? 'active'
                        : ''
                    }`}
                    key={item.name}
                    onClick={() => this.addSelectedGroup(item)}
                  >
                    <div className="name">{item.name}</div>
                  </div>
                )
            )}
          </div>
        </div>
        <div className="group-list">
          <div className="list-title">Selected Groups:</div>
          <div className="groups">
            {selectedGroups.length > 0 ? (
              selectedGroups.map(item => (
                <div
                  className="group active"
                  key={item.name}
                  onClick={() => this.removeSelectedGroup(item.name)}
                >
                  <div className="close-btn" />
                  <div className="name">{item.name}</div>
                </div>
              ))
            ) : (
              <div className="empty">select groups to merge</div>
            )}
          </div>
        </div>
        <div className="row group-name">
          <div>Group Name:</div>
          <input
            className="group-name-input"
            value={this.state.groupName}
            onChange={e => this.setState({ groupName: e.target.value })}
          />
        </div>
        <div className="row">
          <div
            className={`button ${!disabled ? '' : 'disabled'}`}
            onClick={this.handleConfirm}
          >
            Confirm
          </div>
          { current.categories && current.categories.length > 1 && (
            <div className="button" onClick={() => this.demergeGroup()}>
              Demerge
            </div>
          )}
          <div className="button" onClick={this.handleClose}>
            Cancel
          </div>
        </div>
      </div>
    );
  }
}
