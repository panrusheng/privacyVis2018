import React from 'react';
import { inject, observer } from 'mobx-react';
import CheckedIcon from '../assets/image/checked.svg';
import NotCheckedIcon from '../assets/image/notchecked.svg';
import HidenIcon from '../assets/image/blind.svg';
import axis from '../utils/axios'
import { Modal } from 'antd';
import axios from '../utils/axios';
import './LoadData.scss';
import { InputNumber } from 'antd';

const SearchAlgorithm = [ { name: 'K2', id: 'K2' },
{ name: 'Genetic Search', id: 'GeneticSearch' },
{ name: 'Hill Climber', id: 'HillClimber' },
{ name: 'LAGD Hill Climber', id: 'LAGDHillClimber' },
{ name: 'Local Score Search Algorithm',
  id: 'LocalScoreSearchAlgorithm' },
{ name: 'Repeated Hill Climber', id: 'RepeatedHillClimber' },
{ name: 'Simulated Annealing', id: 'SimulatedAnnealing' },
{ name: 'Tabu Search', id: 'TabuSearch' },
{ name: 'TAN', id: 'TAN' } ]

@inject(['store'])
@observer
export default class LoadData extends React.Component {
    state = {
        currentDataset: 'user',
        attrDescList: [],
        currentSelected: [],
        searchAlgorithm: 0,
    }

    datasets = ['user', 'student', 'home'];

    constructor(props) {
        super(props);

        this.uploadDataset = this.uploadDataset.bind(this);
        this.handleConfirm = this.handleConfirm.bind(this);

        this.inputElem = document.createElement('input');
        this.inputElem.setAttribute('type', 'file');
        this.inputElem.onchange = () => {
            const file = this.inputElem.files[0];
            const formData = new FormData();
            formData.set('dataset', file);
            axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                  }
            }).then(() => {
                // TODO
            })
        };
    }

    componentDidMount() {
        this.getDatasetDesc();
    }

    uploadDataset() {
        this.inputElem.click();
    }

    handleConfirm() {
        if (!this.state.currentDataset) return;
        const attributes = [];
        const li = this.state.attrDescList;
        
        li.forEach((attr, index) => {
            if (this.state.currentSelected[index] === 0) return;
            attributes.push({description: attr.description, attrName: attr.attrName, sensitive: this.state.currentSelected[index] === 2 });
        });

        this.props.store.selectedAttributes = attributes;
        this.props.store.gbnSearchAlgorithm = SearchAlgorithm[this.state.searchAlgorithm].id;
        this.props.store.setSystemStage(0);
        this.props.store.getGBN();
        // this.props.store.getAttrDistribution();
    }

    switchDataset(d) {
        this.setState({ currentDataset: d }, () => this.getDatasetDesc());
    }

    toggleCheck(index) {
        // let checkedIndex = [...this.state.checkedIndex];
        
        // if (checkedIndex.findIndex(item => item === index) >= 0) {
        //     checkedIndex = checkedIndex.filter(item => item !== index);
        // } else {
        //     checkedIndex.push(index);
        // }

        // this.setState({ checkedIndex });
        let currentSelected = [...this.state.currentSelected];
        currentSelected[index] = (currentSelected[index] + 1) % 3;
        this.setState({ currentSelected });
    }

    getDatasetDesc() {
        axis.post('/load_data', null, {
            params: {
                dataset: this.state.currentDataset,
            }
        })
        .then(data => {
            const attrList = [], selectedList = [];
            for (const attrName in data.attList) {
                attrList.push({ attrName, ...data.attList[attrName] });
                selectedList.push(0);
            }

            this.setState({
                attrDescList: attrList,
                currentSelected: selectedList,
            });
        });
    }

    render() {
        const { attrDescList, currentDataset, currentSelected } = this.state;

        return (
            <Modal
                visible
                closable={false}
                footer={<div className="footer-button" onClick={this.handleConfirm}>Confirm</div>}
                wrapClassName="attr-select-panel"
            >
                <div className="load-data">
                    <div className="dateset-list">
                        <div style={{ marginBottom: 10 }}>Datasets</div>
                        <div className="datasets">
                            { this.datasets.map(d => <div onClick={() => this.switchDataset(d)} className={`button ${d === currentDataset ? 'active' : ''}`}>{d}</div>) }
                        </div>
                    </div>
                    <div className="attr-list">
                        <div className="attr-list-item">
                            <div style={{ width: '15px' }}/>
                            <div style={{ width: '100px' }}>Attributes</div>
                            <div style={{ width: '100px' }}>Continuous</div>
                            <div style={{ width: '440px' }}>Description</div>
                        </div>
                    </div>
                    <div className="attr-list">
                        { attrDescList.map((attr, index) => (
                            <div className="attr-list-item">
                                <div onClick={() => this.toggleCheck(index)} style={{cursor: 'pointer'}} className="icon-button">{
                                    //checkedIndex.findIndex(item => item === index) >= 0 ? <img src={CheckedIcon} /> : <img src={NotCheckedIcon} />
                                    currentSelected[index] === 0 ? <img src={NotCheckedIcon} /> : (currentSelected[index] === 1 ? <img src={CheckedIcon} /> : <img src={HidenIcon}/>)
                                }</div>
                                <div style={{ width: '100px' }}>{attr.attrName}</div>
                                <div style={{ width: '100px' }}>{attr.type === 'numerical'? 'yes':'no'}</div>
                                <div style={{ width: '440px' }} className="desc">{attr.description}</div>
                            </div>
                        )) }
                    </div>
                    <div className="load-panel">
                        <div style={{ cursor: 'pointer', marginBottom: 10 }} onClick={this.uploadDataset.bind(this)}>Upload datasets as adversaries' background knowledge</div>
                        <div className="datasets">
                            <div className={`button`}>{this.state.currentDataset}</div>
                        </div>
                    </div>
                    <div className="load-panel">
                        <div style={{ marginBottom: 10 }}>Bayesian Network Search Algorithm</div>
                        <div className="datasets">
                            { SearchAlgorithm.map(({name}, index) => (
                                <div
                                    key={name}
                                    onClick={() => this.setState({ searchAlgorithm: index })}
                                    className={`button ${index === this.state.searchAlgorithm ? 'active' : ''}`}>
                                    {name}
                                </div>)) }
                        </div>
                    </div>
                    <div className="load-panel">
                        Risk Limit: <InputNumber value={this.props.store.riskLimit} step={0.05} min={0} max={1} onChange={val => this.props.store.riskLimit = val} />
                    </div>
                </div>
            </Modal>

        )
    }
}