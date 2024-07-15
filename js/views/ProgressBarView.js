import React, { Component } from 'react';
import { View, Dimensions } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import Colors from '../constants/colors';

const DEVICE_WIDTH = Dimensions.get('window').width;

const mapStateToProps = (stores => ({
    modelLoadingPercentages: stores.gameStore.modelLoadingPercentages,
}));

class ProgressBarView extends Component {
    componentWillReceiveProps({ modelLoadingPercentages }) {
        // start with 5% when fetch only started
        const percentages = do {
            if (modelLoadingPercentages === 0) { 5 }
            else if (modelLoadingPercentages === 100) { 0 }
            else { modelLoadingPercentages }
        };

        this.progressBar.setNativeProps({
            style: {
                backgroundColor: Colors.white,
                width: (percentages * DEVICE_WIDTH) / 100,
            },
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <View
                    ref={view => this.progressBar = view}
                    style={{ backgroundColor: Colors.white, width: 0 }}
                />
                <View style={styles.background} />
            </View>
        );
    }
}

const styles = {
    container: {
        flexDirection: 'row',
        height: 8,
        paddingVertical: 3,
        backgroundColor: Colors.tabBackground,
    },

    background: {
        flex: 1,
        backgroundColor: Colors.tabBackground,
    },
};

export default inject(mapStateToProps)(observer(ProgressBarView));
