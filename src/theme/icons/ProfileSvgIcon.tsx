import React from 'react';

/**
 * allows us to pass a custom color to the svg component
 */
export const ProfileSvgIcon = (props: { color?: string; }) => {
    const { color = '#000' } = props;
    return (<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="36" height="36" viewBox="0 0 36 36">
    <defs>
        <circle id="a" cx="18" cy="18.75" r="17.25"/>
    </defs>
    <g fill="none" fillRule="evenodd">
        <circle cx="18" cy="18" r="17" stroke={color} strokeWidth="2"/>
        <mask id="b" fill='#fff' >
            <use xlinkHref="#a"/>
        </mask>
        <path stroke={color} strokeLinejoin="round" strokeWidth="2" d="M12.94 23.214c-2.234-1.597-3.547-4.102-3.544-6.76C9.396 11.785 13.368 8 18.267 8c4.9 0 8.87 3.785 8.87 8.454.003 2.658-1.31 5.162-3.543 6.76C32.794 26.93 33.267 40 33.267 40h-30s.474-13.069 9.673-16.786z" mask="url(#b)"/>
    </g>
</svg>);
};
