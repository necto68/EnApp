import React from 'react';
import { observer } from 'mobx-react/native';
import { Text, View } from 'react-native';
import { Spinner } from 'native-base';

import Helper from '../util/helper';

import Colors from '../constants/colors';

const MonitoringItem = ({ answer }) => (
    <View style={styles.mainContainer}>
        <View style={styles.coloredLabel} />
        <View style={styles.sectorContainer}>
            <Spinner size="small" color={Colors.blue} style={{ height: 16 }} />
        </View>
        <View style={styles.sectorContainer}>
            <Text style={styles.sectorValue}>
                { answer }
            </Text>
        </View>
        <View style={styles.sectorContainer}>
            <Text style={styles.sectorValue}>
                { '' }
            </Text>
        </View>
    </View>
);

const styles = {
    mainContainer: {
        minHeight: 18,
        flexDirection: 'row',
        backgroundColor: Colors.gray,
        flex: 1,
    },

    coloredLabel: {
        width: 5,
        backgroundColor: Colors.upTime,
    },

    sectorContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderColor: Colors.gray,
        borderBottomWidth: 0.5,
        borderTopWidth: 0.5,
    },

    sectorValue: {
        color: Colors.white,
        fontFamily: 'Verdana',
        fontSize: 12,
    },
};

export default observer(MonitoringItem);

