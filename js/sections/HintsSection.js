import React from 'react';
import { observer, inject } from 'mobx-react/native';
import { FlatList } from 'react-native';
import Colors from '../constants/colors';
import Hint from '../gameComponents/Hint';
import PenaltyHint from '../gameComponents/PenaltyHint';

const mapStateToProps = stores => ({
    gameStore: stores.gameStore,
    hints: stores.gameStore.gameModel.Level.Helps,
    penaltyHints: stores.gameStore.gameModel.Level.PenaltyHelps,
});

const HintsSection = ({ hints, penaltyHints, gameStore: { isRefreshing, updateGameModel } }) => {
    const allHints = hints.concat(penaltyHints);

    return (<FlatList
        data={allHints}
        renderItem={({ item }) => (
            item.IsPenalty ? (
                <PenaltyHint
                    hintId={item.HelpId}
                    number={item.Number}
                    hintText={item.HelpText}
                    remainSeconds={item.RemainSeconds}
                    penalty={item.Penalty}
                    penaltyHintState={item.PenaltyHelpState}
                    penaltyComment={item.PenaltyComment}
                />
            ) : (
                <Hint
                    number={item.Number}
                    hintText={item.HelpText}
                    remainSeconds={item.RemainSeconds}
                />
            )
        )
        }
        keyExtractor={hint => String(hint.HelpId)}
        refreshing={isRefreshing}
        onRefresh={updateGameModel}
        style={styles.mainContainer}
    />
    );
};

const styles = {
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
};

export default inject(mapStateToProps)(observer(HintsSection));
