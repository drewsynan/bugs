import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { actions } from './store.js';

const Button = styled.button`
    color: #333;
    appearence: none;
    border: 1px solid #333;
    border-radius: 3px;

    &:focus {
        outline: none;
    }

    &:active {
        background-color: #333;
        color: white;
    }
`

class ResetButton extends Component {
    render () {
        return (<Button {...this.props} onClick={this.props.clearAllSelections} className="ResetButton" />)
    }
}

const mapDispatchToProps = (dispatch) => ({
    clearAllSelections: () => dispatch(actions.clearAllSelections())
})

export default connect(null, mapDispatchToProps)(ResetButton)