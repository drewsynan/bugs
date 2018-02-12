import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { actions } from './store.js';
import { ConnectedThumbnail } from './Thumbnail.js';
import ExternalLink from './icon_external_link.png';

const StyledBasket = styled.div`
    width: ${props => props.width}px;

    .icons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .icon {
        margin-bottom: 15px;
        margin-right: 15px;
        width: 75px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 5px;
        position: relative;
    }

    .caption, .caption a:link, .caption a:visited {
        color: #333;
        font-size: 12px;
    }

    .close-button {
        height: 10px;
        width: 10px;
        position: absolute;
        top: 0;
        right: 5px;
        font-size: 16px;
        cursor: pointer;
        color: #333;

        &:active {
            color: #ddd;
        }

    }
`;

class SelectionBasket extends Component {
    clickRemove (selection) {
        this.props.removeSelection(selection, this.props.exportEager)
    }

    enterHandler (selection) {
        this.props.setActive(selection)
    }

    render () {
            return (<StyledBasket className="SelectionBasket">
                <div className='icons'>
                {this.props.currentlySelected.map(selection => {
                        let caption = selection.family ? selection.family : selection.order
                        let lookupName = caption
                        let clickHandler = this.clickRemove.bind(this, selection)
                        let enterHandler = this.enterHandler.bind(this, selection)

                        return (
                        <div className='icon' key={JSON.stringify(selection)}>
                            <div className='close-button' onClick={clickHandler}>×</div>
                            <ConnectedThumbnail selection={selection} size={50} />
                            <div className='caption' onMouseEnter={enterHandler}>
                                <a href={`https://en.wikipedia.org/wiki/${lookupName}`} target='_blank'>{caption}<img src={ExternalLink} alt=""/></a></div>
                        </div>
                        )
                    })}
                </div></StyledBasket>)
    }
}

const mapDispatchToProps = dispatch => {
    return {
        removeSelection: (selection, eager) => dispatch(actions.removeSelection(selection, eager)),
        setActive: selection => dispatch(actions.setActive(selection)),
    }
}

export default connect(state => state, mapDispatchToProps)(SelectionBasket)