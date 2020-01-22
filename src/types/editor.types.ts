import {
  ContentBlock,
  DraftBlockType,
  RawDraftEntity,
  RawDraftEntityRange,
  RawDraftInlineStyleRange,
} from 'draft-js';
import { Segment, WordAlignment } from './voice-data.types';
export interface Range {
  start: number;
  end: number; // this value used as rangeIndex
  text: string;
  data?: unknown; // the parent component props
}

export interface Time {
  start?: number;
  end?: number;
}

export interface Word {
  color: string;
  time?: Time;
  range: Range;
}

export interface WordsbyRangeStartAndEndIndexes {
  [x: string]: Word;
}

export interface WordToCreateTimeFor extends Word {
  segmentStartTime: number;
  segmentEndTime?: number;
  wordKey: string;
}

export type SegmentAndWordIndex = [number, number];

export interface WordAlignmentEntityData {
  wordKey: number;
  wordAlignment: WordAlignment;
}

export interface SegmentBlockData {
  segment?: Segment;
}

export interface EntityMap {
  [key: string]: RawDraftEntity<WordAlignmentEntityData>;
}

export interface EntityRangeByEntityKey {
  [x: string]: RawDraftEntityRange;
}

export interface EntityKeyToWordAlignmentKey {
  [x: number]: string;
}

export interface EntityKeyToWordKey {
  [x: number]: number;
}

export interface WordKeyToEntityKey {
  [x: number]: number;
}

export interface BlockKeyToSegmentId {
  [x: string]: string;
}

export interface SegmentIdToBlockKey {
  [x: string]: string;
}

export interface TargetSelection {
  anchorOffset: number;
  focusOffset: number;
  anchorKey: string;
  focusKey: string;
}

export interface CharacterProperties {
  /** any inline styles for this character */
  style: INLINE_STYLE_TYPE[];
  /** the entity key for this character */
  entity: string | null;
}

/**
 * The object returned from the `toJS` method of a block
 */
export interface BlockInfo<T = {}> {
  blockObject: BlockObject<T>;
  block: ContentBlock;
  entityRanges: RawDraftEntityRange[];
  inlineStyleRanges: RawDraftInlineStyleRange[];
}

/**
 * The object returned from the `toJS` method of a block
 */
export interface BlockObject<T = {}> {
  key: string;
  type: DraftBlockType;
  text: string;
  characterList: CharacterProperties[];
  depth: number;
  data: T;
}

export interface CharacterDetails {
  character: string;
  properties?: CharacterProperties;
}

export interface CursorContent<T, U> {
  /** if there is no selected text */
  isNoSelection: boolean;
  entity: RawDraftEntity<T> | null;
  isEndOfBlock: boolean;
  isStartOfBlock: boolean;
  characterDetailsBeforeCursor: CharacterDetails;
  characterDetailsAtCursor: CharacterDetails;
  cursorOffset: number;
  blockObject: BlockObject<U>;
  blockEntityRanges: RawDraftEntityRange[];
  blockInlineStyleRanges: RawDraftInlineStyleRange[];
}

export enum KEY_COMMANDS {
  'undo' = 'undo',
  'redo' = 'redo',
  'delete' = 'delete',
  'delete-word' = 'delete-word',
  'backspace' = 'backspace',
  'backspace-word' = 'backspace-word',
  'backspace-to-start-of-line' = 'backspace-to-start-of-line',
  'bold' = 'bold',
  'code' = 'code',
  'italic' = 'italic',
  'strikethrough' = 'strikethrough',
  'underline' = 'underline',
  'split-block' = 'split-block',
  'transpose-characters' = 'transpose-characters',
  'move-selection-to-start-of-block' = 'move-selection-to-start-of-block',
  'move-selection-to-end-of-block' = 'move-selection-to-end-of-block',
  'secondary-cut' = 'secondary-cut',
  'secondary-paste' = 'secondary-paste',
  // start of custom types
  'merge-segments-back' = 'merge-segments-back',
  'merge-segments-forward' = 'merge-segments-forward',
  'toggle-popups' = 'toggle-popups',
}

export enum REMOVAL_DIRECTION {
  'backward' = 'backward',
  'forward' = 'forward',
}

export enum HANDLE_VALUES {
  'handled' = 'handled',
  'not-handled' = 'not-handled',
}

export enum BLOCK_TYPE {
  'unstyled' = 'unstyled',
  'paragraph' = 'paragraph',
  'header-one' = 'header-one',
  'header-two' = 'header-two',
  'header-three' = 'header-three',
  'header-four' = 'header-four',
  'header-five' = 'header-five',
  'header-six' = 'header-six',
  'unordered-list-item' = 'unordered-list-item',
  'ordered-list-item' = 'ordered-list-item',
  'blockquote' = 'blockquote',
  'code-block' = 'code-block',
  'atomic' = 'atomic',
  // start of custom types
  'segment' = 'segment',
}

export enum EDITOR_CHANGE_TYPE {
  'adjust-depth' = 'adjust-depth',
  'apply-entity' = 'apply-entity',
  'backspace-character' = 'backspace-character',
  'change-block-data' = 'change-block-data',
  'change-block-type' = 'change-block-type',
  'change-inline-style' = 'change-inline-style',
  'delete-character' = 'delete-character',
  'insert-characters' = 'insert-characters',
  'insert-fragment' = 'insert-fragment',
  'redo' = 'redo',
  'remove-range' = 'remove-range',
  'spellcheck-change' = 'spellcheck-change',
  'split-block' = 'split-block',
  'undo' = 'undo',
}

export enum MUTABILITY_TYPE {
  'MUTABLE' = 'MUTABLE',
  'IMMUTABLE' = 'IMMUTABLE',
  'SEGMENTED' = 'SEGMENTED',
}

export enum ENTITY_TYPE {
  'LINK' = 'LINK',
  'TOKEN' = 'TOKEN',
  'PHOTO' = 'PHOTO',
  'IMAGE' = 'IMAGE',
}

export enum INLINE_STYLE_TYPE {
  'BOLD' = 'BOLD',
  'CODE' = 'CODE',
  'ITALIC' = 'ITALIC',
  'STRIKETHROUGH' = 'STRIKETHROUGH',
  'UNDERLINE' = 'UNDERLINE',
  // start of custom types
  'PLAYING' = 'PLAYING',
}
