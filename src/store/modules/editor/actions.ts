import { handleActions } from 'redux-actions';
// import {TYPE} from "./actions";

const initialState: any = {
    show: false,
    title: '',
    icon: '',
    useBack: false,
    useSearch: false,
};

export default handleActions({
    'set_nav': (state: any, actions: any) => {
        return {show: state.show, ...actions.payload};
    },
    'close': (state: any) => {
        return {...state, show: false};
    },
    'toggle': (state: any) => {
        return {...state, show: !state.show};
    },
    'open': (state: any) => {
        return {...state, show: true};
    },
}, initialState);
