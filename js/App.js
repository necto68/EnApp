import React, { Component } from 'react';
import { Root, Toast, ActionSheet } from 'native-base';
import SplashScreen from 'react-native-splash-screen';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from './constants/keys';
import MainView from './views/MainView';
import { initNotifications, initBilling, initGoogleSignIn } from './core/events/onAppInit';

Sentry.init({
    dsn: SENTRY_DSN,
});

export default class App extends Component {
    async componentDidMount() {
        SplashScreen.hide();

        initNotifications();
        initBilling();
        initGoogleSignIn();
    }

    componentWillUnmount() {
        Toast.toastInstance = null;
        ActionSheet.actionsheetInstance = null;
    }

    render() {
        return (
            <Root>
                <MainView />
            </Root>
        );
    }
}
