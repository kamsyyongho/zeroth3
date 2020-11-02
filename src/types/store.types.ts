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
import {Organization} from './organizations.types';
import {DataSet} from './data-set.types'

export interface EditorStore {
    segments: Segment[];
    PlayingTimeData: PlayingTimeData;
    playingLocation?: SegmentAndWordIndex;
    undoStack: RevertData[];
    redoStack: RevertData[];
    revertData: RevertData;
    unsavedSegmentIds: string[];
}

export enum EDIT_TYPE {
    text,
    split,
    merge,
    createSegment,
}

export interface TextLocation {
    segmentIndex: number;
    wordIndex: number;
    offset: number;
}

export interface RevertData {
    updatedSegment: Segment;
    editType: EDIT_TYPE;
    textLocation: TextLocation;
}

export interface CommonStore {
    organizations: Organization[];
    currentOrganization: Organization;
}
