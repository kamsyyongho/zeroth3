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
}
