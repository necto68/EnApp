import React, { Component } from 'react';
import { observer } from 'mobx-react/native';
import { Linking, WebView, View, Modal } from 'react-native';
import { Spinner } from 'native-base';
import cheerio from 'cheerio';
import Helper from '../../../util/helper';
import asyncStorage from '../../../util/asyncStorage';
import Colors from '../../../constants/colors';
import onMultiCoordsOpen from '../../events/onMultiCoordsOpen';
import ImagesGallery from '../ImagesGallery';

const openFullVersion = async () => {
    const { domainValue, idGameValue } = await asyncStorage.getItems(['domainValue', 'idGameValue']);

    Linking.openURL(`http://${domainValue}/gameengines/encounter/play/${idGameValue}`);
};

@observer
class HTMLView extends Component {
    state = {
        webViewHeight: 1,
        isShowImagesGallery: false,
        imagesUrls: [],
        currentImageUrl: '',
    };

    // eslint-disable-next-line
    DEFAULT_HTML_URI = 'file:///android_asset/HTMLView/defaultHTML.html';

    isStillOpeningCustomTub = false;

    isOnLoadEndCalled = false;

    componentWillReceiveProps(nextProps) {
        if (nextProps.html !== this.props.html || nextProps.shouldReplaceNlToBr !== this.props.shouldReplaceNlToBr) {
            this.injectHTML(nextProps.html, nextProps.shouldReplaceNlToBr);
            this.parseImagesUrls(nextProps.html);
        }
    }

    onMessage = (data) => {
        if (data.type === 'viewHeight') {
            this.setState({
                webViewHeight: data.data,
            });
        } else if (data.type === 'locationUrl') {
            if (data.data.toString().indexOf('geo') === 0) {
                const coordsArr = Helper.getCoorsArray(this.props.html);

                if (coordsArr.length >= 2) {
                    onMultiCoordsOpen(data.data, coordsArr);
                } else {
                    Linking.openURL(data.data);
                }
            } else if (!this.isStillOpeningCustomTub) {
                // some debounce
                this.isStillOpeningCustomTub = true;

                setTimeout(() => {
                    this.isStillOpeningCustomTub = false;
                }, 100);

                Helper.openCustomTab(data.data);
            }
        } else if (data.type === 'openFullVersion') {
            openFullVersion();
        } else if (data.type === 'showImagesGallery') {
            this.setState({ currentImageUrl: data.data.toString() });
            this.setIsShowImagesGallery(true);
        }
    };

    injectHTML = (html, shouldReplaceNlToBr) => {
        this.webView.postMessage(JSON.stringify({
            type: 'setHTML',
            data: Helper.normalizeHTML(html, shouldReplaceNlToBr),
        }));
    };

    onNavigationStateChange = (event) => {
        const protocol = event.url.split('://')[0];
        let hostname = event.url.match(/:\/\/([a-z0-9]+):/);
        hostname = hostname && hostname[1];


        if (protocol !== 'file' && hostname !== 'localhost') {
            Linking.canOpenURL(event.url).then((isCan) => {
                if (isCan) {
                    this.webView.stopLoading();
                    Linking.openURL(event.url);
                }
            });
        } else {
            try {
                const messageData = JSON.parse(event.title);
                this.onMessage(messageData);
            } catch (e) {

            }
        }
    };

    onLoadEnd = () => {
        if (!this.isOnLoadEndCalled) {
            this.isOnLoadEndCalled = true;
            this.injectHTML(this.props.html, this.props.shouldReplaceNlToBr);
            this.parseImagesUrls(this.props.html);
        }
    };

    parseImagesUrls = (html) => {
        const htmlString = typeof html === 'string' ? html : '';
        const $ = cheerio.load(htmlString.replace('/HACK_WITH_PERCENTAGE/gim', '%'));

        const selectors = [
            'a[href^="http"][href$="jpg"]',
            'a[href^="http"][href$="jpeg"]',
            'a[href^="http"][href$="png"]',
            'img',
        ];

        let imagesUrls = $(selectors.join(', '))
            .map((i, el) => ($(el).is('img') ? $(el).attr('src') : $(el).attr('href')))
            .get();

        imagesUrls = [...imagesUrls];
        this.setState({ imagesUrls });
    };

    setIsShowImagesGallery = (isShowImagesGallery) => {
        this.setState({ isShowImagesGallery });
    };

    render() {
        const {
            webViewHeight,
            isShowImagesGallery,
            imagesUrls,
            currentImageUrl,
        } = this.state;
        return (
            <View>
                <WebView
                    ref={(view) => { this.webView = view; }}
                    source={{ uri: this.DEFAULT_HTML_URI }}
                    automaticallyAdjustContentInsets={false}
                    renderLoading={() => <Spinner color={Colors.blue} />}
                    onLoadEnd={this.onLoadEnd}
                    javaScriptEnable
                    startInLoadingState
                    onNavigationStateChange={this.onNavigationStateChange}
                    style={{ height: webViewHeight, backgroundColor: Colors.background }}
                />
                <Modal
                    animationType="fade"
                    transparent={false}
                    onRequestClose={() => this.setIsShowImagesGallery(false)}
                    visible={isShowImagesGallery}
                >
                    <ImagesGallery
                        imagesUrls={imagesUrls}
                        currentImageUrl={currentImageUrl}
                        setIsShowImagesGallery={this.setIsShowImagesGallery}
                    />
                </Modal>
            </View>
        );
    }
}

HTMLView.defaultProps = {
    shouldReplaceNlToBr: true,
};

export default HTMLView;
