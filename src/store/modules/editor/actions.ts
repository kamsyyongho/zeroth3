import { EditorStore } from '../../../types';

export default {
    setNav: (navConfig: EditorStore) => {
        return {type: 'set_nav', payload: navConfig};
    },
    close: () => {
        return {type: 'close'};
    },
    open: () => {
        return {type: 'open'};
    },
    toggle: () => {
        return {type: 'toggle'};
    }
}
