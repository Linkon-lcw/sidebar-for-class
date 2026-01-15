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
        cursor: 'pointer',
        ...shorthands.borderRadius('4px'),
        fontSize: '18px',
        ':hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        }
    },
    tabList: {
        rowGap: '2px',
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
        cursor: 'pointer',
        backgroundColor: 'transparent',
        transitionProperty: 'background-color, color',
        transitionDuration: '200ms',
        boxSizing: 'border-box',
        '&:hover': {
            backgroundColor: 'var(--colorNeutralBackground1Hover)',
        },
        '&::after': {
            display: 'none !important',
        },
    },
    tabSelected: {
        backgroundColor: 'var(--colorNeutralBackground3) !important',
        color: 'var(--colorNeutralForeground1Selected) !important',
        fontWeight: '600',
        '&::before': {
            content: '""',
            position: 'absolute',
            left: '0',
            top: '10px',
            bottom: '10px',
            width: '3px',
            backgroundColor: 'var(--colorBrandStroke1)',
            ...shorthands.borderRadius('2px'),
            zIndex: 10,
            display: 'block',
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
        ...shorthands.padding('48px', '60px'),
        overflowY: 'auto',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1000px',
    },
    card: {
        ...shorthands.padding('24px'),
        backgroundColor: 'var(--colorNeutralBackground1)',
        ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'),
        boxShadow: 'var(--shadow2)',
        ...shorthands.borderRadius('8px'),
    },
    sectionHeader: {
        marginBottom: '32px',
    },
    title: {
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '4px',
    },
    description: {
        color: 'var(--colorNeutralForeground2)',
        fontSize: '14px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '24px',
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
