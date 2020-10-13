import { handleActions } from 'redux-actions';
// import {TYPE} from "./actions";
import {
    CONTENT_STATUS,
    DataSet,
    PlayingTimeData,
    Segment,
    SegmentResults,
    SegmentAndWordIndex,
    SNACKBAR_VARIANTS,
    SnackbarError,
    Time,
    VoiceData,
    Word,
    WordAlignment,
    WordToCreateTimeFor,
    EditorStore,
} from '../../../../types';

const initialState: EditorStore = {
    segments: [],
    PlayingTimeData: {},
    playingLocation: {segmentIndex: 0, wordIndex: 0},
};

export default function reducer( state = initialState, action) {
    switch (action.type) {
        case 'SET_SEGMENTS' :
            return {...state, segments: action.payload};
        case 'SET_PLAYING_LOCATION' :
            return {playingLocation: state.playingLocation, ...action.payload};
        case 'EDITOR_UNDO' :
            console.log('======EDITOR.UNDO : ', action);
            // return {...state, segments: }
            return;
        case 'UPDATE_SEGMENT_WORD' :
            const updatedSegments = state.segments.slice();
            updatedSegments[action.payload.segmentIndex]['wordAlignments'][action.payload.wordIndex]['word'] = action.payload.word;
            return { ...state, segments: updatedSegments };

        default:
            return state;
    }
}
