import React from 'react';
import './OmitVal.scss';
import { inject } from 'mobx-react';
import './OmitVal.scss';

@inject(['store'])
export default class OmitVal extends React.Component {
    prevOverflowed = undefined;
    headerOverflowed = false;
    headerHeight = 40;

    componentDidMount() {
        this.adjustHeader();
    }

    componentDidUpdate() {
        this.adjustHeader();
    }

    adjustHeader() {
        if (!this.header) return;

        const items = [...this.header.querySelectorAll(".header-item")];
        let maxWidth = -1;
        this.prevOverflowed = this.headerOverflowed;

        items.forEach(item => {
            if (item.clientWidth < item.scrollWidth) {
                this.headerOverflowed = true;
            }
            if (item.scrollWidth > maxWidth) {
                maxWidth = item.scrollWidth;
            }
        });
        
        const height = Math.ceil(maxWidth * 2 / 1.71);
        if (this.headerOverflowed && height > 40) {
            this.headerHeight = height;
        } else {
            this.headerHeight = 40;
        }

        if (this.headerOverflowed !== this.prevOverflowed) {
            this.forceUpdate();
        }
    }

    formatData() {
        const rows = [];
        const columns = [];
        let flag = false;
        this.props.store.dataGroups.forEach(group => {
            group.records.forEach(rec => {
                const r = {};
                
                for (let a of rec.data) {
                    if (!flag) columns.push(a.attName);
                    r[a.attName] = {
                        utility: a.utility,
                    };
                }
                if (!flag) flag = true;
                rows.push(r);
            });
        });

        return { columns, rows };
    }

    render() {
        const { columns, rows } = this.formatData();
        
        return (
            <div className="omit-value">
                <div className="header" style={{ height: this.headerHeight }} ref={dom => this.header = dom}>
                    { columns.map(col => <div className={`header-item ${this.headerOverflowed ? 'rotate' : ''}`}> <div><span>{col}</span></div></div>) }
                </div>
                <div className="body">                        
                    { rows.map(row => {
                        return (
                            <div className="row">
                                { columns.map(attr => (
                                    <div className="cell">
                                        {
                                            row[attr].privacy === undefined ? (
                                                <div className="bg">
                                                    <div className="utility" style={{ width: '100%', opacity: row[attr].utility }} />
                                                </div>
                                            ) : (
                                                <div className="bg">
                                                    <div className="privacy" style={{ width: `${row[attr].privacy}%`, opacity: row[attr].privacy }} />
                                                    <div className="utility" style={{ width: `${row[attr].utility}%`, opacity: row[attr].utility }} />
                                                </div>
                                            )
                                        }
                                    </div>
                                )) }
                            </div>
                        )
                    }) }
                </div>
            </div>
        )
    }
}