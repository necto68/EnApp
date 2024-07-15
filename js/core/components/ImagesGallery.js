import React from 'react';
import { View, Image, Linking, Clipboard, ToastAndroid } from 'react-native';
import { Text, Button, Icon } from 'native-base';
import Gallery from 'react-native-image-gallery';
import Colors from '../../constants/colors';
import loginErrorStrings from '../../constants/loginErrorStrings';

class ImagesGallery extends React.Component {
    state = {
        imageIndex: 0,
    };


    onChangeImage = (imageIndex) => {
        this.setState({ imageIndex });
    };


    onGoogleSearch = () => {
        const currentUrl = this.props.imagesUrls[this.state.imageIndex];
        Linking.openURL(`https://www.google.com/searchbyimage?image_url=${currentUrl}`);
    };

    onOpenLink = () => {
        const currentUrl = this.props.imagesUrls[this.state.imageIndex];
        Linking.openURL(currentUrl);
    };

    onCopyLink = () => {
        const currentUrl = this.props.imagesUrls[this.state.imageIndex];
        Clipboard.setString(currentUrl);

        ToastAndroid.show('Ссылка скопирована в буфер обмена!', ToastAndroid.SHORT);
    };

    onCloseModal = () => {
        this.props.setIsShowImagesGallery(false);
    };

    render() {
        const { imageIndex } = this.state;
        const { imagesUrls, currentImageUrl } = this.props;
        const initialPage = imagesUrls.findIndex(imageUrl => imageUrl === currentImageUrl);
        let imgName = imagesUrls[imageIndex].split('/');
        imgName = imgName[imgName.length - 1];
        imgName = decodeURIComponent(imgName);

        return (
            <View style={styles.mainContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{`${imageIndex + 1}/${imagesUrls.length}`}</Text>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{imgName}</Text>
                </View>
                <Gallery
                    style={styles.imagesGallery}
                    images={imagesUrls.map(uri => ({ source: { uri } }))}
                    onPageSelected={this.onChangeImage}
                    initialPage={initialPage >= 0 ? initialPage : 0}
                    imageComponent={imageProps => (
                        <Image
                            {...imageProps}
                        />
                    )}
                />
                <View style={styles.buttonsWrapper}>
                    <View style={styles.buttonsContainer}>
                        <Button
                            success
                            onPress={this.onGoogleSearch}
                        >
                            <Icon name="logo-google" />
                        </Button>
                        <Button
                            primary
                            onPress={this.onOpenLink}
                        >
                            <Icon name="open" />
                        </Button>
                        <Button
                            light
                            onPress={this.onCopyLink}
                        >
                            <Icon name="copy" />
                        </Button>
                    </View>
                    <Button
                        danger
                        block
                        onPress={this.onCloseModal}
                    >
                        <Icon name="close-circle" />
                    </Button>
                </View>
            </View>
        );
    }
}

const styles = {
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    imagesGallery: {
        flex: 3,
        backgroundColor: Colors.background,
    },

    titleContainer: {
        paddingVertical: 5,
        justifyContent: 'center',
    },

    titleText: {
        fontSize: 19,
        color: Colors.white,
        textAlign: 'center',
    },

    buttonsWrapper: {
        height: 150,
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },

    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
};

export default ImagesGallery;
