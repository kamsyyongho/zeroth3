import {
    PlayingTimeData,
    SegmentAndWordIndex,
    Time,
    Word,
    WordToCreateTimeFor,
} from './editor.types';
import {
    CONTENT_STATUS,
    SegmentResults,
    VoiceData,
    WordAlignment,
    Segment,
} from './voice-data.types';
import {DataSet} from './data-set.types'

export interface EditorStore {
    segments: Segment[];
    PlayingTimeData: PlayingTimeData;
    playingLocation?: SegmentAndWordIndex;
    undoStack?: RevertData[];
    redoStack?: RevertData[];
    revertData?: RevertData;
    unsavedSegmentIds?: string[];
}

export enum EDIT_TYPE {
    text,
    split,
    merge,
    createSegment,
}

export interface RevertData {
    segment: Segment;
    editType: EDIT_TYPE;
    segmentAndWordIndex: SegmentAndWordIndex;
}
