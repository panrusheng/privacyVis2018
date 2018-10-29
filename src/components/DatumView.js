import React from 'react';
import './DatumView.scss';

export default class DatumView extends React.Component {
  state = {
    currentView: 1
  };
  render() {
    const { currentView } = this.state;
    const tabs = [
      {
        name: 'Table View',
        id: 1
      },
      {
        name: 'Graph View',
        id: 2
      }
    ];

    return (
      <div className="data-view">
        <div className="tabs">
          {tabs.map((item, index) => (
            <React.Fragment key={item.id}>
              <div
                className={'tab' + (currentView === item.id ? ' active' : '')}
                onClick={() => this.setState({ currentView: item.id })}
              >
                {item.name}
              </div>
              {index !== tabs.length - 1 && '/'}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
}
