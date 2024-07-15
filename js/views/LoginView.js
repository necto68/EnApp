import React, { Component } from 'react';
import { observer, inject } from 'mobx-react/native';
import { View, Image, Alert } from 'react-native';
import { Spinner, Text, Button, ActionSheet } from 'native-base';
import { GoogleSignin } from 'react-native-google-signin';
import firebase from 'react-native-firebase';
import RNIap from 'react-native-iap';
// import TelegramButton from '../core/components/TelegramButton';
// import GooglePlayButton from '../core/components/GooglePlayButton';
import Colors from '../constants/colors';
import { PRODUCTS } from '../constants/productIds';
import GoogleSignInView from './components/LoadingView/GoogleSingInView';
import LoginInputsView from './components/LoadingView/LoginInputsView';
import { getOrCreateUser } from '../util/fireBaseAPI';


const mapStateToProps = stores => ({
    setActualView: stores.gameStore.setActualView,
    purchasedGames: stores.userStore.purchasedGames,
});

class LoginView extends Component {
    state = {
        isSignedIn: null,
    }

    async componentWillMount() {
        firebase.notifications().removeAllDeliveredNotifications();
        firebase.notifications().cancelAllNotifications();

        const isSignedIn = await GoogleSignin.isSignedIn();

        this.setState({ isSignedIn });
    }

    onSignIn = () => {
        this.setState({ isSignedIn: true });
    }

    buyGamesClick = async () => {
        // !TODO fix before release
        //  const productIDs = [
        //     'android.test.purchased',
        //     'android.test.purchased',
        //     'android.test.purchased',
        //     'android.test.purchased',
        // ];
        const productIDs = Object.keys(PRODUCTS);

        const Buttons = [
            { text: 'Купить 5 🔦', icon: 'add', iconColor: Colors.green },
            { text: 'Купить 10 🔦', icon: 'add', iconColor: Colors.rightCode },
            { text: 'Купить 20 🔦', icon: 'add', iconColor: Colors.bonus },
            { text: 'Купить 50 🔦', icon: 'add', iconColor: Colors.wrongCode },
            { text: 'Отмена', icon: 'close', iconColor: Colors.gray },
        ];

        const onSelect = async (index) => {
            try {
                if (index <= 3) {
                    const selectedProductID = productIDs[index];
                    await RNIap.getProducts(productIDs);
                    RNIap.requestPurchase(selectedProductID, false);
                }
            } catch (error) {
                Alert.alert('Ошибка', JSON.stringify(error));
            }
        };

        ActionSheet.show(
            {
                options: Buttons,
                cancelButtonIndex: Buttons.length - 1,
                title: 'Пополнить 🔦',
            },
            buttonIndex => onSelect(+buttonIndex),
        );
    }

    render() {
        const { isSignedIn } = this.state;
        const { purchasedGames } = this.props;

        return (
            <View style={styles.mainContainer}>
                <View style={styles.wrapper}>
                    <View style={styles.imgContainer}>
                        <Image
                            style={styles.imgLogo}
                            source={require('../images/appIcon.png')}
                        />
                    </View>
                    {isSignedIn === null && <Spinner color={Colors.blue} />}
                    {isSignedIn === false && <GoogleSignInView onSignIn={this.onSignIn} />}
                    {isSignedIn === true && <LoginInputsView />}
                </View>
                {isSignedIn === true && (
                    <View style={styles.replenishmentContainer}>
                        <Text style={styles.balanceText}>{`Ваш баланс: ${purchasedGames} 🔦`}</Text>
                        <Button
                            block
                            success
                            iconRight
                            onPress={this.buyGamesClick}
                            onLongPress={() => getOrCreateUser()}
                            style={styles.buttonWrapper}
                        >
                            <Text>{'Пополнить 🔦'}</Text>
                        </Button>
                    </View>
                )}

            </View>
        );
    }
}

const styles = {
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    imgContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    imgLogo: {
        width: 75,
        height: 75,
    },

    wrapper: {
        flex: 1,
        justifyContent: 'center',
    },

    buttonWrapper: {
        marginTop: 10,
    },

    balanceText: {
        color: Colors.white,
        fontSize: 18,
        textAlign: 'center',
    },

    replenishmentContainer: {
        marginBottom: 20,
    },
};

export default inject(mapStateToProps)(observer(LoginView));
