import { Vibration, AsyncStorage } from 'react-native';
import { action, observable } from 'mobx';
import { create, persist } from 'mobx-persist';
import BackgroundTimer from 'react-native-background-timer';
import onGlobalTimerTick from '../../core/events/onGlobalTimerTick';
import onNewLevelStart from '../../core/events/onNewLevelStart';

import globals from '../../constants/globals';

import API from '../../util/API';
import asyncStorage from '../../util/asyncStorage';
import Helper from '../../util/helper';


// class UpdatesQueueItem {
//     @persist @observable $uniqueId = 0;
//     @persist @observable LevelId = 0;
//     // @persist @observable 'LevelAction.Answer' = '';
//     // @persist @observable 'BonusAction.Answer' = '';
// }

class GameStore {
    @persist('object') @observable gameModel = {};
    @persist @observable globalTimerCounter = 0;
    @persist @observable lastUpdateTimestamp = Date.now();
    @persist('list') @observable updatesQueue = [];
    @persist @observable currentTabsPage = 0;
    @observable isRefreshing = false;
    @observable actualCode = '';
    @observable actualBonusCode = '';
    @observable actualView = 'LoadingView';
    @observable modelLoadingPercentages = 0;
    @observable indexForSectorsList = { index: 0 };
    @observable indexForBonusesList = { index: 0 };

    globalTimer = null;
    currentLevelNumber = 1;
    isTriedLoginAgain = false;

    @action updateGameModel = async (requestData = {}) => {
        let $uniqueId = 0;

        if (this.updatesQueue.length === 0 || !Helper.isObjectEmpty(requestData)) {
            $uniqueId = Helper.randomInt(100000, 999999);
            this.updatesQueue = this.updatesQueue.concat({ $uniqueId, ...requestData });
        }

        if (this.isRefreshing) return;

        const firstRequestData = this.updatesQueue[0];
        let gameModelBuffer = {};

        this.isRefreshing = true;

        this.modelLoadingPercentages = 0;

        try {
            gameModelBuffer = await API.getGameModal(
                {
                    ...firstRequestData,
                    LevelNumber: this.currentLevelNumber,
                },
            );
            this.isRefreshing = false;
        } catch (e) {
            this.isRefreshing = false;
            return;
        }

        if (globals.GAME_MODAL_EVENTS_FOR_UPDATE.includes(gameModelBuffer.Event)) {
            this.updateGameModel();
        } else if (gameModelBuffer.Event === 0) {
            if (
                gameModelBuffer.Level &&
                gameModelBuffer.Level.Number !== (this.gameModel.Level ? this.gameModel.Level.Number : null)
            ) {
                this.gameModel = gameModelBuffer;
                onNewLevelStart();
            }

            this.gameModel = gameModelBuffer;
            this.onSuccessGetGameModel({ deleteUpdatesItemId: firstRequestData.$uniqueId });
            this.createGlobalTimer();
        } else if (Number.isInteger(gameModelBuffer.Event)) {
            this.setActualView('LoadingView');
            this.gameModel = gameModelBuffer;
            this.createGlobalTimer();
        } else if (this.isTriedLoginAgain) {
            this.isTriedLoginAgain = false;
            this.signOut();
            this.gameModel = {};
        } else {
            await API.loginUser();
            this.isTriedLoginAgain = true;
            await this.updateGameModel(requestData);
            this.isTriedLoginAgain = false;
        }
    };

    @action sendCode = async () => {
        const requestData = {
            LevelId: this.gameModel.Level && this.gameModel.Level.LevelId,
            'LevelAction.Answer': this.actualCode,
        };

        this.updateGameModel(requestData);
    };

    @action sendBonusCode = async () => {
        const requestData = {
            LevelId: this.gameModel.Level && this.gameModel.Level.LevelId,
            'BonusAction.Answer': this.actualBonusCode,
        };

        this.updateGameModel(requestData);
    };

    @action getPenaltyHint = async (hintId) => {
        const getParams = {
            pid: hintId,
            pact: 1,
        };

        await API.getGameModelWithParams(getParams);
        this.updateGameModel();
    }

    @action changeActualCode = (code) => {
        this.actualCode = code;
    };

    @action changeActualBonusCode = (code) => {
        this.actualBonusCode = code;
    };

    @action setActualView = (viewName) => {
        this.actualView = viewName;
    };

    @action setCurrentTabsPage = (currentPage) => {
        this.currentTabsPage = currentPage;
    };

    @action signOut = () => {
        this.gameModel = {};
        this.setActualView('LoginView');
        BackgroundTimer.clearInterval(this.globalTimer);
        asyncStorage.setItem('cookiesValue', '');
    };

    @action onSuccessGetGameModel = ({ deleteUpdatesItemId }) => {
        this.setActualView('GameView');

        this.modelLoadingPercentages = 100;

        const { LevelAction, BonusAction } = this.gameModel.EngineAction;

        if (LevelAction.IsCorrectAnswer === false || BonusAction.IsCorrectAnswer === false) {
            Vibration.vibrate(60);
        }

        if (this.updatesQueue.length > 0) {
            // delete sent item
            this.updatesQueue = this.updatesQueue.filter(item => item.$uniqueId !== deleteUpdatesItemId);

            if (this.updatesQueue.length > 0) {
                // no timeout === ban for bruteforce
                setTimeout(() => {
                    this.updateGameModel(this.updatesQueue[0]);
                }, Helper.randomInt(200, 500));
            }
        }
    };

    @action createGlobalTimer = () => {
        this.lastUpdateTimestamp = Date.now();
        this.globalTimerCounter = 0;

        this.runGlobalTimer();
    };

    @action runGlobalTimer = () => {
        if (this.globalTimer) BackgroundTimer.clearInterval(this.globalTimer);

        this.globalTimer = BackgroundTimer.setInterval(() => {
            onGlobalTimerTick();
        }, 1000);
    };

    @action setCurrentLevelNumber = (levelNumber) => {
        this.currentLevelNumber = levelNumber;
        this.updateGameModel();
    };

    @action setIndexForSectorsList = (index) => {
        this.setCurrentTabsPage(1);
        this.indexForSectorsList = index;
    }

    @action setIndexForBonusesList = (index) => {
        this.setCurrentTabsPage(3);
        this.indexForBonusesList = index;
    }
}

const gameStore = new GameStore();
create({ storage: AsyncStorage })('gameStore', gameStore).then(() => {
    const { gameModel, setActualView, runGlobalTimer } = gameStore;

    if (gameModel && gameModel.Level) {
        setActualView('GameView');
        runGlobalTimer();
        onNewLevelStart();
    }
});

export default gameStore;
