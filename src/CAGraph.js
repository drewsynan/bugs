import React, { Component } from 'react';
import { actions } from './store.js';
import { connect } from 'react-redux';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { rgb } from 'd3';
import dl from 'datalib';
import some from 'lodash/some';
import isSubset from 'is-subset';
import className from 'classnames';
import { AxisBottom, AxisRight } from './axis.js';
import './CAGraph.css';

class CAGraph extends Component {
    constructor (props) {
        super(props)
        this.state = {activePoint: null}

        this.margin = {top: this.props.marginTop, 
                       right: this.props.marginRight, 
                       bottom: this.props.marginBottom, 
                       left: this.props.marginLeft}
        this.width = this.props.width - this.margin.left - this.margin.right
        this.height = this.props.height - this.margin.top - this.margin.bottom

        let domains = dl.groupby(null).summarize({Dim1: ['max', 'min'], Dim2: ['max', 'min']}).execute(this.props.data)[0]

        this.x = scaleLinear()
            .domain([domains.min_Dim1, domains.max_Dim1])
            .range([0, this.width])
        this.y = scaleLinear()
            .domain([domains.min_Dim2, domains.max_Dim2])
            .range([this.height, 0])

        this.colorPoint = scaleOrdinal()
            .range(this.props.colorScheme.map(c => rgb(c)))
            .domain(this.props.data.map(this.props.color).sort())
    }
    datumToSelection (d) {
        return {family: d.family, order: d.order}
    }
    matchesActive (d) {
        return isSubset(this.datumToSelection(d), this.props.currentlyActive)
    }
    matchesSelected (d) {
        return some(this.props.currentlySelected, selection => isSubset(this.datumToSelection(d), selection))
    }
    render () {
        return (<svg width={this.width + this.margin.left + this.margin.right}
                     height={this.height + this.margin.top + this.margin.bottom}>
                    <defs>
                        <filter x="0" y="0" width="1" height="1" id="svg-solid-bg-filter">
                          <feFlood floodColor="white"/>
                          <feComposite in="SourceGraphic"/>
                        </filter>
                    </defs>

                     <g transform={`translate(${this.margin.left}, ${this.margin.top})`}>
                        <g className="x axis"
                           transform={`translate(0,${this.y(0)})`}>
                            <text className="axis-label" 
                                  x={this.width} 
                                  y={0} 
                                  dy={-5}
                                  style={{textAnchor: 'end'}}>Dimension 1</text>
                        <AxisBottom scale={this.x} 
                                    tickSize={4} 
                                    tickPadding={[3]} 
                                    ticks={[4]} />
                        </g>
                        <g className="y axis"
                           transform={`translate(${this.x(0)},0)`}>
                            <text className="axis-label"
                                  transform="rotate(-90)"
                                  y={6}
                                  dy="-1em"
                                  style={{textAnchor: 'end'}}>Dimension 2</text>
                            <AxisRight scale={this.y}
                                  tickSize={4}
                                  tickPadding={[3]}
                                  ticks={[4]} />
                        </g>
                        <g className="points">
                            {this.props.data.map(d => {
                                let key = d.value+d.order + d.family;
                                let mouseEnterHandler = ((d) => {
                                    this.props.setActive(this.datumToSelection(d))
                                }).bind(this, d)
                                let clickHandler = ((d) => {
                                    this.props.addSelection(this.datumToSelection(d))
                                }).bind(this, d)

                                if (d.variable === 'room') {
                                    return (<rect x={this.x(d.Dim1)}
                                                  dx={-3.5}
                                                  y={this.y(d.Dim2)}
                                                  dy={-3.5}
                                                  fill="black"
                                                  width={7}
                                                  height={7} 
                                                  key={'point'+key} />)
                                } else {
                                    return (<circle 
                                                className={className({
                                                    'point-dot': true,
                                                    active: this.matchesActive(d),
                                                    selected: this.matchesSelected(d)})}
                                                r={3}
                                                cx={this.x(d.Dim1)}
                                                cy={this.y(d.Dim2)}
                                                fill={this.colorPoint(d.order)}
                                                strokeWidth="1"
                                                stroke="#333"
                                                onMouseEnter={mouseEnterHandler}
                                                onClick={clickHandler}
                                                key={'point'+key} />)
                                }})
                            }
                        </g> {/* end points */}
                        <g className="hover-labels">{/* wow, svg is stupid */}
                            {this.props.data.map(d => {
                                let key = d.value+d.family+d.order;

                                if (d.variable === "room") {
                                    return (<text className='point-label room'
                                                  x={this.x(d.Dim1)}
                                                  y={this.y(d.Dim2)}
                                                  dy="-0.7em"
                                                  fill="black"
                                                  textAnchor="middle"
                                                  key={key+'-hover'}>{d.value}</text>)
                                } else {
                                    return (<text className={className({
                                                    'point-label': true,
                                                    active: this.matchesActive(d)
                                                  })}
                                                  x={this.x(d.Dim1)}
                                                  y={this.y(d.Dim2)}
                                                  dy="-0.7em"
                                                  fill="black"
                                                  textAnchor="middle"
                                                  filter="url(#svg-solid-bg-filter)" key={key+'-hover'}>{d.value}</text>)
                                }

                            })
                            }
                        </g> {/* end hover-labels */}
                     </g>
                </svg>)
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

export default connect(state => state, mapDispatchToProps)(CAGraph);