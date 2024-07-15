import React, { Component } from 'react';
import { Linking } from 'react-native';
import { Button, Text, Icon } from 'native-base';

class GooglePlayButton extends Component {
    PACKAGE_NAME = 'net.necto68.enapp';

    GOOGLE_PLAY_MARKET_LINK = `market://details?id=${this.PACKAGE_NAME}`;

    GOOGLE_PLAY_BROWSER_LINK = `https://play.google.com/store/apps/details?id=${this.TELEGRAM_GROUP_NAME}`;

    openGooglePlayLink = () => {
        Linking.canOpenURL(this.GOOGLE_PLAY_MARKET_LINK).then((isCan) => {
            if (isCan) {
                Linking.openURL(this.GOOGLE_PLAY_MARKET_LINK);
            } else {
                Linking.openURL(this.GOOGLE_PLAY_BROWSER_LINK);
            }
        });
    };

    render() {
        return (
            <Button
                success
                block
                iconRight
                onPress={this.openGooglePlayLink}
                {...this.props}
            >
                <Text>{'Оценить'}</Text>
                <Icon name="star" />
            </Button>
        );
    }
}

export default GooglePlayButton;
