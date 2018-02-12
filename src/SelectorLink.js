import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions } from './store.js';
import styled from 'styled-components';

const StyledSelector = styled.span`
    cursor: pointer;
    border-bottom: 1px dashed #333;

    &:hover {
        background-color: #eee;
    }
`

class SelectorLink extends Component {
    constructor (props) {
        super(props)
        this.handleMouseEnter = this.handleMouseEnter.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }

    handleMouseEnter () {
        this.props.setActive(this.props.selection)
    }

    handleClick () {
        this.props.addSelection(this.props.selection, true)
    }

    render () {
        return(<StyledSelector onMouseEnter={this.handleMouseEnter}
                               onClick={this.handleClick}>{this.props.children}</StyledSelector>)
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setActive: selection => dispatch(actions.setActive(selection)),
        addSelection: (selection, eager) => dispatch(actions.addSelection(selection, eager)),
        removeSelection: (selection, eager) => dispatch(actions.removeSelection(selection, eager)),
        clearAllSelections: selection => dispatch(actions.clearAllSelections())
    }
}

export default connect(state => state, mapDispatchToProps)(SelectorLink);