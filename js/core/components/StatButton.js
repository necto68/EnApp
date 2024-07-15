import React, { Component } from 'react';
import { Linking } from 'react-native';
import { Button, Text, Icon } from 'native-base';
import asyncStorage from '../../util/asyncStorage';

class StatButton extends Component {
    openStatistic = async () => {
        const {
            domainValue,
            idGameValue,
        } = await asyncStorage.getItems([
            'domainValue',
            'idGameValue',
        ]);

        Linking.openURL(`http://${domainValue}/GameStat.aspx?gid=${idGameValue}`);
    };

    render() {
        return (
            <Button
                success
                block
                iconRight
                onPress={this.openStatistic}
                {...this.props}
            >
                <Text>{'Статистика'}</Text>
                <Icon name="list" />
            </Button>
        );
    }
}

export default StatButton;
