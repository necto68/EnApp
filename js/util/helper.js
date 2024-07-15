import { Platform } from 'react-native';
import moment from 'moment';
import {
    CustomTabs,
    ANIMATIONS_SLIDE,
} from 'react-native-custom-tabs';
import asyncStorage from './asyncStorage';
import Colors from '../constants/colors';

const COORDS_REG_EXP = /(?![^<]*>)(-?\d{1,3}[.,]\d{3,8})[\s\S]+?(-?\d{1,3}[.,]\d{3,8})/gim;

class Helper {
    static normalizeHTML(html = '', shouldReplaceNlToBr = true) {
        const htmlString = typeof html === 'string' ? html : '';
        let pointNumber = 0;
        let normalizedHtml = htmlString.replace(
            COORDS_REG_EXP,
            (str, lat, lon) => {
                pointNumber += 1;
                return Platform.select({
                    ios: () => `<a href="https://maps.google.com/?daddr=${lat},${lon}">${str}</a>`,
                    android: () => `<a href="geo:${lat},${lon}?z=16&q=${lat},${lon}(Точка+${pointNumber})">${str}</a>`,
                })();
            },
        );
        normalizedHtml = normalizedHtml.replace(/\r\n/gim, shouldReplaceNlToBr ? '<br/>' : ' ');
        // hack for fucking strange decodeUri before set innerHTML. see in defaultHTML.html
        normalizedHtml = normalizedHtml.replace(/%/gim, 'HACK_WITH_PERCENTAGE');
        return normalizedHtml;
    }

    static normalizeTime(time) {
        return time - 62135596800000;
    }

    static formatTime(time) {
        return moment(Helper.normalizeTime(time)).format('HH:mm:ss');
    }

    static formatCount(s, options = {}) {
        const { collapse, withUnits, showZeroSeconds } = options;
        const pad = num => (`0${num}`).slice(-2);
        let seconds = s;

        let minutes = Math.floor(seconds / 60);
        seconds %= 60;
        const hours = Math.floor(minutes / 60);
        minutes %= 60;

        if (collapse) {
            return [
                hours > 0 ? hours : '',
                do {
                    // eslint-disable-next-line
                    if (hours > 0) { withUnits ? ' ч ' : ':' } else { '' }
                },
                minutes > 0 ? minutes : '',
                do {
                    // eslint-disable-next-line
                    if (minutes > 0) { withUnits ? ' м ' : ':' } else { '' }
                },
                (showZeroSeconds ? (seconds >= 0) : (seconds > 0)) ? seconds : '',
                do {
                    // eslint-disable-next-line
                    if ((showZeroSeconds ? (seconds >= 0) : (seconds > 0))) { withUnits ? ' с ' : ':' } else { '' }
                },
            ].join('').trim();
        }

        return [
            hours,
            withUnits ? ' ч ' : ':',
            pad(minutes),
            withUnits ? ' м ' : ':',
            pad(seconds),
            withUnits ? ' с ' : '',
        ].join('').trim();
    }

    static normalizeCode(code) {
        return code.toString().toLowerCase().trim();
    }

    static isEqualCode(code1 = '', code2 = '') {
        const { normalizeCode } = Helper;

        if (code1.length && code2.length) {
            return normalizeCode(code1) === normalizeCode(code2);
        }

        return false;
    }

    static isCodeStartsWith(code, substr) {
        const { normalizeCode } = Helper;

        if (code.length && substr.length) {
            return normalizeCode(code).startsWith(normalizeCode(substr));
        }

        return false;
    }

    static formatWithNewLine(stringArray) {
        return stringArray.join('\n').trim();
    }

    static async openCustomTab(url) {
        const cookiesValue = await asyncStorage.getItem('cookiesValue');

        CustomTabs.openURL(url, {
            toolbarColor: Colors.tabBackground,
            enableUrlBarHiding: true,
            showPageTitle: true,
            enableDefaultShare: true,
            animations: ANIMATIONS_SLIDE,
            headers: {
                Cookie: cookiesValue,
            },
        });
    }

    static isObjectEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    static getCoorsArray(html) {
        const coordsArr = [];

        html.replace(
            COORDS_REG_EXP,
            (str, lat, lon) => {
                coordsArr.push({ lat, lon });
            },
        );

        return coordsArr;
    }

    static getLocDateTime(item) {
        return typeof item.LocDateTime === 'string' ? item.LocDateTime.split(' ')[1] : null;
    }
}

export default Helper;
