import React from 'react';
import { Tab, TabList, mergeClasses } from "@fluentui/react-components";
import {
    Settings24Regular,
    AppsList24Regular,
    Desktop24Regular,
    PaintBrush24Regular,
} from "@fluentui/react-icons";

const SidebarNav = ({ selectedTab, onTabSelect, styles }) => {
    const tabs = ['basic', 'window', 'style', 'components'];
    const selectedIndex = tabs.indexOf(selectedTab);

    return (
        <aside className={styles.sidebar}>
            <TabList
                vertical
                selectedValue={selectedTab}
                onTabSelect={(_, data) => onTabSelect(data.value)}
                className={styles.tabList}
                indicator={null}
            >
                <div
                    className={styles.activeIndicator}
                    style={{
                        transform: `translateY(${selectedIndex * 46}px)`,
                        opacity: selectedIndex === -1 ? 0 : 1
                    }}
                />
                <Tab
                    value="basic"
                    className={mergeClasses(styles.tab, selectedTab === 'basic' && styles.tabSelected)}
                    icon={<Settings24Regular className={styles.tabIcon} />}
                    indicator={null}
                >
                    基本
                </Tab>
                <Tab
                    value="window"
                    className={mergeClasses(styles.tab, selectedTab === 'window' && styles.tabSelected)}
                    icon={<Desktop24Regular className={styles.tabIcon} />}
                    indicator={null}
                >
                    窗口
                </Tab>
                <Tab
                    value="style"
                    className={mergeClasses(styles.tab, selectedTab === 'style' && styles.tabSelected)}
                    icon={<PaintBrush24Regular className={styles.tabIcon} />}
                    indicator={null}
                >
                    样式
                </Tab>
                <Tab
                    value="components"
                    className={mergeClasses(styles.tab, selectedTab === 'components' && styles.tabSelected)}
                    icon={<AppsList24Regular className={styles.tabIcon} />}
                    indicator={null}
                >
                    组件
                </Tab>

            </TabList>
        </aside>
    );
};

export default SidebarNav;
