import React, { Component } from 'react';
import Select, { defaultMenuRenderer } from 'react-select';
import 'react-select/dist/react-select.css';
import { connect } from 'react-redux';
import { actions } from './store.js';


class BugSelector extends Component {
    constructor (props) {
        super(props)
        this.state = {selectedOption: null, options: []}
        this.handleChange = this.handleChange.bind(this)
        this.renderMenu = this.renderMenu.bind(this)
    }

    processData () {
        if (!this.props.data) { return }

        let options = []
        let root = {}
        this.props.data.forEach(d => {
            if (d.family) {
                root[d.order] = root[d.order] || {value: {order: d.order}, label: `${d.order} (${d.order_common})`, children: {}}
                let parent = root[d.order]
                if (!parent.children[d.family]) {
                    parent.children[d.family] = {value: {order: d.order, family: d.family}, label: `— ${d.family} (${d.family_common})`}
                }
            }
        })
        
        let orders = Object.keys(root).sort()
        orders.forEach(order => {
            let parent = root[order]

            let parentOption = {value: parent.value, label: parent.label}
            let childKeys = Object.keys(parent.children)
            childKeys.sort()

            let children = childKeys.map(childName => {
                let child = parent.children[childName]
                return ({value: child.value, label: `   ${child.label}`})
            })
            options.push(parentOption)
            options.push.apply(options, children)
        })

        this.setState({ options: options })
    }

    handleChange (selectedOption) {
        if (selectedOption) {
            console.log(this.props)
            this.props.addSelection(selectedOption.value, this.props.exportEager)
            this.props.setActive(selectedOption.value)
        }
    }

    componentDidMount () {
        this.processData()
    }

    renderValue (value) {
        if (!value.family) {
            return `${value.order}`
        } else {
            return `${value.family} – ${value.order}`
        }
    }

    renderMenu (menu) {
        if (menu.focusedOption) {
            this.props.setActive(menu.focusedOption.value)
        }
        return defaultMenuRenderer(menu)
    }

    render () {
        let value = this.state.selectedOption && this.state.selectedOption.value

        return (
            <Select
                name="bug-handler"
                value={value}
                onChange={this.handleChange}
                options = {this.state.options}
                valueRenderer = {this.renderValue}
                menuRenderer = {this.renderMenu}
                placeholder="Search for a bug..."
            />
        )
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setActive: selection => dispatch(actions.setActive(selection)),
        addSelection: (selection, eager) => dispatch(actions.addSelection(selection, eager)),
        removeSelection: (selection, eager) => dispatch(actions.removeSelection(selection, eager)),
    }
}


export default connect(null, mapDispatchToProps)(BugSelector);