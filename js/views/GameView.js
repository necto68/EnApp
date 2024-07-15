import React, { Component, forwardRef } from 'react';
import { View, Text, KeyboardAvoidingView, TouchableNativeFeedback, Dimensions } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import moment from 'moment';
import { Button, Container, Header, Tab, Tabs, Title, ScrollableTab, TabHeading, Icon, Badge, Right } from 'native-base';

import IconEntypo from 'react-native-vector-icons/Entypo';

import Helper from '../util/helper';

import Colors from '../constants/colors';

import CountableText from '../core/components/CountableText';

import ProgressBarView from './ProgressBarView';
import TabsView from './TabsView';

import CodeSection from '../sections/CodeSection';

import onSettingsButtonClick from '../core/events/onSettingsButtonClick';
import onLevelNumberClick from '../core/events/onLevelNumberClick';


const mapStateToProps = (stores => ({
    lastUpdateTimestamp: stores.gameStore.lastUpdateTimestamp,
    updateGameModel: stores.gameStore.updateGameModel,
    Level: stores.gameStore.gameModel.Level,
    LevelSequence: stores.gameStore.gameModel.LevelSequence,
    Levels: stores.gameStore.gameModel.Levels,
}));

const GameView = ({ lastUpdateTimestamp, updateGameModel, Level, LevelSequence, Levels }) => (
    <Container>
        <Header style={styles.headerStyle} hasTabs>
            <View style={styles.timersContainer}>
                {
                    Level.Timeout > 0 && (
                        <CountableText
                            increment
                            start={Level.Timeout - Level.TimeoutSecondsRemain}
                            textStyle={{ color: Colors.white }}
                        />
                    )
                }

                {
                    Level.Timeout > 0 && (
                        <CountableText
                            start={Level.TimeoutSecondsRemain}
                            textStyle={{ color: Colors.upTime }}
                        />
                    )
                }
                {
                    Level.TimeoutAward !== 0 && (
                        <Text
                            style={{ color: Colors.wrongCode }}
                        >
                            {`(${Helper.formatCount(Math.abs(Level.TimeoutAward), { collapse: true, withUnits: true })})`}
                        </Text>
                    )
                }
            </View>
            <TouchableNativeFeedback
                onPress={() => {
                    if (LevelSequence === 3) {
                        onLevelNumberClick();
                    }
                }}
            >
                <View style={styles.levelNumberTouchable}>
                    <Title style={styles.levelNumber}>{`${Level.Number}/${Levels.length}`}</Title>
                    {
                        LevelSequence === 3 &&
                        <Icon name="arrow-dropdown" style={{ color: Colors.white, marginLeft: 3 }} />
                    }
                </View>
            </TouchableNativeFeedback>
            <Right>
                <TouchableNativeFeedback onPress={() => updateGameModel()}>
                    <View style={styles.lastUpdateContainer}>
                        <Text
                            style={styles.lastUpdateTitle}
                        >
                            {'Обновлено'}
                        </Text>
                        <CountableText
                            increment
                            start={moment.duration(Date.now() - lastUpdateTimestamp).asSeconds()}
                            formatCountOptions={{ collapse: true, withUnits: true, showZeroSeconds: true }}
                            textStyle={{ color: Colors.upTime }}
                        />
                        <Text
                            style={styles.lastUpdateTitle}
                        >
                            {'назад'}
                        </Text>
                    </View>
                </TouchableNativeFeedback>
                <Button
                    transparent
                    onPress={onSettingsButtonClick}
                    style={styles.menuButton}
                >
                    <IconEntypo style={{ fontSize: 20, color: 'white' }} name="dots-three-vertical" />
                </Button>
            </Right>
        </Header>
        <ProgressBarView />
        <TabsView />
        {
            !Level.IsPassed ? <CodeSection onScrollToSector={() => ({})} /> : null
        }
    </Container>
);

const styles = {
    mainContainer: {
        backgroundColor: Colors.background,
        flex: 1,
        padding: 7,
    },

    headerStyle: {
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.tabBackground,
    },

    timersContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    levelNumber: {
        color: Colors.white,
    },

    levelNumberTouchable: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    menuButton: {
        // flex: 1,
        // justifyContent: 'flex-end',
    },

    tabIcon: {
        fontSize: 30,
        color: Colors.white,
    },

    tabBadge: {
        transform: [{
            scale: 0.8,
        }],
    },

    lastUpdateContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },

    lastUpdateTitle: {
        color: Colors.white,
        fontSize: 12,
    },
};

export default inject(mapStateToProps)(observer(GameView));
