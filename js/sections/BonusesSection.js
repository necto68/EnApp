import React, { Component } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react/native';
import { FlatList, View, Text } from 'react-native';
import Colors from '../constants/colors';
import Helper from '../util/helper';
import Bonus from '../gameComponents/Bonus';

const mapStateToProps = stores => ({
    gameStore: stores.gameStore,
    bonuses: stores.gameStore.gameModel.Level.Bonuses,
});

class BonusesSection extends Component {
    componentDidMount() {
        const { gameStore } = this.props;
        this.scrollReaction = reaction(
            () => gameStore.indexForBonusesList,
            ({ index }) => {
                this.bonusesListRef.scrollToIndex({
                    index,
                    viewOffset: 0,
                    viewPosition: 0.5,
                });
            },
        );
    }

    componentWillUnmount() {
        this.scrollReaction();
    }

    scrollReaction = null;

    bonusesListRef = null;

    render() {
        const { bonuses, gameStore: { isRefreshing, updateGameModel } } = this.props;
        const allBonuses = bonuses.filter(bonus => bonus.IsAnswered).reduce((acc, curr) => acc + curr.AwardTime, 0);

        return (<View style={styles.mainContainer}>
            {allBonuses > 0 &&
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>
                    {'Суммарный бонус на уровне'}
                </Text>
                <Text style={[styles.summaryTitle, { color: Colors.bonus }]}>
                    {
                        Helper.formatCount(
                            allBonuses,
                            { withUnits: true, collapse: true },
                        )
                    }
                </Text>
            </View>
            }
            <FlatList
                data={bonuses}
                renderItem={({ item }) => (
                    <Bonus
                        number={item.Number}
                        name={item.Name}
                        task={item.Task}
                        isAnswered={item.IsAnswered}
                        answerData={item.Answer}
                        hint={item.Help}
                        awardTime={item.AwardTime}
                        expired={item.Expired}
                        secondsToStart={item.SecondsToStart}
                        secondsLeft={item.SecondsLeft}
                    />)
                }
                ref={(ref) => {
                    this.bonusesListRef = ref;
                }}
                initialNumToRender={20}
                keyExtractor={bonus => String(bonus.BonusId)}
                refreshing={isRefreshing}
                onRefresh={updateGameModel}
                style={styles.mainContainer}
            />
        </View>
        );
    }
}


const styles = {
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        marginHorizontal: 15,
    },

    summaryTitle: {
        color: Colors.white,
        fontSize: 16,
    },
};

export default inject(mapStateToProps)(observer(BonusesSection));
