import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import { Container, Content, Spinner, Button, Icon, Text as TextNB } from 'native-base';
import firebase from 'react-native-firebase';
import asyncStorage from '../util/asyncStorage';
import StatButton from '../core/components/StatButton';
import CountableText from '../core/components/CountableText';
import LoadingErrorStrings from '../constants/loadingErrorStrings';
import Colors from '../constants/colors';
import API from '../util/API';

const mapStateToProps = stores => ({
    gameModel: stores.gameStore.gameModel,
    updateGameModel: stores.gameStore.updateGameModel,
    setActualView: stores.gameStore.setActualView,
    isRefreshing: stores.gameStore.isRefreshing,
    signOut: stores.gameStore.signOut,
});

class LoadingView extends Component {
    state = {
        timeoutToGame: null,
    };

    async componentDidMount() {
        firebase.notifications().removeAllDeliveredNotifications();
        firebase.notifications().cancelAllNotifications();

        const { gameModel, setActualView } = this.props;
        const { domainValue, idGameValue } = await asyncStorage.getItems(['domainValue', 'idGameValue']);

        if (domainValue && idGameValue) {
            this.updateGameModel();
        } else {
            setActualView('LoginView');
        }
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.gameModel !== this.props.gameModel) {
            await this.fetchTimeoutToGame();
        }
    }

    updateGameModel = async () => {
        const { updateGameModel } = this.props;

        await updateGameModel();
    };

    fetchTimeoutToGame = async () => {
        const { gameModel: { Event } } = this.props;

        this.setState({ timeoutToGame: null });

        if (Event === 5) {
            const timeoutToGame = await API.getTimeoutToGame();
            this.setState({ timeoutToGame });
        }
    };

    logOut = async () => {
        this.props.signOut();
    };

    getErrorTitle = () => {
        const { gameModel } = this.props;

        if (Object.prototype.hasOwnProperty.call(gameModel, 'Level')) {
            if (gameModel.Event === 5) {
                return 'Игра начнется через';
            }

            return LoadingErrorStrings[gameModel.Event];
        }

        return LoadingErrorStrings.LOADING;
    };

    renderTimeoutToGame = () => {
        const { gameModel: { Event } } = this.props;
        const { timeoutToGame } = this.state;

        if (Event === 5) {
            if (timeoutToGame === null) {
                return <Text style={styles.errorTitle}>...</Text>;
            }

            return (
                <CountableText
                    start={timeoutToGame}
                    textStyle={styles.errorTitle}
                    formatCountOptions={{ collapse: true, withUnits: true, showZeroSeconds: true }}
                />
            );
        }

        return null;
    };

    render() {
        const { gameModel, isRefreshing } = this.props;

        return (
            <Container >
                <Content contentContainerStyle={styles.mainContainer}>
                    <Text style={styles.errorTitle}>
                        {
                            this.getErrorTitle()
                        }
                    </Text>
                    {
                        this.renderTimeoutToGame()
                    }
                    <View style={styles.spinnerContainer}>
                        { isRefreshing && <Spinner color={Colors.blue} /> }
                    </View>
                    <Button
                        primary
                        block
                        iconRight
                        disabled={isRefreshing}
                        style={styles.loadingButton}
                        onPress={this.updateGameModel}
                    >
                        <TextNB>{'Обновить'}</TextNB>
                        <Icon name="refresh" />
                    </Button>
                    <Button
                        danger
                        block
                        iconRight
                        style={styles.loadingButton}
                        onPress={this.logOut}
                    >
                        <TextNB>{'Выход'}</TextNB>
                        <Icon name="log-out" />
                    </Button>
                    {
                        [6, 17].includes(gameModel.Event)
                            ? (
                                <View style={styles.intentsButtonsContainer}>
                                    {/* <TelegramButton style={styles.loadingButton} />
                                    <GooglePlayButton style={styles.loadingButton} /> */}
                                    <StatButton style={styles.loadingButton} />
                                </View>
                            )
                            : null
                    }
                </Content>
            </Container>
        );
    }
}

const styles = {
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    errorTitle: {
        color: Colors.white,
        fontSize: 21,
        textAlign: 'center',
    },

    spinnerContainer: {
        height: 70,
    },

    loadingButton: {
        marginTop: 20,
    },

    intentsButtonsContainer: {
        alignSelf: 'stretch',
        marginTop: 20,
    },
};

export default inject(mapStateToProps)(observer(LoadingView));
