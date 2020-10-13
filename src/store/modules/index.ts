import { combineReducers } from 'redux';
import editor from './editor/reducer';
import undoable from 'redux-undo';

export default combineReducers({
    editor: undoable(editor),
});
