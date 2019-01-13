import React from 'react';
import { inject, observer } from 'mobx-react';
import CheckedIcon from '../assets/image/checked.svg';
import NotCheckedIcon from '../assets/image/notchecked.svg';
import axis from '../utils/axios'
import './LoadData.scss';

@inject(['store'])
@observer
export default class LoadData extends React.Component {
    state = {
        currentDataset: null,
        datasets: [],
        checkedIndex: [],
    }

    componentDidMount() {
        this.getAllDataSet();
    }

    toggleCheck(index) {
        let checkedIndex = [...this.state.checkedIndex];
        
        if (checkedIndex.findIndex(item => item === index) >= 0) {
            checkedIndex = checkedIndex.filter(item => item !== index);
        } else {
            checkedIndex.push(index);
        }

        this.setState({ checkedIndex });
    }

    getAllDataSet() {
        axis.post('/load_data')
            .then(data => {
                const attrList = [];
                for (const attrName in data.attrList) {
                    attrList.push({ attrName, ...data.attrList[attrName] });
                }

                this.setState({
                    datasets: [{
                        dataset: 'user',
                        attrList,
                    }],
                    currentDataset: 'user',
                });
            });
    }

    render() {
        const { datasets, currentDataset, checkedIndex } = this.state;
        const currentAttrList = (datasets.find(item => item.dataset === currentDataset) || {}).attrList || [];

        return (
            <div className="load-data">
                <div className="datasets">
                    { datasets.map(item => <div className={`button ${item.dataset === currentDataset ? 'active' : ''}`}>{item.dataset}</div>) }
                </div>
                <div className="attr-list">
                    { currentAttrList.map((attr, index) => (
                        <div className="attr-list-item">
                            <div onClick={() => this.toggleCheck(index)}>{
                                checkedIndex.findIndex(item => item === index) >= 0 ? <img src={CheckedIcon} /> : <img src={NotCheckedIcon} />
                            }</div>
                            <div>{attr.attrName}</div>
                            <div>{attr.type}</div>
                            <div>{attr.description}</div>
                        </div>
                    )) }
                </div>
            </div>
        )
    }
}