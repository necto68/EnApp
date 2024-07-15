import React, { Component } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react/native';
import { FlatList, View, Text } from 'react-native';
import { Switch } from 'native-base';
import Colors from '../constants/colors';
import Sector from '../gameComponents/Sector';

const SECTOR_HEIGHT = 50;

const mapStateToProps = stores => ({
    gameStore: stores.gameStore,
    sectors: stores.gameStore.gameModel.Level.Sectors,
    requiredSectorsCount: stores.gameStore.gameModel.Level.RequiredSectorsCount,
});

class SectorsSection extends Component {
    state = {
        hideIsAnswered: false,
    };

    componentDidMount() {
        const { gameStore } = this.props;
        this.scrollReaction = reaction(
            () => gameStore.indexForSectorsList,
            ({ index }) => {
                this.sectorsListRef.scrollToIndex({
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

    onChangeHideSwitch = (newValue) => {
        this.setState({
            hideIsAnswered: newValue,
        });
    };

    scrollReaction = null;

    sectorsListRef = null;

    render() {
        const { sectors, requiredSectorsCount, gameStore: { isRefreshing, updateGameModel } } = this.props;

        let computedSectors = sectors;

        if (this.state.hideIsAnswered) {
            computedSectors = computedSectors.filter(sector => !sector.IsAnswered);
        }

        return (
            <View style={styles.mainContainer}>
                {requiredSectorsCount !== sectors.length && (
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchTitle}>{'Нужно выполнить'}</Text>
                        <Text style={styles.remainTitle}>{`${requiredSectorsCount}/${sectors.length} (${requiredSectorsCount - sectors.length})`}</Text>
                    </View>
                )}
                <View style={{ ...styles.switchContainer, marginBottom: 10 }}>
                    <Text style={styles.switchTitle}>{'Скрыть выполненные'}</Text>
                    <Switch
                        value={this.state.hideIsAnswered}
                        onValueChange={this.onChangeHideSwitch}
                        trackColor={Colors.gray}
                    />
                </View>
                <FlatList
                    data={computedSectors}
                    renderItem={({ item }) => (
                        <Sector
                            order={item.Order}
                            name={item.Name}
                            answerData={item.Answer}
                            isAnswered={item.IsAnswered}
                        />)
                    }
                    ref={(ref) => {
                        this.sectorsListRef = ref;
                    }}
                    getItemLayout={(data, index) => (
                        { length: SECTOR_HEIGHT, offset: SECTOR_HEIGHT * index, index }
                    )}
                    keyExtractor={sector => String(sector.SectorId)}
                    refreshing={isRefreshing}
                    onRefresh={updateGameModel}
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

    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 15,
    },

    switchTitle: {
        color: Colors.white,
        fontSize: 16,
    },

    remainTitle: {
        color: Colors.upTime,
        fontSize: 16,
        marginHorizontal: 7,
    },
};

export default inject(mapStateToProps)(observer(SectorsSection));
