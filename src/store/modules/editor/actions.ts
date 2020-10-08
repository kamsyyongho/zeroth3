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

export const SET_SEGMENTS = 'SET_SEGMENTS';
export const SET_PLAYING_LOCATION = 'SET_PLAYING_LOCATION';
export const setSegments =  (segments: Segment[]) => {
    console.log('===== segments in setSegments : ', segments);
    return {type: 'SET_SEGMENTS', payload: segments};
};

export const setPlayingLocation = (playingLocation: SegmentAndWordIndex) => {
    return {type: 'SET_PLAYING_LOCATION', payload: playingLocation};
};

export const open = () => {
    return {type: 'open'};
};

export const toggle = () => {
    return {type: 'toggle'};
};
