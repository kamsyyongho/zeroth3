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

export default {
    setSegments: (segments: Segment[]) => {
        return {type: 'SET_SEGMENTS', payload: segments};
    },
    setPlayingLocation: (playingLocation: SegmentAndWordIndex) => {
        return {type: 'SET_PLAYING_LOCATION', payload: playingLocation};
    },
    open: () => {
        return {type: 'open'};
    },
    toggle: () => {
        return {type: 'toggle'};
    }
}
