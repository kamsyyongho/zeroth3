import { handleActions } from 'redux-actions';
// import {TYPE} from "./actions";
import {
    CommonStore,
    Organization,
} from '../../../types';
import {SET_CURRENT_ORGANIZATION, SET_ORGANIZATIONS} from './actions';

const emptyOrganization = {} as Organization;

const initialState: CommonStore = {
    organizations: [],
    currentOrganization: emptyOrganization,
};

export function CommonReducer( state = initialState, action: any) {
    switch (action.type) {
        case SET_ORGANIZATIONS:
            return {...state, organizations: action.payload};
        case SET_CURRENT_ORGANIZATION:
            return {...state, currentOrganization: action.payload};
        default:
            return state;
    }
};
