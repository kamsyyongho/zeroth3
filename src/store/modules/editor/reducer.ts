export default {
    setNav: (navConfig: any) => {
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

