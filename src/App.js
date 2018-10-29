import React from 'react';
import Pipeline from './components/Pipeline';
import Attribute from './components/Attribute';
import DataView from './components/DatumView';
import './App.scss';
import { inject } from 'mobx-react';

@inject(['store'])
class App extends React.Component {
  state = {
    current: 1
  };
  componentDidMount() {
    this.props.store.fetchAttributes();
  }

  render() {
    const { current } = this.state;
    const pipelineSteps = [
      {
        id: 1,
        name: 'Attribute Initialization'
      },
      {
        id: 2,
        name: 'Data Process'
      },
      {
        id: 3,
        name: 'Result Verification'
      }
    ];

    return (
      <div className="app">
        <div className="pipeline-btn-group">
          {pipelineSteps.map(item => (
            <div
              onClick={() => this.setState({ current: item.id })}
              className={
                'pipeline-button' + (current === item.id ? ' active' : '')
              }
              key={item.id}
            >
              <span className="content">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="row">
          <div className="col">
            <Attribute />
            <DataView />
          </div>
          <div className="col">
            <Pipeline current={this.state.current} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
