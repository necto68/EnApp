import React, { Component } from 'react';
import { observer, inject } from 'mobx-react/native';
import { FlatList, View } from 'react-native';
import Colors from '../constants/colors';
import MonitoringItem from '../gameComponents/MonitoringItem';
import UpdatesQueueItem from '../gameComponents/UpdatesQueueItem';
import Helper from '../util/helper';

const mapStateToProps = stores => ({
    actualCode: stores.gameStore.actualCode,
    actions: stores.gameStore.gameModel.Level.MixedActions,
    localUserId: stores.gameStore.gameModel.UserId,
    updatesQueue: stores.gameStore.updatesQueue,
});

const MonitoringSection = ({ actualCode, actions, localUserId, updatesQueue }) => {
    const updatesQueueCastedToActions = updatesQueue
        .filter(({ LevelId }) => LevelId)
        .map(item => ({
            ...item,
            ActionId: item.$uniqueId,
            Answer: item['LevelAction.Answer'] || item['BonusAction.Answer'],
        }))
        .reverse();

    let data = [...updatesQueueCastedToActions, ...actions];

    if (actualCode) {
        data = data
            .filter(item => Helper.isCodeStartsWith(item.Answer, actualCode))
            .map(item => ({ ...item, Answer: `🔎 ${item.Answer}` }));
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    item.$uniqueId ? (
                        <UpdatesQueueItem answer={item.Answer} />
                    ) : (
                        <MonitoringItem
                            login={item.Login}
                            isLocalUserCode={item.UserId === localUserId}
                            kind={item.Kind}
                            answer={item.Answer}
                            enterLocalTime={typeof item.LocDateTime === 'string' ? item.LocDateTime.split(' ')[1] : null}
                            isCorrect={item.IsCorrect}
                        />
                    )
                )
                }
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    );
};


const styles = {
    mainContainer: {
        backgroundColor: Colors.background,
        marginVertical: 1,
    },
};

export default inject(mapStateToProps)(observer(MonitoringSection));
