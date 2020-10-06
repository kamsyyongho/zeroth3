export interface EditorStore {
    show?: boolean;
    title: string;
    icon?: string;
    useBack?: boolean;
    useSearch?: boolean;
    onSearch?: any;
    onSelectCategory?: any;
    onSelectFilter?: any;
    selectedFilter?: string;
    initFilter?: any;
}
