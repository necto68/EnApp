import React, { Component } from 'react';
import { observer, inject } from 'mobx-react/native';
import { Text, View, Alert } from 'react-native';
import { Button, Text as NativeBaseText } from 'native-base';

import Colors from '../constants/colors';

import Helper from '../util/helper';

import CountableText from '../core/components/CountableText';
import HTMLView from '../core/components/HTMLView';

const mapStateToProps = stores => ({
    getPenaltyHint: stores.gameStore.getPenaltyHint,
});

class PenaltyHint extends Component {
    onPenaltyHintPress = () => {
        const {
            hintId,
            penalty,
            penaltyComment,
            getPenaltyHint,
        } = this.props;
        const penaltyTimeString = Helper.formatCount(penalty, { collapse: true, withUnits: true });

        Alert.alert(
            `Вы получите ${penaltyTimeString} штрафа!`,
            `Описание подсказки:\n${penaltyComment}\n\nПродолжить?`,
            [
                {
                    text: 'Нет',
                    style: 'cancel',
                },
                { text: 'Да', onPress: () => getPenaltyHint(hintId) },
            ],
        );
    }

    render() {
        const {
            number,
            hintText,
            remainSeconds,
            penalty,
            penaltyHintState,
            penaltyComment,
        } = this.props;

        let labelColor = null;
        const isHintOpened = penaltyHintState === 1;
        const penaltyTimeString = Helper.formatCount(penalty, { collapse: true, withUnits: true });

        if (isHintOpened) {
            labelColor = Colors.green;
        } else if (remainSeconds === 0) {
            labelColor = Colors.wrongCode;
        } else {
            labelColor = Colors.gray;
        }
        return (

            <View style={styles.mainContainer}>
                <View
                    style={[
                        styles.coloredLabel,
                        { backgroundColor: labelColor },
                    ]}
                />
                <View style={styles.messageContainer}>
                    <Text
                        style={[
                            styles.authorLogin,
                            { color: remainSeconds === 0 ? Colors.yellow : Colors.white },
                        ]}
                    >
                        {`Штрафная подсказка ${number}`}
                    </Text>
                    {remainSeconds !== 0 && <CountableText start={remainSeconds} textStyle={{ color: Colors.gray }} />}
                    <Text
                        style={[
                            styles.authorLogin,
                            { color: isHintOpened ? Colors.wrongCode : Colors.upTime },
                        ]}
                    >
                        {isHintOpened ? `Штраф получен - ${penaltyTimeString}` : `Штраф - ${penaltyTimeString}`}
                    </Text>
                    <Text style={styles.penaltyHintTitle}>{isHintOpened ? 'Подсказка:' : 'Описание:'}</Text>
                    <HTMLView html={isHintOpened ? hintText : penaltyComment} />
                    {(!isHintOpened && remainSeconds === 0) && (
                        <Button
                            full
                            danger
                            onPress={this.onPenaltyHintPress}
                        >
                            <NativeBaseText>{`Взять подсказку за ${penaltyTimeString} штрафа`}</NativeBaseText>
                        </Button>
                    )}
                </View>
            </View>

        );
    }
}

const styles = {
    mainContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
    },

    coloredLabel: {
        width: 5,
    },

    messageContainer: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderColor: Colors.gray,
        borderBottomWidth: 0.5,
        borderTopWidth: 0.5,
    },

    authorLogin: {
        fontFamily: 'Verdana',
        fontSize: 15,
    },

    penaltyHintTitle: {
        color: Colors.white,
        fontFamily: 'Verdana',
        fontSize: 13,
    },
};

export default inject(mapStateToProps)(observer(PenaltyHint));
