import React, { Component } from 'react';
import { View, TextInput, Alert, Text, Animated, Easing, KeyboardAvoidingView, BackHandler, TouchableNativeFeedback } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import { Icon, Spinner } from 'native-base';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import Helper from '../util/helper';

import Colors from '../constants/colors';
import CountableText from '../core/components/CountableText';

import MonitoringSection from './MonitoringSection';

const mapStateToProps = stores => ({
    actualCode: stores.gameStore.actualCode,
    actualBonusCode: stores.gameStore.actualBonusCode,
    changeActualCode: stores.gameStore.changeActualCode,
    changeActualBonusCode: stores.gameStore.changeActualBonusCode,
    sendCode: stores.gameStore.sendCode,
    sendBonusCode: stores.gameStore.sendBonusCode,
    oldCodes: stores.gameStore.gameModel.Level.MixedActions,
    sectors: stores.gameStore.gameModel.Level.Sectors,
    bonuses: stores.gameStore.gameModel.Level.Bonuses,
    hasAnswerBlockRule: stores.gameStore.gameModel.Level.HasAnswerBlockRule,
    blockDuration: stores.gameStore.gameModel.Level.BlockDuration,
    blockTargetId: stores.gameStore.gameModel.Level.BlockTargetId,
    attemtsNumber: stores.gameStore.gameModel.Level.AttemtsNumber,
    attemtsPeriod: stores.gameStore.gameModel.Level.AttemtsPeriod,
    updatesQueue: stores.gameStore.updatesQueue,
    setIndexForSectorsList: stores.gameStore.setIndexForSectorsList,
    setIndexForBonusesList: stores.gameStore.setIndexForBonusesList,
});

const blockDurationContainerShake = new Animated.Value(0);
const blockDurationContainerShakeOffset = 15;
const interpolateBlockDurationOffset = blockDurationContainerShake.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    outputRange: [
        0,
        -blockDurationContainerShakeOffset,
        blockDurationContainerShakeOffset,
        -blockDurationContainerShakeOffset,
        blockDurationContainerShakeOffset,
        -blockDurationContainerShakeOffset,
        blockDurationContainerShakeOffset,
        -blockDurationContainerShakeOffset,
        blockDurationContainerShakeOffset,
        -blockDurationContainerShakeOffset,
        0,
    ],
});

const monitoringSectionMaxHeight = new Animated.Value(0);

class CodeSection extends Component {
    state = {
        isMonitoringOpen: false,
        codeInputSelection: null,
    };

    onChangeCode = (code) => {
        const { changeActualCode, oldCodes } = this.props;


        const foundedCode = oldCodes.find(item => Helper.isCodeStartsWith(item.Answer, code));

        if (code.length >= 3 && foundedCode && !Helper.isEqualCode(code, foundedCode.Answer)) {
            this.showMonitoringSection(code, foundedCode.Answer);
        } else {
            this.hideMonitoringSection();
        }

        changeActualCode(code);
    }

    scrollSectorsToCode = (oldCode) => {
        const { sectors, setIndexForSectorsList } = this.props;
        const foundedSector = sectors.find((sector) => {
            if (sector.Answer && sector.Answer.Answer) {
                return Helper.isEqualCode(sector.Answer.Answer, oldCode.Answer);
            }

            return false;
        });

        if (foundedSector) {
            setIndexForSectorsList({ index: foundedSector.Order - 1 });
        }
    }

    scrollBonusesToCode = (oldBonusCode) => {
        const { bonuses, setIndexForBonusesList } = this.props;
        const foundedBonus = bonuses.find((bonus) => {
            if (bonus.Answer && bonus.Answer.Answer) {
                return Helper.isEqualCode(bonus.Answer.Answer, oldBonusCode.Answer);
            }

            return false;
        });

        if (foundedBonus) {
            setIndexForBonusesList({ index: foundedBonus.Number - 1 });
        }
    }

    sendCode = () => {
        const {
            actualCode,
            actualBonusCode,
            oldCodes,
            sendCode,
            hasAnswerBlockRule,
            blockDuration,
        } = this.props;

        const oldCode = oldCodes
            .filter(code => (hasAnswerBlockRule ? code.Kind === 1 : true))
            .find(codeObject => Helper.isEqualCode(codeObject.Answer, actualCode));

        if (hasAnswerBlockRule && blockDuration > 0) {
            blockDurationContainerShake.setValue(0);

            Animated.timing(
                blockDurationContainerShake,
                {
                    toValue: 10,
                    duration: 1000,
                    ease: Easing.bounce,
                },
            ).start();
        } else if (hasAnswerBlockRule && oldCode && !oldCode.IsCorrect) {
            Alert.alert(
                'На уровне ограничение на перебор!',
                'Разрешить ввод старого неверного кода?',
                [
                    { text: 'Отмена', onPress: () => {}, style: 'cancel' },
                    { text: 'Разрешить', onPress: () => sendCode() },
                ],
            );
        } else {
            sendCode();
        }
    };
    // DEPRECATED!!!!
    toggleMonitoringSection = () => {
        if (this.codeInput) {
            this.codeInput.blur();
        }

        if (this.bonusInput) {
            this.bonusInput.blur();
        }

        if (this.state.isMonitoringOpen === false) {
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        } else {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        }

        this.setState(prevState => ({
            isMonitoringOpen: !prevState.isMonitoringOpen,
        }));
    };

    showMonitoringSection = (code, foundedCode) => {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

        this.setState({
            isMonitoringOpen: true,
        });

        if (code && foundedCode) {
            // this.setState({ codeInputSelection: { start: code.length, end: foundedCode.length } });
        }

        Animated.timing(
            monitoringSectionMaxHeight,
            {
                toValue: 200,
                duration: 200,
            },
        ).start();

        return true;
    }

    hideMonitoringSection = () => {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);

        this.setState({
            isMonitoringOpen: false,
            codeInputSelection: null,
        });

        Animated.timing(
            monitoringSectionMaxHeight,
            {
                toValue: 0,
                duration: 200,
            },
        ).start();

        return true;
    };


    handleBackButton = () => {
        this.hideMonitoringSection();
        return true;
    };

    render() {
        const {
            actualCode,
            actualBonusCode,
            changeActualCode,
            changeActualBonusCode,
            sendCode,
            sendBonusCode,
            oldCodes,
            bonuses,
            hasAnswerBlockRule,
            blockDuration,
            blockTargetId,
            attemtsNumber,
            attemtsPeriod,
            updatesQueue,
        } = this.props;

        const {
            isMonitoringOpen,
            codeInputSelection,
        } = this.state;

        const pendingCodes = updatesQueue.filter(({ LevelId }) => LevelId);

        const oldCode = oldCodes
            .filter(code => (hasAnswerBlockRule ? code.Kind === 1 : true))
            .find(codeObject => Helper.isEqualCode(codeObject.Answer, actualCode));

        const oldBonusCode = oldCodes
            .filter(code => code.Kind === 2)
            .find(codeObject => Helper.isEqualCode(codeObject.Answer, actualBonusCode));

        // const foundedCode = actions.find(item => Helper.isCodeStartsWith(item.Answer, actualCode));
        // const computedValue = (codeInputSelection && foundedCode)
        //     ? `${actualCode}${foundedCode.Answer.substr(codeInputSelection.start - codeInputSelection.end)}`
        //     : actualCode;

        const computedValue = actualCode;

        let highlightColor;
        let highlightBonusColor;
        // let iconName;
        // let bonusIconName;


        if (oldCode) {
            if (oldCode.IsCorrect) {
                highlightColor = (oldCode.Kind === 2 && !hasAnswerBlockRule) ? Colors.bonus : Colors.rightCode;
                // iconName = 'checkmark-circle';
            } else {
                highlightColor = Colors.wrongCode;
                // iconName = 'close-circle';
            }
        } else if (hasAnswerBlockRule && blockDuration > 0) {
            highlightColor = Colors.gray;
        } else if (hasAnswerBlockRule) {
            highlightColor = Colors.upTime;
        } else {
            highlightColor = Colors.white;
        }

        if (oldBonusCode) {
            if (oldBonusCode.IsCorrect) {
                highlightBonusColor = Colors.rightCode;
                // bonusIconName = 'checkmark-circle';
            } else {
                highlightBonusColor = Colors.wrongCode;
                // bonusIconName = 'close-circle';
            }
        } else {
            highlightBonusColor = Colors.bonus;
        }


        return (
            <View style={styles.mainContainer}>
                {
                    oldCodes.length ? (
                        <Animated.View style={{ maxHeight: monitoringSectionMaxHeight }}>
                            <MonitoringSection />
                        </Animated.View>
                    ) : null
                }
                {
                    hasAnswerBlockRule &&
                    <View
                        style={styles.blockRuleContainer}
                    >
                        <Text
                            style={styles.blockRuleText}
                        >
                            {`Не более ${attemtsNumber} попыток за ${Helper.formatCount(attemtsPeriod, { withUnits: true, collapse: true })} для`}
                        </Text>
                        <Icon
                            name={blockTargetId === 2 ? 'people' : 'person'}
                            style={{ color: Colors.upTime, fontSize: 19, marginHorizontal: 5 }}
                        />
                    </View>
                }
                {
                    (hasAnswerBlockRule && blockDuration > 0) &&
                    <Animated.View
                        style={[
                            styles.blockDurationContainer,
                            {
                                transform: [
                                    { translateX: interpolateBlockDurationOffset },
                                ],
                            },
                        ]}
                    >
                        <Text
                            style={{ color: Colors.gray }}
                        >
                            {'осталось '}
                        </Text>
                        <CountableText
                            start={blockDuration}
                            textStyle={{ color: Colors.gray }}
                        />
                    </Animated.View>
                }
                <KeyboardAvoidingView behavior={'padding'}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { oldCodes.length ?

                            <TouchableNativeFeedback onPress={isMonitoringOpen ? this.hideMonitoringSection : this.showMonitoringSection}>
                                <View>
                                    <Icon
                                        type="MaterialIcons"
                                        style={Object.assign({}, styles.monitoringIcon, { color: isMonitoringOpen ? Colors.tabBackground : Colors.white })}
                                        name={actualCode ? 'youtube-searched-for' : 'history'}
                                    />
                                    {pendingCodes.length > 0 ? (
                                        <View style={styles.badgeWrapper}>
                                            <Text style={{ color: Colors.white, fontSize: 11 }}>
                                                {pendingCodes.length}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableNativeFeedback>
                            : null
                        }
                        <View style={[styles.inputWrapper, { borderColor: highlightColor, flex: 1 }]}>
                            { hasAnswerBlockRule && <Icon style={Object.assign({}, styles.inputIcon, { color: Colors.upTime })} name="warning" /> }
                            <TextInput
                                blurOnSubmit
                                selectTextOnFocus
                                ref={(input) => { this.codeInput = input; }}
                                autoCorrect={!hasAnswerBlockRule}
                                autoCapitalize="none"
                                underlineColorAndroid="transparent"
                                returnKeyType="send"
                                placeholder={'Код'}
                                selectionColor={Colors.white}
                                placeholderTextColor={Colors.gray}
                                onChangeText={this.onChangeCode}
                                onSubmitEditing={this.sendCode}
                                onFocus={this.hideMonitoringSection}
                                onBlur={this.hideMonitoringSection}
                                value={computedValue}
                                selection={codeInputSelection}
                                keyboardAppearance={'dark'}
                                style={[styles.codeInput, { color: highlightColor }]}
                            />
                            {
                                oldCode && oldCode.IsCorrect && oldCode.Kind === 1 &&
                                <Icon
                                    style={Object.assign({}, styles.inputIcon, { color: Colors.white })}
                                    name="open"
                                    onPress={() => this.scrollSectorsToCode(oldCode)}
                                />
                            }
                            {
                                actualCode.length > 0 &&
                                <Icon
                                    style={Object.assign({}, styles.inputIcon, { color: Colors.white })}
                                    name="close"
                                    onPress={() => this.onChangeCode('')}
                                />
                            }
                        </View>
                    </View>
                    {
                        (hasAnswerBlockRule && bonuses.find(bonus => !bonus.IsAnswered)) &&
                        <View style={[styles.inputWrapper, { borderColor: highlightBonusColor, marginTop: 10, marginBottom: 5 }]}>
                            <TextInput
                                blurOnSubmit
                                selectTextOnFocus
                                autoCorrect
                                autoCapitalize="none"
                                ref={(input) => { this.bonusInput = input; }}
                                underlineColorAndroid="transparent"
                                returnKeyType="send"
                                placeholder="Бонус"
                                selectionColor={Colors.white}
                                placeholderTextColor={Colors.gray}
                                onChangeText={code => changeActualBonusCode(code)}
                                onSubmitEditing={sendBonusCode}
                                onFocus={this.hideMonitoringSection}
                                value={actualBonusCode}
                                keyboardAppearance={'dark'}
                                style={[styles.codeInput, { color: highlightBonusColor }]}
                            />
                            {/* TODO: false - because we dont know getItemLayout() for Bonus component */}
                            {
                                false && oldBonusCode && oldBonusCode.IsCorrect &&
                                <Icon
                                    style={Object.assign({}, styles.inputIcon, { color: Colors.white })}
                                    name="open"
                                    onPress={() => this.scrollBonusesToCode(oldBonusCode)}
                                />
                            }
                            {
                                actualBonusCode.length > 0 &&
                                <Icon
                                    style={Object.assign({}, styles.inputIcon, { color: Colors.white })}
                                    name="close"
                                    onPress={() => changeActualBonusCode('')}
                                />
                            }
                        </View>
                    }
                </KeyboardAvoidingView>
            </View>
        );
    }
}

const styles = {
    mainContainer: {
        backgroundColor: Colors.background,
        paddingVertical: 3,
        paddingHorizontal: 10,
    },

    inputWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        borderWidth: 1,
        borderRadius: 7,
    },

    codeInput: {
        flex: 1,
        color: Colors.rightCode,
        fontSize: 20,
        padding: 0,
    },

    blockRuleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },

    blockRuleText: {
        fontFamily: 'Verdana',
        color: Colors.upTime,
    },

    blockDurationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    inputIcon: {
        fontSize: 25,
        width: 25,
        marginHorizontal: 5,
    },

    monitoringIcon: {
        fontSize: 32,
        // width: 27,
        marginRight: 5,
    },

    badgeWrapper: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        top: 0,
        right: 2,
        backgroundColor: Colors.upTime,
        justifyContent: 'center',
        alignItems: 'center',
    },
};

export default inject(mapStateToProps)(observer(CodeSection));
