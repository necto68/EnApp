import { Linking, Platform } from 'react-native';
import { ActionSheet } from 'native-base';
import RNFS from 'react-native-fs';
import FileOpener from 'react-native-file-opener';
import Colors from '../../constants/colors';
import mapsMePlacemarkColors from '../../constants/mapsMePlacemarkColors';
import Helper from '../../util/helper';
import gameStore from '../../core/stores/gameStore';
import buildUrl from 'build-url';

const SAVE_PATH = Platform.select({
    ios: () => RNFS.DocumentDirectoryPath,
    android: () => RNFS.ExternalDirectoryPath,
})();

const KML_FILE_PATH = `${SAVE_PATH}/Points.kml`;

const getKmlString = (coordsArr) => {
    const placemarksColor = mapsMePlacemarkColors[Helper.randomInt(0, mapsMePlacemarkColors.length - 1)];
    const levelTitle = `Уровень ${gameStore.gameModel.Level.Number}`;

    let kmlStr = '';

    kmlStr += `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
    <name>${levelTitle}</name>`;

    coordsArr.forEach((coords, index) => {
        kmlStr += `<Placemark>
        <name>${levelTitle}. Точка ${index + 1}</name>
        <styleUrl>#placemark-${placemarksColor}</styleUrl>
        <Point>
        <coordinates>${coords.lon},${coords.lat},0</coordinates>
        </Point>
        </Placemark>`;
    });

    kmlStr += '</Document></kml>';

    return kmlStr;
};

const createAndOpenKml = async (coordsArr) => {
    try {
        // try to delete (if exist)
        await RNFS.unlink(KML_FILE_PATH);
    } catch (e) {}
    await RNFS.writeFile(KML_FILE_PATH, getKmlString(coordsArr));
    await FileOpener.open(KML_FILE_PATH, 'application/vnd.google-earth.kml+xml');
};

export default (currentCoordsUrl, coordsArr) => {
    const currentCoords = Helper.getCoorsArray(currentCoordsUrl)[0];
    const currentCoordsIndex = coordsArr.findIndex(({ lat, lon }) => currentCoords.lat === lat && currentCoords.lon === lon);

    const BUTTONS = [
        {
            text: `Только точка №${currentCoordsIndex + 1} (${currentCoords.lat}, ${currentCoords.lon})`,
            icon: 'pin',
            iconColor: Colors.wrongCode,
        },
        { text: 'Все точки в KML-файле', icon: 'map', iconColor: Colors.blue },
        { text: 'Все точки в GoogleMaps', icon: 'logo-google', iconColor: Colors.green },
        { text: 'Отмена', icon: 'close', iconColor: Colors.gray },
    ];

    const CANCEL_INDEX = BUTTONS.length - 1;

    const onButtonClick = (buttonIndex) => {
        if (buttonIndex === 0) {
            Linking.openURL(currentCoordsUrl);
        } else if (buttonIndex === 1) {
            createAndOpenKml(coordsArr);
        } else if (buttonIndex === 2) {
            const lastCoord = coordsArr[coordsArr.length - 1];
            const googleMapsUrl = buildUrl('https://www.google.com', {
                path: 'maps/dir/',
                queryParams: {
                    api: 1,
                    travelmode: 'driving',
                    dir_action: 'navigate',
                    destination: `${lastCoord.lat},${lastCoord.lon}`,
                    waypoints: coordsArr
                        .slice(0, coordsArr.length - 1) // all without last item
                        .map(({ lat, lon }) => `${lat},${lon}`)
                        .join('|'),
                },
            });

            Linking.openURL(googleMapsUrl);
        }
    };

    ActionSheet.show(
        {
            options: BUTTONS,
            cancelButtonIndex: CANCEL_INDEX,
            title: `Открыть координаты (${coordsArr.length} шт.)`,
        },
        buttonIndex => onButtonClick(+buttonIndex),
    );
};
