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
    UndoData,
} from '../../../../types';

export const SET_SEGMENTS = 'SET_SEGMENTS';
export const SET_PLAYING_LOCATION = 'SET_PLAYING_LOCATION';
export const setSegments =  (segments: Segment[]) => {
    return {type: 'SET_SEGMENTS', payload: segments};
};

export const setPlayingLocation = (playingLocation: SegmentAndWordIndex) => {
    return {type: 'SET_PLAYING_LOCATION', payload: playingLocation};
};

export const updateSegmentWord = (segmentIndex: number, wordIndex: number, word: string) => {
    return {type: 'UPDATE_SEGMENT_WORD', payload: {segmentIndex, wordIndex, word}}
};

export const open = () => {
    return {type: 'open'};
};

export const toggle = () => {
    return {type: 'toggle'};
};
