import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Thumbnail } from './Thumbnail.js';
import SummaryTable from './SummaryTable.js';
import ExternalLink from './icon_external_link.png';


const StyledDisplay = styled.div`
    width: 100%;
    
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

    h1, h2 {
        margin: 0;
        padding: 0;
    }

    .secondary {
        font-weight: normal;
        text-transform: uppercase;
        font-size: 9px;
        min-height: 12px;
    }

    .main {
        font-weight: 600;
        font-size: 16px;
        min-height: 40px;
        font-family: 'Source Serif Pro';
    }

    .info-text {
        margin-top: 10px;
    }

    a:link, a:visited {
        color: #333;
    }

`;



class HoverDisplay extends Component {
    lookup (varName, selection) {
        let empty = {[varName]: '', [`${varName}_common`]: ''}
        if (!selection || !selection[varName]) {
            return empty
        } else {
            let match = this.props.data.filter(d => d[varName] === selection[varName])[0]
            if (match) {
                let common = match[`${varName}_common`] ? `(${match[`${varName}_common`]})` : ''
                return {[varName]: selection[varName], [`${varName}_common`]: common}
            } else {
                return empty
            }
        }
    }

    render () {
        let currentOrder = this.lookup('order', this.props.currentlyActive)
        let currentFamily = this.lookup('family', this.props.currentlyActive)

        let mainContent
        let secondaryContent
        let variableName
        let variableValue

        if (! this.props.currentlyActive) {
            secondaryContent = 'For more infomation'
            mainContent = 'Search for or hover over a bug'
        } else if (currentFamily.family) {
            mainContent = `${currentFamily.family} ${currentFamily.family_common}`
            secondaryContent = `${currentOrder.order} ${currentOrder.order_common}`
            variableName = 'family'
            variableValue = currentFamily.family
        } else {
            mainContent = `${currentOrder.order} ${currentOrder.order_common}`
            variableName = 'order'
            variableValue = currentOrder.order
        }

        let detailLink
        if (variableValue) {
            detailLink = <a href={`https://en.wikipedia.org/wiki/${variableValue}`} target='_blank'>{mainContent}<img src={ExternalLink} alt=""/></a>
        } else {
            detailLink = mainContent
        }
        
        return (<StyledDisplay className="HoverDisplay">
                    <Thumbnail selection={this.props.currentlyActive} size={100} />
                    <div className={'info-text'}>
                        <h2 className={'secondary'}>{secondaryContent}</h2>
                        <h1 className={'main'}>{detailLink}</h1>
                        <SummaryTable data={this.props.data} variableName={variableName} variableValue={variableValue} />
                    </div>

                </StyledDisplay>)

    }
}

const mapStateToProps = state => (state);

export default connect(mapStateToProps)(HoverDisplay);