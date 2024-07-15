import React, { Component } from 'react';
import { Alert } from 'react-native';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import firebase from 'react-native-firebase';
import { getOrCreateUser } from '../../../util/fireBaseAPI';

const { GoogleAuthProvider } = firebase.auth;

class GoogleSignInView extends Component {
    signIn = async () => {
        const { onSignIn } = this.props;
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signIn();
            const { idToken, accessToken } = await GoogleSignin.getTokens();
            const credential = GoogleAuthProvider.credential(idToken, accessToken);
            const firebaseUser = await firebase.auth().signInWithCredential(credential);
            const user = await getOrCreateUser(firebaseUser.user.email);
            onSignIn(user);
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Login error', 'User cancelled the login flow');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Login error', 'Operation (e.g. sign in) is in progress already');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Login error', 'Play services not available or outdated');
            } else {
                Alert.alert('Error', JSON.stringify(error, null, 2));
            }
        }
    }

    render() {
        return (
            <GoogleSigninButton
                style={{ width: 350, height: 55, marginTop: 20 }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={this.signIn}
            />
        );
    }
}

GoogleSignInView.defaultProps = {
    onSignIn: () => undefined,
};

export default GoogleSignInView;
