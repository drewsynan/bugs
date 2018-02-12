import React, { Component } from 'react';
import { axisBottom, axisTop, axisLeft, axisRight, select } from 'd3';
import pickBy from 'lodash/pickBy';

class Axis extends Component {
    constructor (props) {
        super(props)
        this.axis = this.props.axisCreator()
        this.d3Props = Object.keys(this.axis)
    }

    render () {
        return (<g ref={el => this.domRef = el } {...this.propsForChild()} />)
    }

    propsForChild () {
        return pickBy(this.props, (value, key) => !this.d3Props.includes(key) && key !== 'axisCreator')
    }

    createAxis () {
        let d3Calls = Object.keys(this.props).filter(key => (this.d3Props.includes(key)))
        this.axis = d3Calls.reduce((acc, callName) => acc[callName](this.props[callName]), this.axis)
        select(this.domRef).call(this.axis)
    }

    componentDidMount () {
        this.createAxis()
    }

    componentDidUpdate () {
        this.createAxis()
    }
}

class AxisBottom extends Component {
    render () {
        return (<Axis axisCreator={axisBottom} {...this.props} />)
    }
}

class AxisTop extends Component {
    render () {
        return (<Axis axisCreator={axisTop} {...this.props} />)
    }
}

class AxisRight extends Component {
    render () {
        return (<Axis axisCreator={axisRight} {...this.props} />)
    }
}

class AxisLeft extends Component {
    render () {
        return (<Axis axisCreator={axisLeft} {...this.props} />)
    }
}

export {AxisTop, AxisBottom, AxisRight, AxisLeft}