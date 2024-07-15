import firebase from 'react-native-firebase';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import RNIap, {
    InAppPurchase,
    PurchaseError,
    SubscriptionPurchase,
    acknowledgePurchaseAndroid,
    consumePurchaseAndroid,
    finishTransaction,
    finishTransactionIOS,
    purchaseErrorListener,
    purchaseUpdatedListener,
} from 'react-native-iap';
import { GoogleSignin } from 'react-native-google-signin';
import gameStore from '../../core/stores/gameStore';
import Colors from '../../constants/colors';
import { UP_CHANNEL, HINT_CHANNEL, LEVEL_STATE_CHANNEL } from '../../constants/channelIds';
import { AUTH_WEB_CLIENT_ID } from '../../constants/keys';
import { PRODUCTS } from '../../constants/productIds';
import { replenishGames } from '../../util/fireBaseAPI';


let purchaseUpdateHandler = null;
let purchaseErrorHandler = null;

export const initNotifications = () => {
    const levelStateChannel = new firebase.notifications.Android.Channel(
        LEVEL_STATE_CHANNEL,
        'Общая информация',
        firebase.notifications.Android.Importance.Low,
    )
        .enableLights(false)
        .enableVibration(false)
        .setLightColor('#008200')
        .setLockScreenVisibility(firebase.notifications.Android.Visibility.Public)
        .setShowBadge(false)
        .setDescription('Канал для общей информации про уровень (сектора, время до подсказок/автоперехода)');

    const upChannel = new firebase.notifications.Android.Channel(
        UP_CHANNEL,
        'АПы',
        firebase.notifications.Android.Importance.High,
    )
        .enableLights(true)
        .enableVibration(true)
        .setVibrationPattern([2000])
        .setLightColor(Colors.upTime)
        .setLockScreenVisibility(firebase.notifications.Android.Visibility.Public)
        .setShowBadge(true)
        .setSound('default')
        .setDescription('Используется для предупреждения про АП');

    const hintChannel = new firebase.notifications.Android.Channel(
        HINT_CHANNEL,
        'Подсказки',
        firebase.notifications.Android.Importance.High,
    )
        .enableLights(true)
        .enableVibration(true)
        .setVibrationPattern([1500])
        .setLightColor(Colors.yellow)
        .setLockScreenVisibility(firebase.notifications.Android.Visibility.Public)
        .setShowBadge(true)
        .setSound('default')
        .setDescription('Используется для предупреждения про подсказки');

        // Create the android notification channel
    firebase.notifications().android.createChannel(levelStateChannel);
    firebase.notifications().android.createChannel(upChannel);
    firebase.notifications().android.createChannel(hintChannel);


    firebase.notifications().onNotificationOpened((notificationOpen) => {
        const code = notificationOpen.results && notificationOpen.results.inputCode;

        if (code) {
            gameStore.changeActualCode(code);
            gameStore.sendCode(code);
        }
    });

    firebase
        .notifications()
        .onNotification((notification) => {
            firebase.notifications().displayNotification(notification);
        });
};


export const initBilling = async () => {
    try {
        await RNIap.initConnection();

        if (!purchaseUpdateHandler) {
            purchaseUpdateHandler = purchaseUpdatedListener(async (purchase) => {
                try {
                    const { transactionReceipt, productId } = purchase;
                    // !TODO delete before release;
                    // const gamesAmount = 10;
                    const gamesAmount = PRODUCTS[productId];


                    if (transactionReceipt && gamesAmount) {
                        await replenishGames(gamesAmount);
                        RNIap.consumePurchaseAndroid(purchase.purchaseToken);
                    } else {
                        throw new Error('Unknown productId or transactionReceipt === null');
                    }
                } catch (error) {
                    Alert.alert('Ошибка', JSON.stringify(error));
                }
            });
        }

        if (!purchaseErrorHandler) {
            purchaseErrorHandler = purchaseErrorListener((error) => {
                Alert.alert('Ошибка', JSON.stringify(error));
            });
        }
    } catch (error) {
        if (error.code !== 'E_USER_CANCELLED') {
            Sentry.captureException(error);
            Alert.alert('Ошибка', JSON.stringify(error));
        }
    }
};

export const initGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: AUTH_WEB_CLIENT_ID,
    });
};

export default { initNotifications, initBilling };
