import firebase from 'react-native-firebase';
import gameStore from '../stores/gameStore';
import globals from '../../constants/globals';
import { UP_EMOJI, HINT_EMOJI, SECTORS_EMOJI } from '../../constants/emojis';
import Helper from '../../util/helper';
import { LEVEL_STATE_CHANNEL } from '../../constants/channelIds';

export default () => {
    const { gameModel } = gameStore;
    const Level = gameModel.Level;

    gameStore.globalTimerCounter += 1;

    if (gameModel.Event === 0) {
        const unreadHint = Level.Helps.find(help => help.RemainSeconds > 0);

        const notification = new firebase.notifications.Notification()
            .setNotificationId(LEVEL_STATE_CHANNEL)
            .setTitle([`Уровень ${Level.Number}/${gameModel.Levels.length}`, Level.Name].filter(Boolean).join(': '))
            .setBody([
                `${SECTORS_EMOJI}: ${Level.SectorsLeftToClose > 0 ? Level.SectorsLeftToClose : 1}`,
                Level.Timeout > 0 ? `${UP_EMOJI}: ${Helper.formatCount(Level.TimeoutSecondsRemain - gameStore.globalTimerCounter)}` : '',
                unreadHint
                    ? `${HINT_EMOJI}: #${unreadHint.Number} - ${Helper.formatCount(unreadHint.RemainSeconds - gameStore.globalTimerCounter)}`
                    : '',
            ].filter(Boolean).join('\n\n').trim())
            .android.setPriority(firebase.notifications.Android.Priority.Max)
            .android.setChannelId(LEVEL_STATE_CHANNEL)
            .android.setAutoCancel(false)
            .android.setOnlyAlertOnce(true)
            .android.setSmallIcon('ic_notification')
            .android.setColorized(true)
            .android.setColor('#008200')
            .android.setOngoing(true)
            .android.addAction(new firebase.notifications.Android.Action('sendCodeAction', 'ic_notification', 'Отправить код')
                .setShowUserInterface(true)
                .addRemoteInput(new firebase.notifications.Android.RemoteInput('inputCode')
                    .setLabel('Код'),
                ));

        firebase.notifications().displayNotification(notification);
    }

    if (globals.REFRESH_INTERVAL_SECONDS > 0 && gameStore.globalTimerCounter % globals.REFRESH_INTERVAL_SECONDS === 0) {
        gameStore.updateGameModel();
    }
};
