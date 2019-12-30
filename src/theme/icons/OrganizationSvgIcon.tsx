import React from 'react';

/**
 * allows us to pass a custom color to the svg component
 */
export const OrganizationSvgIcon = (props: { color?: string; }) => {
    const { color = '#000' } = props;
    return (<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <g fill="none" fillRule="evenodd">
            <rect width="26" height="27" x="5" y="4" stroke={color} strokeWidth="2" rx="1" />
            <path stroke={color} strokeWidth="2" d="M2.5 31h31v1h-31z" />
            <path fill={color} d="M11.5 9H16v3h-4.5zM11.5 16H16v3h-4.5zM11.5 23H16v3h-4.5zM20 9h4.5v3H20zM20 16h4.5v3H20zM20 23h4.5v3H20z" />
        </g>
    </svg>);
};
