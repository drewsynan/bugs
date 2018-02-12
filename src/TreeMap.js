import React, { Component } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { actions } from './store.js';
import isSubset from 'is-subset';
import some from 'lodash/some';
import isEqual from 'lodash/isEqual';
import _ from 'lodash';


const StyledTreemap = styled.div`
    background: ${props => props.defaults.backdropColor};
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    position: relative;

    &.focusMode > *:not(.selected) {
        opacity: 0.2;
    }
    &.focusMode > .active {
        opacity: 1;
    }
`;

const StyledNode = styled.div`
    border: 1px solid transparent;
    border-radius: 1px;
    box-sizing: border-box;
    position: absolute;
    overflow: hidden;
    cursor: pointer;

    &.active {
        background: #eee !important;
    }

    &.active > * {
        
    }

    &.selected {
        border: 1px solid rgba(255,255,255,0.5) !important;

        &.active {
            border: 1px solid rgba(255,255,255,0.95) !important;
        }
    }
`;

const StyledLabel = styled.div`
    margin: 0;
    padding: 0;
    font-size: 10px;
    line-height: 1em;
    white-space: pre;
    margin-left: 2px;
`;

const StyledValue = styled.div`
    font-weight: 300;
    margin: 0;
    padding: 0;
    color: rgba(0,0,0,0.8);
    font-size: 7.5px;
    margin-top: 1px;
    margin-left: 2px;
`;

function runUpdateTests (tests, next, current) {
    for (let i=0; i < tests.length; i++) {
        if (tests[i](next, current)) {
            return true
        }
    }
    return false
}

class Node extends Component {
    constructor (props) {
        super(props);
        this.style = {top: this.props.top,
                        left: this.props.left,
                        height: this.props.height,
                        width: this.props.width,
                        background: this.props.color,
                        borderColor: this.props.color};
    }
    render () {
        return (<StyledNode className={classNames({active: this.props.active,
                                                   selected: this.props.selected})}

                            style={this.style}
                            title={this.props.title}>{this.props.children}</StyledNode>)        
    }

    shouldComponentUpdate (nextProps, nextState) {
        return runUpdateTests([
            (next, current) => (next.active !== current.active),
            (next, current) => (next.selected !== current.selected)
        ], nextProps, this.props)
    }
}

class CategoryLabel extends Component {
    constructor (props) {
        super(props)
        this.style = {top: this.props.top,
                        left: this.props.left,
                        height: this.props.height,
                        width: this.props.width,
                        color: this.props.color,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderColor: this.props.color,
                        borderWidth: '2px',
                        boxSizing: 'border-box',
                        opacity: 0.9,
                        pointerEvents: 'none',
                        paddingLeft: '1px',
                        textShadow: `-1px -1px 0 #333,  
                                      1px -1px 0 #333,
                                     -1px  1px 0 #333,
                                      1px  1px 0 #333`
        };
    }
    render () {
        return (<StyledNode style={this.style}
                                {...this.props}>{this.props.children}</StyledNode>)
    }
    shouldComponentUpdate () {
        return false
    }
}

class Label extends Component {
    constructor (props) {
        super(props)
        this.style = {color: this.props.color};
    }
    render () {
        return (<StyledLabel style={this.style}>{this.props.value}</StyledLabel>)
    }

    shouldComponentUpdate (nextProps, nextState) {
        return runUpdateTests([
            (next, current) => (next.color !== current.color),
            (next, current) => (next.value !== current.value)
        ], nextProps, this.props)
    }
}

class Value extends Component {
    formatter = d3.format(",d")

    constructor (props) {
        super(props)
        this.style = {color: this.props.color}
    }
    render () {
        return (<StyledValue style={this.style}>{this.formatter(this.props.value)} {this.props.children}</StyledValue>);
    }

    shouldComponentUpdate (nextProps, nextState) {
        return runUpdateTests([
            (next, current) => (next.color !== current.color)
        ], nextProps, this.props)
    }

}

class TreeMap extends Component {
    constructor (props) {
        super(props)

        this.handleMouseOver = this.handleMouseOver.bind(this)
        this.handleMouseLeave = this.handleMouseLeave.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.treemapLayout = this.buildTreeMap(props.data)

        this.defaults = {
            backgroundColorOpacity: 0.4,
            labelColorOpacity: 0.9,
            solidColorOpacity: .9,
            minLabelWidth: 25,
            minLabelHeight: 15,
            backdropColor: '#333' //'rgb(22, 64, 116)'
        }

        this.colorDomain = this.props.data.map(this.props.color).sort()

        this.colorBackground = d3.scaleOrdinal()
            .range(this.props.colorScheme
                .map(c => { c = d3.rgb(c); c.opacity = this.defaults.backgroundColorOpacity; return c; }))
            .domain(this.colorDomain)


        this.colorLabel = d3.scaleOrdinal()
            .range(this.props.colorScheme
                .map(c => { c = d3.rgb(c); c.opacity = this.defaults.labelColorOpacity; return c; }))
            .domain(this.colorDomain)

        this.colorSolid = d3.scaleOrdinal()
            .range(this.props.colorScheme
                .map(c => { c = d3.rgb(c); c.opacity = this.defaults.solidColorOpacity; return c; }))
            .domain(this.colorDomain)

        window[`color_background${Math.random()}`.replace('0.', '')] = this.colorBackground;
    }

    buildTreeMap (data) {
        var treemap = d3.treemap()
            .size([this.props.width, this.props.height])
            .padding(1)
            .round(true)

        var stratify = d3.stratify()
            .parentId(d => d.id.substring(0, d.id.lastIndexOf(".")))

        var root = treemap(
            stratify(data)
                .sum(function(d) { return d.value; })
                .sort(function(a, b) { return b.height - a.height || b.value - a.value; }))

        return root;
    }

    findActiveNodeFromEvent (e) {
        try {
            // let bodyRect = document.body.getBoundingClientRect()
            let bodyRect = document.documentElement.getBoundingClientRect()
            let domRect = this.domRef.getBoundingClientRect()
            let relX = e.pageX - (domRect.left - bodyRect.left)
            let relY = e.pageY - (domRect.top - bodyRect.top)

            return this.treemapLayout.leaves().filter(function(leaf) {
                return (relX <= leaf.x1 && relY <= leaf.y1) && (relX >= leaf.x0 && relY >= leaf.y0)
            })[0]
        } catch(e) {
            return undefined
        }
    }

    matchesActive (node) {
        if (node === undefined || node === null || this.props.currentlyActive === null || this.props.currentlyActive === undefined) {
            return false
        } else {
            if (this.props.importEager) {
                let test = _(this.props.currentlyActive)
                    .toPairs()
                    .map(([k, v]) => (node.data[k] === v))
                    .some()
                return test
            } else {
                return isSubset(node.data, this.props.import(this.props.currentlyActive))
            }
        }
    }

    matchesSelected (node) {
        let selections = this.props.currentlySelected;
        let d = node.data;

        if (this.props.importEager) {
            return _(selections).map(selection => {
                return _(selection).toPairs().map(([k, v]) => (d[k] === v)).some()
            }).some()
        } else {
            return some(selections, selection => (isSubset(d, this.props.import(selection))))
        }
    }

    makeSelection (node) {
        let d = node.data;
        return this.props.export(d)
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (nextProps.visible !== undefined && !nextProps.visible) {
            return false
        }

        return runUpdateTests([
            (next, current) => (next.currentlyActive !== current.currentlyActive),
            (next, current) => (next.currentlySelected !== current.currentlySelected)
        ], nextProps, this.props);

    }

    handleMouseOver (e) {
        e.stopPropagation();
        var node = this.findActiveNodeFromEvent(e)
        if (node) {
            this.props.setActive(this.makeSelection(node))
        }

    }

    handleMouseLeave (e) {
        if (!this.props.currentlySelected.length) {
            this.props.setActive(null)
        }
    }

    handleClick (e) {
        var node = this.findActiveNodeFromEvent(e);

        if (!node) {
            return;
        }

        let selection = this.makeSelection(node)

        if (some(this.props.currentlySelected.filter(s => isEqual(s, selection)))) {
            this.props.removeSelection(selection, this.props.exportEager)
        } else {
            this.props.addSelection(selection, this.props.exportEager)
        }
    }

    render () {
        return (<StyledTreemap className={classNames({focusMode: this.props.currentlySelected.length})} 
                            width={this.props.width} 
                            height={this.props.height}
                            defaults={this.defaults}
                            onMouseOver={this.handleMouseOver}
                            
                            onClick={this.handleClick}
                            innerRef={el => this.domRef = el}>
            {this.treemapLayout.leaves().map(node => {
                let root = this

                let nodeProps = {
                    height: node.y1 - node.y0,
                    width: node.x1 - node.x0,
                    top: node.y0,
                    left:  node.x0,
                    active: root.matchesActive(node),
                    selected: root.matchesSelected(node),
                    color: root.colorBackground(this.props.color(node.data)),
                    title: root.props.toolTip(node.data)
                }

                if (Math.round(nodeProps.width) > this.defaults.minLabelWidth && Math.round(nodeProps.height) > this.defaults.minLabelHeight) {
                    return (<Node key={node.id} {...nodeProps}>
                                    <Label value={this.props.label(node.data)} 
                                           color={this.colorLabel(this.props.color(node.data))} />
                                    <Value value={this.props.value(node.data)} 
                                           color={this.colorLabel(this.props.color(node.data))}>{this.props.valueAnnotation(node.data)}</Value>
                            </Node>)
                } else {
                    return (<Node key={node.id} {...nodeProps} />)
                }})}
            {
                this.props.categoryLabel && this.props.categoryColor ?
                this.treemapLayout.children.map(node => {
                    return (<CategoryLabel key={node.id}
                                height={node.y1 - node.y0}
                                width={node.x1 - node.x0}
                                top={node.y0}
                                left={node.x0}
                                color={this.colorSolid(this.props.categoryColor(node.data))}>{this.props.categoryLabel(node.data)}</CategoryLabel>)})
                : undefined
            }
            </StyledTreemap>)
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

const mapStateToProps = state => (state)

export default connect(mapStateToProps, mapDispatchToProps)(TreeMap);