import React, { Component } from 'react';
import { Linking } from 'react-native';
import { Button, Text, Icon } from 'native-base';

class TelegramButton extends Component {
    TELEGRAM_GROUP_NAME = 'EnApp';

    TELEGRAM_APP_LINK = `tg://resolve?domain=${this.TELEGRAM_GROUP_NAME}`;

    TELEGRAM_BROWSER_LINK = `https://t.me/${this.TELEGRAM_GROUP_NAME}`;

    openTelegramGroup = () => {
        Linking.canOpenURL(this.TELEGRAM_APP_LINK).then((isCan) => {
            if (isCan) {
                Linking.openURL(this.TELEGRAM_APP_LINK);
            } else {
                Linking.openURL(this.TELEGRAM_BROWSER_LINK);
            }
        });
    };

    render() {
        return (
            <Button
                info
                block
                iconRight
                onPress={this.openTelegramGroup}
                {...this.props}
            >
                <Text>{`@${this.TELEGRAM_GROUP_NAME}`}</Text>
                <Icon name="paper-plane" />
            </Button>
        );
    }
}

export default TelegramButton;
