import { createStore } from 'redux';
import equal from 'lodash/isEqual';
import some from 'lodash/some';
import _ from 'lodash';

const actions = {
    setActive (id) {
        return {type: 'SET_ACTIVE', selection: id}
    },

    addSelection (id, eager) {
        return {type: 'ADD_SELECTION', selection: id, eager: eager}
    },

    removeSelection (id, eager) {
        return {type: 'REMOVE_SELECTION', selection: id, eager: eager}
    },

    clearAllSelections () {
        return {type: 'CLEAR_ALL_SELECTIONS'}
    }
}

const initialState = {
    currentlyActive: null,
    currentlySelected: []
}

function reducer (state = initialState, action) {
    if (action.type === 'SET_ACTIVE') {
            return { ...state, currentlyActive: action.selection }
    } else if (action.type === 'ADD_SELECTION') {
        if (action.selection === '' || action.selection === null) {
            return state
        }

        if (action.eager) {            
            let comparison

            if (typeof action.eager === 'function') {
                comparison = action.eager
            } else {
                comparison = (newSelection, currentSelection) => {
                    return !_(currentSelection).toPairs().map(([k, v]) => (newSelection[k] === v)).some()
                }
            }
            
            let newSelection = action.selection
            let remainingSelections = _(state.currentlySelected).filter(selected => {
                return comparison (newSelection, selected)
            })

            return { ...state, currentlySelected: [...remainingSelections, newSelection] }
        } else {
            if (some(state.currentlySelected,action.selection)) {
                return state;
            } else {
                return { ...state, currentlySelected: [...state.currentlySelected, action.selection] }
            }
        }
        
    } else if (action.type === 'REMOVE_SELECTION') {
        let comparison

        if (typeof action.eager === 'function') {
            comparison = action.eager
        } else {
            comparison = (newSelection, currentSelection) => {
                return !_(currentSelection).toPairs().map(([k, v]) => (newSelection[k] === v)).some()
            }
        }


        if (!action.eager) {
            return { ...state, currentlySelected: state.currentlySelected.filter(selection => (!equal(selection, action.selection))), currentlyActive: null }
        } else {
            let newSelections = _(state.currentlySelected).filter(selected => {
                                        return comparison(action.selection, selected)
                                }).value();
            return { ...state, currentlySelected: newSelections, currentlyActive: null }
        }
    } else if (action.type === 'CLEAR_ALL_SELECTIONS') {
        return { ...state, currentlySelected: [], currentlyActive: null}
    } else {
        return state
    }
}

const store = createStore(reducer);

export {
    store,
    actions
};