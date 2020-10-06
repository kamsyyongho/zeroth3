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
} from '../../../types';

const initialState: EditorStore = {
    segments: [],
    PlayingTimeData: {},
    playingLocation: {segmentIndex: 0, wordIndex: 0},
};

export default handleActions({
    'SET_SEGMENTS': (state: any, actions: any) => {
        return {segments: state.segments, ...actions.payload};
    },
    'SET_PLAYING_LOCATION': (state: any, action: any) => {
        return {playingLocation: state.playingLocation, ...action.payload};
    },
    'toggle': (state: any) => {
        return {...state, show: !state.show};
    },
    'open': (state: any) => {
        return {...state, show: true};
    },
}, initialState);
