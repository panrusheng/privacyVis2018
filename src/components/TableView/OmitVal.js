import React from 'react';
import './OmitVal.scss';
import { inject } from 'mobx-react';

@inject(['store'])
export class OmitVal extends React.Component {

    render() {
        return (
            <div className="omit-value">
                
            </div>
        )
    }
}