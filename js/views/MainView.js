import React, { Component } from 'react';
import { observer, Provider } from 'mobx-react/native';
import gameStore from '../core/stores/gameStore';
import userStore from '../core/stores/userStore';

import GameView from './GameView';
import LoadingView from './LoadingView';
import LoginView from './LoginView';

const VIEWS = {
    GameView,
    LoadingView,
    LoginView,
};

class MainView extends Component {
    componentDidMount() {
        const ActualView = VIEWS[gameStore.actualView];

        if (!ActualView) {
            gameStore.setActualView('LoadingView');
        }
    }
    render() {
        const ActualView = VIEWS[gameStore.actualView];

        return (
            ActualView && (
                <Provider gameStore={gameStore} userStore={userStore}>
                    <ActualView />
                </Provider>
            )
        );
    }
}

export default observer(MainView);
