import React, { Component } from 'react';
import styled from 'styled-components';
import { format } from 'd3';
import dl from 'datalib';
import joins from 'lodash-joins';
import ExternalLink from './icon_external_link.png';

const SummaryBar = styled.div`
    position: absolute;
    top: 5px;
    left: 65px;
    width: ${props => (+props.percentage/100 * 50)}px;
    height: 8px;
    background-color: #ccc;
    border: 1px solid #bbb;
    box-sizing: border-box;
`

const StyledTable = styled.table`
    table-layout: fixed;
    width: 100%;
    font-size: 12px;

    padding-top: 10px;
    padding-bottom: 10px;

    tbody tr:first-child {
        font-weight: bold;

        td {
            border-bottom: 1px solid black;
            border-top: 1px solid black;
        }
    }

    tbody tr:last-child {
        td {
            border-bottom: 1px solid black;
        }
    }

    thead tr:first-child,
    tbody tr:first-child {
        td:first-child {
            padding-left: 0
        }
    }

    td {
        width: 25%;
        text-align: right;

        &.summary__room {
            text-align: left;
            position: relative;
        }

        &:first-child {
            padding-left: 5px;
        }
    }

    tfoot {
        font-size: 10px;
        td {
            text-align: left;
            padding-top: 2px;

            &:first-child {
                padding-left: 0;
            }

            a img {
                max-height: 9px;
            }
        }
    }
`;

class SummaryTable extends Component {
    summaryTableData (data, varName, varValue) {
        // using per-room totals

        let totals = dl.groupby('room')
            .summarize({room_total: ['max']})
            .execute(data)
            .filter( d => d.room !== '')
        totals.forEach(d => {
                d.total_sum = d.max_room_total
        })

        // Summary for counting individuals

        // let totals = dl.groupby('room')
        //     .summarize({value: ['sum']})
        //     .execute(data)
        //     .filter( d => d.room !== '')
        // totals.forEach(d => {
        //         d.total_sum = d.sum_value
        //         delete d.sum_value
        //     })

        let focused

        if (varName === 'order') {
            // don't double count things from previous aggregations
            focused = dl.groupby('room')
                .summarize({order_room_total: ['max']})
                .execute(data.filter(d => {
                    return d[varName] === varValue
                }))
                .filter( d => d.room !== '')
            focused.forEach(d => {
                d.focused_sum = d.max_order_room_total
            })

        } else {
            focused = dl.groupby('room')
                .summarize({value: ['sum']})
                .execute(data.filter(d => {
                    return d[varName] === varValue
                }))
            focused.forEach(d => { 
                    d.focused_sum = d.sum_value
                    delete d.sum_value
                })
        }

        let joined = joins.hashRightOuterJoin(focused, (d) => (d.room), totals, (d) => (d.room))

        joined.forEach(d => {
            if (d.focused_sum === undefined) {
                d.focused_sum = 0
            }
            if (d.total_sum === undefined) {
                d.total_sum = 0
            }

            d.percentage = 100.0 * d.focused_sum / d.total_sum
        })

        let grandTotals = dl.groupby(null).summarize({total_sum: ['sum'], focused_sum: ['sum']}).execute(joined)

        joined.unshift({
            room: 'all rooms', 
            focused_sum: grandTotals[0].sum_focused_sum, 
            total_sum: grandTotals[0].sum_total_sum,
            percentage: 100.0 * grandTotals[0].sum_focused_sum / grandTotals[0].sum_total_sum
        })

        return joined
    }

    render () {
        // if (this.props.data && this.props.variableName && this.props.variableValue) {
        let summaryData = this.summaryTableData(this.props.data, this.props.variableName, this.props.variableValue)
            if (this.props.variableName && this.props.variableValue) {
                return (<StyledTable cellSpacing='0'>
                        <thead>
                            <tr>
                                <td className='summary__room'></td>
                                <td>%</td>
                                <td>{this.props.variableValue}</td>
                                <td>total</td>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryData.map(row => {
                                return (<tr key={row.room}>
                                            <td className='summary__room'>{row.room}<SummaryBar percentage={row.percentage} /></td>
                                            <td className='summary__percentage'>{format(",.1f")(row.percentage)}</td>
                                            <td className='summary__variable'>{format(",d")(row.focused_sum)}</td>
                                            <td className='summary__total'>{format(",d")(row.total_sum)}</td>
                                        </tr>)})
                            }
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={4}><strong>NB</strong>: this table shows the <em>total number of rooms</em> with a bug type (not the total number of
                                    individuals collected in sampling). It corresponds to <a href="https://peerj.com/articles/1582/#table-1" target="_blank">table 1<img src={ExternalLink} alt=""/></a> in the study.</td>
                            </tr>
                        </tfoot>
                    </StyledTable>
            )
        } else {
            return (<StyledTable />)
        }
    }

}

export default SummaryTable;