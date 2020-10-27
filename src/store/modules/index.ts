import { combineReducers } from 'redux';
import editor from './editor/reducer';
import common from './common/reducer';

export default combineReducers({
    common,
    editor,
});
