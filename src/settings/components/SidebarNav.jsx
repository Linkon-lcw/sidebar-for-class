/**
 * 侧边栏导航组件
 * 显示设置页面的标签页导航
 * @param {string} selectedTab - 当前选中的标签页
 * @param {Function} onTabSelect - 标签页选择回调函数
 * @param {Object} styles - 样式对象
 */

import React from 'react';
import { Tab, TabList, mergeClasses } from "@fluentui/react-components";
import {
    Settings24Regular,
    AppsList24Regular,
    Desktop24Regular,
    PaintBrush24Regular,
    Bot24Regular,
} from "@fluentui/react-icons";

const SidebarNav = ({ selectedTab, onTabSelect, styles }) => {
    // 标签页列表
    const tabs = ['basic', 'window', 'style', 'components', 'automation'];
    // 当前选中标签页的索引，用于计算活动指示器的位置
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
                <Tab
                    value="automation"
                    className={mergeClasses(styles.tab, selectedTab === 'automation' && styles.tabSelected)}
                    icon={<Bot24Regular className={styles.tabIcon} />}
                    indicator={null}
                >
                    自动化
                </Tab>

            </TabList>
        </aside>
    );
};

export default SidebarNav;
