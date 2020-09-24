export const SPLIT_CHARACTER = '•';
export const SPLITTABLE_CHARACTERS = [SPLIT_CHARACTER, ' '];
export const SPLIT_CHARACTER_REGEX = new RegExp(SPLIT_CHARACTER, 'g');
export const DECODER_DIFF_CLASSNAME = 'decoderDiff';
export const META_KEYS = {
    META: "Meta",
    CONTROL: "Control",
    ALT: "Alt",
    SHIFT: "Shift",
};

export const DEFAULT_SHORTCUTS = {
    approvalRequest: [META_KEYS.CONTROL,"a"],
    save: [META_KEYS.CONTROL,"s"],
    undo: [META_KEYS.CONTROL, "z"],
    redo: [META_KEYS.CONTROL,'Shift', "Z"],
    merge: [META_KEYS.SHIFT, "Space"],
    split: [META_KEYS.SHIFT, 'Enter'],
    toggleMore: [META_KEYS.ALT, 'Shift'],
    editSegmentTime: [META_KEYS.ALT, 'Enter'],
    setThreshold: [META_KEYS.CONTROL, "t"],
    shortcuts: [META_KEYS.ALT, "h"],
    speaker: [META_KEYS.SHIFT, 'Control', "X"],
    rewindAudio: [META_KEYS.ALT, 'ArrowLeft'],
    forwardAudio: [META_KEYS.ALT, 'ArrowRight'],
    audioPlayPause: [META_KEYS.ALT, "Space"],
    toggleAutoSeek: [META_KEYS.CONTROL, 'm'],
    toggleAutoScroll: [META_KEYS.CONTROL, 'n'],
    loop: [META_KEYS.CONTROL, 'l'],
    //     createWord: ['Control', 'Enter'],
    //     debug: [],
};

export const renderInputCombination = (input: any) => {
    let result = '';
    input.forEach((input: string, index: number) => {
        if(index > 0) result += ' + '
        switch(input) {
            case 'Meta' :
                result += '⌘ Cmd';
                break;
            case 'Control':
                result += 'Ctrl';
                break;
            case 'Shift':
                result += '⇧ Shift';
                break;
            case 'Enter':
                result += '↵ Enter';
                break;
            case 'Backspace':
                result += '⌫ Backspace';
                break;
            case 'Opt':
                result += '⌥ Opt';
                break;
            case 'Return':
                result += '⏎ Return';
                break;
            case 'ArrowLeft':
                result += '← ArrowLeft'
                break;
            case 'ArrowRight':
                result += '→ ArrowRight';
                break;
            case 'ArrowUp':
                result += '↑ ArrowRight';
                break;
            case 'ArrowDown':
                result += '↓ ArrowDown';
                break;
            case ' ':
            case 'Space':
                result += 'Space';
                break;
            default:
                result += input.toUpperCase();
        }
    });
    return result;
}
//Control, Shift, Alt, Meta, Enter
//altKey, metaKey, shiftKey, ctrlKey
