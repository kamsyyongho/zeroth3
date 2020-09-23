export const SPLIT_CHARACTER = '•';
export const SPLITTABLE_CHARACTERS = [SPLIT_CHARACTER, ' '];
export const SPLIT_CHARACTER_REGEX = new RegExp(SPLIT_CHARACTER, 'g');
export const DECODER_DIFF_CLASSNAME = 'decoderDiff';
export const DEFAULT_SHORTCUTS = {
        approvalRequest: ['Control',"a"],
        save: ['Control',"s"],
        undo: ['Control', "z"],
        redo: ['Control','Shift', "Z"],
        merge: ['Shift', "Space"],
        split: ['Shift', 'Enter'],
        toggleMore: ['Alt', 'Shift'],
        editSegmentTime: ['Alt', 'Enter'],
        setThreshold: ['Control', "t"],
        shortcuts: ['Alt', "h"],
        speaker: ['Shift', 'Control', "X"],
        rewindAudio: ['Alt', 'ArrowLeft'],
        forwardAudio: ['Alt', 'ArrowRight'],
        audioPlayPause: ['Alt', "Space"],
        toggleAutoSeek: ['Control', 'm'],
        toggleAutoScroll: ['Control', 'n'],
        loop: ['Control', 'l'],
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
