import React from 'react';
import './OmitVal.scss';
import { inject } from 'mobx-react';
import './OmitVal.scss';

@inject(['store'])
export default class OmitVal extends React.Component {
    formatData() {
        /**
         *       dataGroup.groups.forEach(group => {
        group.records.forEach(rec => {
          const r = {};
          r.id = rec.id;
          r.values = {};
          for (let a in rec) {
            if (a === 'id') continue;
            r.values[a] = {
              value: rec[a],
              name: a,
              privacy: undefined,
              utility: Math.random(),
            };
          }
         */
        const rows = [];
        const columns = [];
        let flag = false;
        this.props.store.dataGroup.groups.forEach(group => {
            group.records.forEach(rec => {
                const r = {};
                
                for (let a in rec) {
                    if (a === 'id') continue;
                    if (!flag) columns.push(a);
                    r[a] = {
                        privacy: undefined,
                        utility: Math.random(),
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
        )
    }
}