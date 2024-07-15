import React, { Component, Fragment } from 'react';
import { observer, inject } from 'mobx-react/native';
import { View, ToastAndroid, Clipboard, Alert } from 'react-native';
import { Spinner, Button, Text, Icon, ActionSheet } from 'native-base';
import { Sae, Kohana } from 'react-native-textinput-effects';
import RNIap from 'react-native-iap';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
// import TelegramButton from '../core/components/TelegramButton';
// import GooglePlayButton from '../core/components/GooglePlayButton';
import Colors from '../../../constants/colors';
import API from '../../../util/API';
import asyncStorage from '../../../util/asyncStorage';
import loginErrorStrings from '../../../constants/loginErrorStrings';
import { GoogleSignin } from 'react-native-google-signin';
import { getOrCreateUser, isGameAllowedWithoutWithdraw, withdrawGame } from '../../../util/fireBaseAPI';
import userStore from '../../../core/stores/userStore';


const SUBSCRIPTION_PRODUCT_ID = 'android.test.purchased';

const DOMAIN_REGEXPES = [
    /quest\.ua/,
    /[\w-]+\.quest\.ua/,
    /[\w-]+\.en\.cx/,
    /[\w-]+\.encounter\.cx/,
    /[\w-]+\.encounter\.ru/,
];

const GAMEID_REGEXPES = [
    /play\/(\d+)/,
    /gid=(\d+)/,
];

const mapStateToProps = stores => ({
    setActualView: stores.gameStore.setActualView,
    purchasedGames: stores.userStore.purchasedGames,
});

class LoginInputsView extends Component {
       static checkPay = async () => {

       }

    state = {
        domainValue: '',
        idGameValue: '',
        loginValue: '',
        passwordValue: '',
        domainGames: [],
        isFetchingDomainGames: false,
        disableSignInButton: false,
    };

    async componentWillMount() {
        const storageValues = await asyncStorage.getItems([
            'domainValue',
            'idGameValue',
            'loginValue',
            'passwordValue',
        ]);

        this.setState({
            ...storageValues,
        });

        this.fetchGamesIds(storageValues.domainValue);
    }

    onInputChange = (key, value) => {
        if (['domainValue', 'idGameValue'].includes(key)) {
            value = value.toString().replace(/\s/gim, '').toLowerCase();
        }

        this.setState({
            [key]: value,
        });

        if (key === 'domainValue') {
            this.fetchGamesIds(value);
        }
    };

    onFocusDomainInput = async () => {
        const url = await Clipboard.getString() || null;

        if (!url) return null;
        let [domainValue, idGameValue] = [null, null];
        const domainRegExp = DOMAIN_REGEXPES.find(regExp => regExp.test(url));
        const gameIdRegExp = GAMEID_REGEXPES.find(regExp => regExp.test(url));

        if (domainRegExp && gameIdRegExp) {
            const matchedDomain = url.match(domainRegExp);
            const matchedGameId = url.match(gameIdRegExp);

            domainValue = matchedDomain && matchedDomain[0];
            idGameValue = matchedGameId && matchedGameId[1]; // [1] === group with gameId;
        }

        if (domainValue && idGameValue) {
            Alert.alert(
                'Обнаружена ссылка',
                `Домен - ${domainValue}\nID игры - ${idGameValue}\n\nПрименить?`,
                [
                    {
                        text: 'Нет',
                        style: 'cancel',
                    },
                    {
                        text: 'Да',
                        onPress: () => {
                            this.onInputChange('domainValue', domainValue);
                            this.onInputChange('idGameValue', idGameValue);
                        },
                    },
                ],
            );
        }
    }

    onOpenGameList = () => {
        const { domainGames, idGameValue } = this.state;
        const BUTTONS = domainGames.map((game, index) => (
            {
                text: game.title.length > 30
                    ? `${game.title.substr(0, 30)}...`
                    : game.title,
                ...(+idGameValue === +game.gameId
                    ? {
                        icon: 'checkmark',
                        iconColor: Colors.rightCode,
                    }
                    : {}
                ),
            }
        ));

        BUTTONS.push({
            text: 'Отмена',
            icon: 'close',
            iconColor: Colors.gray,
        });

        ActionSheet.show(
            {
                options: BUTTONS,
                cancelButtonIndex: BUTTONS.length - 1,
                title: 'Выбрать игру',
            },
            (buttonIndex) => {
                const newIdGameValue = domainGames[+buttonIndex] && domainGames[+buttonIndex].gameId;
                this.onInputChange('idGameValue', newIdGameValue || '');
            },
        );
    };


    fetchGamesIds = async (domainValue) => {
        if (this.isValidDomain(domainValue)) {
            this.setState({ isFetchingDomainGames: true });
            const gamesArr = await API.getDomainGames(domainValue);
            this.setState({
                domainGames: gamesArr,
                isFetchingDomainGames: false,
            });
        }
    };

        allowLogin = () => {
            const {
                domainValue,
                idGameValue,
                loginValue,
                passwordValue,
            } = this.state;

            return (
                domainValue &&
            idGameValue &&
            loginValue &&
            passwordValue &&
            this.isValidDomain(domainValue) &&
            /^\d+$/.test(idGameValue)
            );
        };

    clearAsyncStorage = () =>
        asyncStorage.setItems({
            domainValue: '',
            idGameValue: '',
        });


    enterGame = async (domain, gameId) => {
        const { setActualView, purchasedGames } = this.props;
        const isAllow = await isGameAllowedWithoutWithdraw(domain, gameId);

        const onWithdrawAlertPress = async () => {
            if (purchasedGames > 0) {
                try {
                    const result = await withdrawGame(domain, gameId);

                    if (result) {
                        setActualView('LoadingView');
                    }
                } catch (error) {
                    await this.clearAsyncStorage();
                    Alert.alert('Ошибка', `При списании 🔦 произошла ошибка.\n\n${error}`);
                }
            } else {
                await this.clearAsyncStorage();
                Alert.alert('Ошибка', 'У вас недостаточно 🔦.\nПополните и попробуйте снова.');
            }
        };

        if (isAllow) {
            setActualView('LoadingView');
        } else {
            Alert.alert(
                'Вход',
                'Вход в новую игру стоит 1 🔦\n\nПродолжить?',
                [
                    {
                        text: 'Нет',
                        style: 'cancel',
                    },
                    {
                        text: 'Да',
                        onPress: onWithdrawAlertPress,
                    },
                ],
            );
        }
    };


    isValidDomain = domainValue => DOMAIN_REGEXPES
        .map(regExp => new RegExp(`^${regExp.source}$`, 'i'))
        .some(regExp => regExp.test(domainValue));

    onSignInButtonClick = () => {
        const { domainValue } = this.state;
        this.signIn();
    }

    signIn = async () => {
        const {
            domainValue,
            idGameValue,
            loginValue,
            passwordValue,
        } = this.state;

        await asyncStorage.setItems({
            domainValue,
            idGameValue,
            loginValue,
            passwordValue,
        });


        this.setState({ disableSignInButton: true });
        const data = await API.loginUser();
        this.setState({ disableSignInButton: false });

        const { Error: errorCode, Message } = data;

        if (errorCode === 0) {
            this.enterGame(domainValue, idGameValue);
        } else if (errorCode === 'INTERNAL') {
            ToastAndroid.show(`Ошибка: ${Message}`, ToastAndroid.LONG);
        } else {
            ToastAndroid.show(`Код: ${errorCode}\nОшибка: ${loginErrorStrings[errorCode]}`, ToastAndroid.LONG);
        }
    };

        __CHECK = async () => {
            await GoogleSignin.signOut();
            await GoogleSignin.revokeAccess();


            const user = await getOrCreateUser('necto68necto68@gmail.com');
            const { purchasedGames, playedGames } = user;
            // console.warn(JSON.stringify(user, null, 2));


            const itemSkus = [
                'android.test.purchased',
                'android.test.canceled',
                'android.test.refunded',
                'android.test.item_unavailable',
                'test.sub1',
                'com.necto68.enapp.5_games',
            ];

            const itemSubs = [
                'test.sub1',
            ];

            // try {
            //     const products = await RNIap.getProducts(itemSkus);
            //     const subscriptions = await RNIap.getSubscriptions(itemSkus);

            //     console.log({ subscriptions });
            //     console.log({ products });

            //     const res = await RNIap.requestPurchase(itemSkus[0]);
            //     console.log({ res });
            // } catch (err) {
            //     console.warn(err.code, err.message);
            // }
        }

        render() {
            const {
                domainValue,
                idGameValue,
                loginValue,
                passwordValue,
                disableSignInButton,
                domainGames,
                isFetchingDomainGames,
            } = this.state;
            const { purchasedGames } = this.props;

            return (
                <Fragment>
                    <View style={styles.inputWrapper}>
                        <Kohana
                            style={[styles.input, { marginRight: 20 }]}
                            label={'Домен'}
                            value={domainValue}
                            onChangeText={value => this.onInputChange('domainValue', value)}
                            iconClass={FontAwesomeIcon}
                            iconName={'globe'}
                            iconColor={Colors.green}
                            inputStyle={styles.innerInput}
                            inputPadding={10}
                            onFocus={this.onFocusDomainInput}
                        />
                        <Kohana
                            style={styles.input}
                            label={'ID игры'}
                            value={idGameValue}
                            onChangeText={value => this.onInputChange('idGameValue', value)}
                            iconClass={FontAwesomeIcon}
                            iconName={'indent'}
                            iconColor={Colors.upTime}
                            inputStyle={styles.innerInput}
                            inputPadding={10}
                            onFocus={this.onFocusDomainInput}
                            keyboardType={'numeric'}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Kohana
                            style={[styles.input, { marginRight: 20 }]}
                            label={'Логин'}
                            value={loginValue}
                            onChangeText={value => this.onInputChange('loginValue', value)}
                            iconClass={FontAwesomeIcon}
                            iconName={'vcard'}
                            iconColor={Colors.blue}
                            inputStyle={styles.innerInput}
                            inputPadding={10}
                        />
                        <Kohana
                            style={styles.input}
                            label={'Пароль'}
                            value={passwordValue}
                            onChangeText={value => this.onInputChange('passwordValue', value)}
                            iconClass={FontAwesomeIcon}
                            iconName={'key'}
                            iconColor={Colors.yellow}
                            inputStyle={styles.innerInput}
                            inputPadding={10}
                            secureTextEntry
                        />
                    </View>

                    <Button
                        primary
                        block
                        iconRight
                        disabled={!this.allowLogin() || disableSignInButton}
                        onPress={this.onSignInButtonClick}
                        style={styles.buttonWrapper}
                    >
                        <Text>{'Вход'}</Text>
                        <Icon name="log-in" />
                    </Button>
                    {/* <Button
                        primary
                        block
                        iconRight
                        onPress={this.__CHECK}
                        style={styles.buttonWrapper}
                    >
                        <Text>{'!!! CHECK !!!'}</Text>
                    </Button> */}
                </Fragment>
            );
        }
}


// <View style={styles.intentsButtonsContainer}>
//      <TelegramButton style={{ flex: 1, marginRight: 10 }} />
//      <GooglePlayButton style={{ flex: 1, marginLeft: 10 }} />
// </View>


/*  {
                            isFetchingDomainGames
                                ? <Spinner style={{ height: 36 }} color="blue" />
                                : null
                        }
                        {
                            (isFetchingDomainGames === false && domainGames.length && this.isValidDomain(domainValue))
                                ? <Icon
                                    name="arrow-dropdown-circle"
                                    style={styles.gameListIcon}
                                    onPress={() => this.onOpenGameList()}
                                />
                                : null
                        } */

const styles = {
    input: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.gray,
    },

    innerInput: {
        color: Colors.white,
    },

    inputWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 45,
        marginTop: 20,
    },

    buttonWrapper: {
        marginTop: 20,
    },

    intentsButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },

    gameListIcon: {
        fontSize: 25,
        width: 25,
        marginLeft: 5,
        color: Colors.white,
    },
};

export default inject(mapStateToProps)(observer(LoginInputsView));
