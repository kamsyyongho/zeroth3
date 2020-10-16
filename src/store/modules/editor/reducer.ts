import { handleActions } from 'redux-actions';
// import {TYPE} from "./actions";
import {
    Segment,
    SegmentResults,
    SegmentAndWordIndex,
    EditorStore,
    RevertData,
    EDIT_TYPE,
} from '../../../types';

const initialState: EditorStore = {
    segments: [],
    PlayingTimeData: {},
    playingLocation: {segmentIndex: 0, wordIndex: 0},
    undoStack: [],
    redoStack: [],
    revertData: null,
    unsavedSegmentIds: [],
};

export default function reducer( state = initialState, action) {
    switch (action.type) {
        case 'SET_SEGMENTS' :
            return {...state, segments: action.payload};
        case 'SET_PLAYING_LOCATION' :
            return {playingLocation: state.playingLocation, ...action.payload};
        case 'SET_UNDO' :
            const { segmentIndex, wordIndex, offset, editType, word } = action.payload;
            const updateSegment = JSON.parse(JSON.stringify(state.segments[segmentIndex]));
            if(editType === EDIT_TYPE.text) updateSegment.wordAlignments[wordIndex].word = word;
            const undoData: RevertData = {
                segment: updateSegment,
                editType: editType,
                textLocation: {segmentIndex, wordIndex, offset},
            }
            return {...state, undoStack: [...state.undoStack, undoData]};
        case 'ACTIVATE_UNDO' :
            const updateUndoStack = state.undoStack.slice(0);
            const lastUndoItem = updateUndoStack.pop();
            const unsavedUndoSegmentId = !state.unsavedSegmentIds.includes(lastUndoItem.segment.id)
                ? [...state.unsavedSegmentIds, lastUndoItem.segment.id] : state.unsavedSegmentIds;
            return {
                ...state,
                revertData: lastUndoItem,
                undoStack: updateUndoStack,
                redoStack: [...state.redoStack, lastUndoItem],
                unsavedSegmentIds: unsavedUndoSegmentId,
            };
        case 'ACTIVATE_REDO' :
            const updateRedoStack = state.redoStack.slice(0);
            const lastRedoItem = updateRedoStack.pop();
            const unsavedRedoSegmentId = !state.unsavedSegmentIds.includes(lastRedoItem.segment.id)
                ? [...state.unsavedSegmentIds, lastRedoItem.segment.id] : state.unsavedSegmentIds;
            return {
                ...state,
                revertData: lastRedoItem,
                undoStack: [...state.undoStack, lastRedoItem],
                redoStack: updateRedoStack,
                unsavedSegmentIds: unsavedRedoSegmentId,
            };
        case 'INIT_REVERT_DATA':
            return{...state, revertData: null};
        case 'INIT_UNSAVED_SEGMENT_IDS':
            return {...state, unsavedSegmentIds: []};
        case 'UPDATE_SEGMENT_WORD' :
            const updatedSegments = state.segments.slice();
            updatedSegments[action.payload.segmentIndex]['wordAlignments'][action.payload.wordIndex]['word'] = action.payload.word;
            return { ...state, segments: updatedSegments };
        default:
            return state;
    }
}
