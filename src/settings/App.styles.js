import { makeStyles, shorthands } from "@fluentui/react-components";

export const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        backgroundColor: 'var(--colorNeutralBackground1)',
        fontFamily: '"Segoe UI Variable Display", "Segoe UI", "Microsoft YaHei", sans-serif',
    },
    sidebar: {
        width: '280px',
        ...shorthands.padding('8px', '4px', '12px', '4px'),
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--colorNeutralBackground2)',
        boxShadow: 'inset -1px 0 0 0 var(--colorNeutralStroke2)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        gap: '12px',
    },
    appIcon: {
        fontSize: '20px',
        color: 'var(--colorCompoundBrandStroke)',
    },
    headerTitle: {
        fontSize: '14px',
        fontWeight: '400',
    },
    menuButton: {
        ...shorthands.margin('4px', '4px', '12px', '4px'),
        minWidth: '40px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        ...shorthands.borderRadius('4px'),
        fontSize: '18px',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        }
    },
    tabList: {
        rowGap: '2px',
        position: 'relative',
        cursor: 'default',
        '& .fui-TabList__indicator': {
            display: 'none !important',
        },
        '& .fui-Tab__indicator': {
            display: 'none !important',
        },
        '& .fui-TabList__indicatorSelected': {
            display: 'none !important',
        },
    },
    activeIndicator: {
        position: 'absolute',
        left: '8px',
        width: '3px',
        height: '20px',
        backgroundColor: 'var(--colorBrandStroke1)',
        ...shorthands.borderRadius('2px'),
        zIndex: 10,
        transitionProperty: 'transform, opacity',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.33, 0, 0.67, 1)',
        pointerEvents: 'none',
        top: '12px', // Initial top (2px margin + 10px inner offset)
    },
    tab: {
        height: '40px',
        minHeight: '40px',
        ...shorthands.borderRadius('4px'),
        ...shorthands.margin('2px', '8px'),
        ...shorthands.padding('0px', '12px', '0px', '12px'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        cursor: 'default',
        backgroundColor: 'transparent',
        transitionProperty: 'background-color, color, transform',
        transitionDuration: '150ms',
        boxSizing: 'border-box',
        '&:hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        },
        '&:active': {
            backgroundColor: 'var(--colorNeutralBackground1Selected)', // Or a lighter shade
            transform: 'scale(0.98)', // Add a subtle press effect
        },
        '&::after': {
            display: 'none !important',
        },
        '&::before': {
            display: 'none !important',
        },
        '& .fui-Tab__indicator': {
            display: 'none !important',
        },
    },
    tabSelected: {
        backgroundColor: 'var(--colorNeutralBackground1Selected) !important',
        color: 'var(--colorNeutralForeground1Selected) !important',
        fontWeight: '600',
        '&:hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover) !important',
        },
        '&:active': {
            backgroundColor: 'var(--colorNeutralBackground1Selected) !important',
            opacity: 0.8,
        }
    },
    tabIcon: {
        fontSize: '20px',
        width: '20px',
        height: '20px',
        marginRight: '12px',
        marginLeft: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    divider: {
        height: '1px',
        backgroundColor: 'var(--colorNeutralStroke2)',
        ...shorthands.margin('12px', '16px'),
    },
    main: {
        flexGrow: 1,
        ...shorthands.padding('32px', '24px'),
        overflowY: 'auto',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '1000px',
    },
    card: {
        ...shorthands.padding('16px', '24px'),
        backgroundColor: 'var(--colorNeutralBackground1)',
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'),
        // boxShadow: 'var(--shadow2)',
        ...shorthands.borderRadius('4px'),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        }
    },
    groupTitle: {
        fontSize: '14px',
        fontWeight: '600',
        marginTop: '24px',
        marginBottom: '8px',
        color: 'var(--colorNeutralForeground1)',
    },
    sectionHeader: {
        marginBottom: '20px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '8px',
        lineHeight: '1.2',
    },
    description: {
        color: 'var(--colorNeutralForeground2)',
        fontSize: '14px',
        lineHeight: '1.5',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
    },
    footer: {
        marginTop: '40px',
        display: 'flex',
        justifyContent: 'flex-end',
        ...shorthands.padding('0', '0', '40px', '0'),
    },
    rangeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '4px',
    },
    rangeValue: {
        minWidth: '48px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--colorBrandForeground1)',
        textAlign: 'right',
    },
    helpText: {
        color: 'var(--colorNeutralForeground3)',
        fontSize: '12px',
        marginTop: '4px',
    }
});
