import { Segment } from '../../../types';
import log from '../../../util/log/logger';
import { EDITOR_CONTROLS } from '../components/EditorControls';

/** gets the time in segments of a word alignment item */
export const calculateWordTime = (
  segments: Segment[],
  segmentIndex: number,
  wordIndex: number,
) => {
  console.log('================arguments in caculateWordTime', segments, segmentIndex, wordIndex);
  try {
    const segment = segments[segmentIndex];
    const word = segment.wordAlignments[wordIndex];
    const segmentTime = segment.start;
    const wordTime = word.start;
    let totalTime = segmentTime + wordTime;
    // set to 2 sig figs
    totalTime = Number(totalTime.toFixed(2));
    return totalTime;
  } catch (error) {
    log({
      file: `editor-page.helper.ts`,
      caller: `calculateWordTime - failed to calculate time`,
      value: error.toString(),
      important: true,
    });
    return 0;
  }
};

export const getDisabledControls = (
  segments: Segment[],
  canUndo?: boolean,
  canRedo?: boolean,
  saveSegmentsLoading?: boolean,
  confirmSegmentsLoading?: boolean,
) => {
  const disabledControls: EDITOR_CONTROLS[] = [];
  const mergeDisabled = segments.length < 2;
  if (!canUndo) {
    disabledControls.push(EDITOR_CONTROLS.undo);
  }
  if (!canRedo) {
    disabledControls.push(EDITOR_CONTROLS.redo);
  }
  if (mergeDisabled) {
    disabledControls.push(EDITOR_CONTROLS.merge);
  }
  const splitDisabled = !segments.some(
    segment => segment.wordAlignments.length > 0,
  );
  if (splitDisabled) {
    disabledControls.push(EDITOR_CONTROLS.split);
  }
  if (saveSegmentsLoading || confirmSegmentsLoading) {
    disabledControls.push(EDITOR_CONTROLS.save);
    disabledControls.push(EDITOR_CONTROLS.confirm);
  }
  return disabledControls;
};
