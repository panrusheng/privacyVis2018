import React from 'react';
import { inject, observer } from 'mobx-react';
import CheckedIcon from '../assets/image/checked.svg';
import NotCheckedIcon from '../assets/image/notchecked.svg';
import HidenIcon from '../assets/image/blind.svg';
import axis from '../utils/axios'
import { Modal } from 'antd';
import axios from '../utils/axios';
import './LoadData.scss';


@inject(['store'])
@observer
export default class LoadData extends React.Component {
    state = {
        currentDataset: null,
        datasets: [],
        currentSelected: [],
    }

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
        this.getAllDataSet();
    }

    uploadDataset() {
        this.inputElem.click();
    }

    handleConfirm() {
        if (!this.state.currentDataset) return;
        const attributes = [];
        const li = this.state.datasets.find(item => item.dataset === this.state.currentDataset).attrList;
        
        li.forEach((attr, index) => {
            if (this.state.currentSelected[index] === 0) return;
            attributes.push({ attrName: attr.attrName, sensitive: this.state.currentSelected[index] === 2 });
        });

        this.props.store.selectedAttributes = attributes;
        this.props.store.setSystemStage(0);
        this.props.store.getGBN(true);
        // this.props.store.getAttrDistribution();
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

    getAllDataSet() {
        axis.post('/load_data')
            .then(data => {
                const attrList = [], selectedList = [];
                for (const attrName in data.attList) {
                    attrList.push({ attrName, ...data.attList[attrName] });
                    selectedList.push(0);
                }

                this.setState({
                    datasets: [{
                        dataset: 'user',
                        attrList,
                    }],
                    currentDataset: 'user',
                    currentSelected: selectedList,
                });
            });
    }

    render() {
        const { datasets, currentDataset, currentSelected } = this.state;
        const currentAttrList = (datasets.find(item => item.dataset === currentDataset) || {}).attrList || [];

        return (
            <Modal
                visible
                closable={false}
                footer={<div className="footer-button" onClick={this.handleConfirm}>Confirm</div>}
                wrapClassName="attr-select-panel"
            >
                <div className="load-data">
                    <div className="attr-list">
                        <div className="attr-list-item">
                            <div style={{ width: '15px' }}/>
                            <div style={{ width: '90px' }}>Attributes</div>
                            <div style={{ width: '100px' }}>Continuous</div>
                            <div style={{ width: '450px' }}>Description</div>
                        </div>
                        { currentAttrList.map((attr, index) => (
                            <div className="attr-list-item">
                                <div onClick={() => this.toggleCheck(index)}>{
                                    //checkedIndex.findIndex(item => item === index) >= 0 ? <img src={CheckedIcon} /> : <img src={NotCheckedIcon} />
                                    currentSelected[index] === 0 ? <img src={NotCheckedIcon} /> : (currentSelected[index] === 1 ? <img src={CheckedIcon} /> : <img src={HidenIcon}/>)
                                }</div>
                                <div style={{ width: '90px' }}>{attr.attrName}</div>
                                <div style={{ width: '100px' }}>{attr.type === 'numerical'? 'yes':'no'}</div>
                                <div style={{ width: '450px' }} className="desc">{attr.description}</div>
                            </div>
                        )) }
                    </div>
                    <div className="load-panel">
                        <div style={{ cursor: 'pointer', marginBottom: 10 }} onClick={this.uploadDataset.bind(this)}>Upload datasets as adversaries' background knowledge</div>
                        <div className="datasets">
                            { datasets.map(item => <div className={`button ${item.dataset === currentDataset ? 'active' : ''}`}>{item.dataset}</div>) }
                        </div>
                    </div>
                </div>
            </Modal>

        )
    }
}