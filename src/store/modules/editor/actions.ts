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
    EDIT_TYPE,
} from '../../../types';

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

export const setUndo = (segmentIndex: number, wordIndex: number, offset: number, editType: EDIT_TYPE, word?: string) => {
    return {type: 'SET_UNDO', payload: {segmentIndex, wordIndex, offset, editType, word}};
};

export const activateUndo = () => {
    return {type: 'ACTIVATE_UNDO'};
}

export const activateRedo = () => {
    return {type: 'ACTIVATE_REDO'};
}

export const initRevertData = () => {
    return {type: 'INIT_REVERT_DATA'};
}

