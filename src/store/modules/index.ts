import { combineReducers } from 'redux';
import { EditorReducer } from './editor/reducer';
import { CommonReducer } from './common/reducer';

export default combineReducers({
    CommonReducer,
    EditorReducer,
});
