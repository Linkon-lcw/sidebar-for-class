import React from 'react';
import { Tab, TabList, mergeClasses } from "@fluentui/react-components";
import {
    Settings24Regular,
    AppsList24Regular,
    Desktop24Regular,
} from "@fluentui/react-icons";

const SidebarNav = ({ selectedTab, onTabSelect, styles }) => {
    return (
        <aside className={styles.sidebar}>
            <TabList
                vertical
                selectedValue={selectedTab}
                onTabSelect={(_, data) => onTabSelect(data.value)}
                className={styles.tabList}
            >
                <Tab
                    value="basic"
                    className={mergeClasses(styles.tab, selectedTab === 'basic' && styles.tabSelected)}
                    icon={<Settings24Regular className={styles.tabIcon} />}
                >
                    基本
                </Tab>
                <Tab
                    value="components"
                    className={mergeClasses(styles.tab, selectedTab === 'components' && styles.tabSelected)}
                    icon={<AppsList24Regular className={styles.tabIcon} />}
                >
                    组件
                </Tab>
                <Tab
                    value="window"
                    className={mergeClasses(styles.tab, selectedTab === 'window' && styles.tabSelected)}
                    icon={<Desktop24Regular className={styles.tabIcon} />}
                >
                    窗口
                </Tab>
            </TabList>
        </aside>
    );
};

export default SidebarNav;
