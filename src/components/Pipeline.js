import React from 'react';
import '../assets/style/Pipeline.scss';

export default class Pipeline extends React.Component {
  state = {
    current: 1
  };
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
      <div className="pipeline-view">
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
      </div>
    );
  }
}
