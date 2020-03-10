/** finds the location of the playing word on the screen and scrolls to keep it visible */
export const checkLocationOnScreenAndScroll = (
  referenceElement: HTMLButtonElement | null,
  editorElement: Element | null,
  editorContentHeight = 0,
  windowHeight = 0,
) => {
  const AUTO_SCROLL_AREA_RATIO = 1 / 6; // only the bottom portion of the editor
  const heightRange =
    editorContentHeight - editorContentHeight * AUTO_SCROLL_AREA_RATIO;
  const nonScrollArea = (windowHeight - editorContentHeight) / 2; // only use the area above the editor
  // check the location and scroll accordingly
  if (referenceElement && nonScrollArea && editorElement && heightRange) {
    const { bottom } = referenceElement.getBoundingClientRect();
    const adjustedBottom = bottom - nonScrollArea;
    // scroll up if we are at the bottom
    if (
      adjustedBottom > heightRange &&
      editorContentHeight &&
      adjustedBottom < editorContentHeight
    ) {
      editorElement.scrollTo({
        behavior: 'smooth',
        top: editorElement.scrollTop + 200,
        left: 0,
      });
      // scroll up/down if it is off the screen
    } else if (
      (editorContentHeight && adjustedBottom > editorContentHeight) ||
      bottom < 0
    ) {
      referenceElement.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }
};
