import React, { Component } from 'react';
import styled from 'styled-components';
import isSubset from 'is-subset';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { actions } from './store.js';
import { connect } from 'react-redux';

const StyledThumbnail = styled.div`
    box-sizing: border-box;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
    overflow: hidden;
    border-radius: 50%;
    border: 1px solid #333;
    background-color: transparent;
    text-align: center;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2px;
    position: relative;

    &.active {
        border: 4px solid #333;
    }

    img {
        object-fit: cover;
        max-width: 150%;
    }
`;

class Thumbnail extends Component {
    constructor (props) {
        super(props)
        this.state = {}
        this.thumbnailCache = {}
        this.handleMouseOver = this.handleMouseOver.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }

    render () {
        if (this.state.loading) {
            return (<StyledThumbnail {...this.props}>LOADING</StyledThumbnail>)
        } if (!this.state.thumbnailUrl) {
            return (<StyledThumbnail {...this.props} />)
        } else {
            return (<StyledThumbnail {...this.props}
                        className={classNames({active: this.isActive()})}
                        onMouseEnter={this.handleMouseOver}
                        onClick={this.handleClick}><img src={this.state.thumbnailUrl} alt="" /></StyledThumbnail>)
        }
    }

    isActive () {
        return isSubset(this.props.selection, this.props.currentlyActive)
    }

    handleMouseOver () {
        if (this.props.setActive) {
            this.props.setActive(this.props.selection)
        }
    }

    handleClick () {
        if (this.props.removeSelection) {
            this.props.removeSelection(this.props.selection)
        }
    }

    getApiRequestUrl (selection) {
        if (!selection) { return }
        let lookupValue = selection.family ? selection.family : selection.order;
        return `https://en.wikipedia.org/w/api.php?action=query&titles=${lookupValue}&prop=pageimages&format=json&pithumbsize=200&redirects&origin=*`;
    }

    fetchThumbnail (selection) {

        let requestUrl = this.getApiRequestUrl(selection)
        let cached = this.thumbnailCache[requestUrl]

        if (cached) {
            this.setState({ thumbnailUrl: cached, loading: false})
        } else if (requestUrl) {
            fetch(requestUrl)
                .then(r => r.json())
                .then(data => {
                    let pages = Object.keys(data.query.pages)
                    if (pages[0]) {
                        let thumbnail = data.query.pages[pages[0]].thumbnail;
                        if (thumbnail) {
                            this.thumbnailCache[requestUrl] = thumbnail.source
                            this.setState({ thumbnailUrl: thumbnail.source, loading: false })
                        } else {
                            this.setState({ thumbnailUrl: null, loading: false })
                        }
                    } else {
                        this.setState({ thumbnailUrl: null, loading: false})
                    }
                }).catch(err => console.error(err))
        }
    }

    componentWillReceiveProps (nextProps) {
        if (!isEqual(nextProps.selection, this.props.selection)) {
            this.setState({ loading: true })
            this.fetchThumbnail(nextProps.selection)
        }
    }

    componentDidMount () {
        this.fetchThumbnail(this.props.selection)
    }
}

const ConnectedThumbnail = connect((state) => (state), 
(dispatch) => ({
    setActive: (selection) => dispatch(actions.setActive(selection)),
    // removeSelection: (selection) => dispatch(actions.removeSelection(selection))
}))(Thumbnail)

export { Thumbnail, ConnectedThumbnail };