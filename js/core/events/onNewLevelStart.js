import firebase from 'react-native-firebase';
import * as Sentry from '@sentry/react-native';
import gameStore from '../stores/gameStore';
import { UP_EMOJI, HINT_EMOJI } from '../../constants/emojis';
import Colors from '../../constants/colors';
import { HINT_CHANNEL, UP_CHANNEL } from '../../constants/channelIds';

export default () => {
    const { gameModel } = gameStore;
    const { Level } = gameModel;

    firebase.notifications().removeAllDeliveredNotifications();
    firebase.notifications().cancelAllNotifications();

    gameStore.setCurrentTabsPage(0);
    gameStore.changeActualCode('');
    gameStore.changeActualBonusCode('');

    Level.Helps.filter(help => help.RemainSeconds >= 1).forEach((help, index) => {
        const notification = new firebase.notifications.Notification()
            .setTitle(`Уровень ${Level.Number}. Подсказка!`)
            .setBody(`${HINT_EMOJI} Подсказка №${help.Number} доступна!`)
            .android.setPriority(firebase.notifications.Android.Priority.Default)
            .android.setChannelId(HINT_CHANNEL)
            .android.setGroup(HINT_CHANNEL)
            // .android.setGroupSummary(index === 0)
            .android.setSmallIcon('ic_notification')
            .android.setColor(Colors.yellow);

        firebase.notifications().scheduleNotification(notification, {
            fireDate: new Date(Date.now() + (help.RemainSeconds * 1000)).getTime(),
        });
    });

    if (Level.Timeout > 0 && Level.TimeoutSecondsRemain >= (5 * 60)) {
        const notification = new firebase.notifications.Notification()
            .setTitle(`Уровень ${Level.Number}. Скоро автопереход!`)
            .setBody(`${UP_EMOJI} Автопереход через 5 мин!`)
            .android.setPriority(firebase.notifications.Android.Priority.Default)
            .android.setChannelId(UP_CHANNEL)
            .android.setGroup(UP_CHANNEL)
            .android.setSmallIcon('ic_notification')
            .android.setColor(Colors.upTime);

        firebase.notifications().scheduleNotification(notification, {
            fireDate: new Date(Date.now() + ((Level.TimeoutSecondsRemain - (5 * 60)) * 1000)).getTime(),
        });
    }

    Sentry.setTag('GAME_ID', `${gameModel.GameId}`);
    Sentry.setExtra('LEVEL_NUMBER', Level.Number);
};
