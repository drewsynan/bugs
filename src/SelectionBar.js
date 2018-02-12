import React, { Component } from 'react';
import './SelectionBar.css';
import BugSelector from './BugSelector';
import ResetButton from './ResetButton';

class SelectionBar extends Component {
    render () {
        return (
            <div className='SelectionBar'>
                <BugSelector {...this.props} />
                <ResetButton>Reset</ResetButton>
            </div>
        )
    }
}

export default SelectionBar;