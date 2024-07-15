import React from 'react';
import { Animated, Dimensions, View, Text } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import Colors from '../constants/colors';
import Helper from '../util/helper';

import CountableText from '../core/components/CountableText';

import TaskSection from '../sections/TaskSection';
import SectorsSection from '../sections/SectorsSection';
import HintsSection from '../sections/HintsSection';
import BonusesSection from '../sections/BonusesSection';

const mapStateToProps = (stores => ({
    currentTabsPage: stores.gameStore.currentTabsPage,
    setCurrentTabsPage: stores.gameStore.setCurrentTabsPage,
    Level: stores.gameStore.gameModel.Level,
    Sectors: stores.gameStore.gameModel.Level.Sectors,
    Hints: stores.gameStore.gameModel.Level.Helps,
    PenaltyHints: stores.gameStore.gameModel.Level.PenaltyHelps,
    Bonuses: stores.gameStore.gameModel.Level.Bonuses,
}));

const renderScene = SceneMap({
    taskSection: TaskSection,
    sectorsSection: SectorsSection,
    hintsSection: HintsSection,
    bonusesSection: BonusesSection,
});

const TabsView = ({ currentTabsPage, Level, setCurrentTabsPage, Sectors, Hints, PenaltyHints, Bonuses }) => {
    const renderLabel = (scene) => {
        const key = scene.route.key;

        if (key === 'taskSection') {
            return (
                <Animated.Text style={[styles.tabLabel, styles.tabText]}>
                    {
                        Helper.formatWithNewLine([
                            'ЗАДАНИЕ',
                            Level.Messages.length > 0 ? `(${Level.Messages.length})` : '',
                        ])
                    }
                </Animated.Text>
            );
        } else if (key === 'sectorsSection') {
            return (
                <Animated.Text style={[styles.tabLabel, styles.tabText]}>
                    {
                        Helper.formatWithNewLine([
                            'СЕКТОРЫ',
                            `(${Level.SectorsLeftToClose})`,
                        ])
                    }
                </Animated.Text>
            );
        } else if (key === 'hintsSection') {
            const nextHint = Hints.find(hint => hint.RemainSeconds > 0);

            return (
                nextHint ? (
                    <View>
                        <Text style={styles.tabText}>ПОДСКАЗКИ</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.tabText}>{`(${nextHint.Number}/${Hints.length} - `}</Text>
                            <CountableText start={nextHint.RemainSeconds} textStyle={styles.tabText} />
                            <Text style={styles.tabText}>)</Text>
                        </View>
                    </View>
                ) : (
                    <Animated.Text style={[styles.tabLabel, styles.tabText]}>
                        {
                            Helper.formatWithNewLine([
                                'ПОДСКАЗКИ',
                                Hints.length ? `(${Hints.length}/${Hints.length})` : '',
                            ])
                        }
                    </Animated.Text>
                )
            );
        } else if (key === 'bonusesSection') {
            return (
                <Animated.Text style={[styles.tabLabel, styles.tabText]}>
                    {
                        Helper.formatWithNewLine([
                            'БОНУСЫ',
                            `(${Bonuses.filter(bonus => bonus.IsAnswered).length}/${Bonuses.length})`,
                        ])
                    }
                </Animated.Text>
            );
        }

        return null;
    };

    const routesArray = [];

    routesArray.push({
        key: 'taskSection',
    });

    if (Sectors.length > 0) {
        routesArray.push({
            key: 'sectorsSection',
        });
    }

    if (Hints.length > 0 || PenaltyHints.length > 0) {
        routesArray.push({
            key: 'hintsSection',
        });
    }

    if (Bonuses.length > 0) {
        routesArray.push({
            key: 'bonusesSection',
        });
    }

    return (
        <TabView
            style={{ flex: 1 }}
            navigationState={{
                index: currentTabsPage,
                routes: routesArray,
            }}
            renderScene={renderScene}
            renderTabBar={props => (
                <TabBar
                    {...props}
                    renderLabel={renderLabel}
                    scrollEnabled
                    layout={{
                        width: Dimensions.get('window').width,
                        height: 0,
                        measured: false,
                    }}
                    style={{ backgroundColor: Colors.tabBackground }}
                    tabStyle={{ width: 100 }}
                    indicatorStyle={styles.tabBarUnderlineStyle}
                />
            )}
            onIndexChange={index => setCurrentTabsPage(index)}
            useNativeDriver
            keyboardDismissMode="on-drag"
        />
    );
};

const styles = {
    tabLabel: {
        backgroundColor: 'transparent',
        color: Colors.white,
        margin: 2,
        padding: 2,
    },

    tabText: {
        textAlign: 'center',
        fontSize: 11,
        color: Colors.white,
    },

    tabBarUnderlineStyle: {
        backgroundColor: Colors.white,
    },
};

export default inject(mapStateToProps)(observer(TabsView));
