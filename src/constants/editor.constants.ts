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

export const renderInputCombination = (input: []) => {
    // if(!input.length) return;
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

//ㅂㅈㄷㄱ쇼ㅕㅑㅐㅔㅁㄴㅇㄹ호ㅓㅏㅣㅋㅌㅊ퓨ㅜ
export const convertKoreanKeyToEnglish = (keycode: string) => {
    switch(keycode) {
        case 'ㅂ' :
            return 'q';
        case 'ㅈ':
            return 'w';
        case 'ㄷ':
            return 'e';
        case 'ㄱ':
            return 'r';
        case 'ㅅ':
            return 't';
        case 'ㅛ':
            return 'y';
        case 'ㅕ':
            return 'u';
        case 'ㅑ':
            return 'i';
        case 'ㅐ':
            return 'o';
        case 'ㅔ':
            return 'p';
        case 'ㅁ':
            return 'a';
        case 'ㄴ':
            return 's';
        case 'ㅇ':
            return 'd';
        case 'ㄹ':
            return 'f';
        case 'ㅎ':
            return 'g';
        case 'ㅗ':
            return 'h';
        case 'ㅓ':
            return 'j';
        case 'ㅏ':
            return 'k';
        case 'ㅣ':
            return 'l';
        case 'ㅋ':
            return 'z';
        case 'ㅌ':
            return 'x';
        case 'ㅊ':
            return 'c';
        case 'ㅍ':
            return 'v';
        case 'ㅠ':
            return 'b';
        case 'ㅜ':
            return 'n';
        case 'ㅡ':
            return 'm';
        default:
            return keycode;
    }
}
//Control, Shift, Alt, Meta, Enter
//altKey, metaKey, shiftKey, ctrlKey