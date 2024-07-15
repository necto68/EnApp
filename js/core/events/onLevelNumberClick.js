import { ActionSheet } from 'native-base';
import Colors from '../../constants/colors';
import gameStore from '../../core/stores/gameStore';

const onButtonClick = (buttonIndex, buttonsArray) => {
    if (buttonIndex !== buttonsArray.length - 1) {
        gameStore.setCurrentLevelNumber(buttonIndex + 1);
    }
};

export default () => {
    const BUTTONS = [];
    const Levels = gameStore.gameModel.Levels;
    const currentLevelId = gameStore.gameModel.Level.LevelId;
    const passedLevelsLength = Levels.filter(level => level.IsPassed).length;

    Levels.forEach((level) => {
        BUTTONS.push({
            text: level.LevelName ? `${level.LevelNumber}: ${level.LevelName}` : level.LevelNumber,
            icon: do {
                if (level.levelId === currentLevelId) { 'arrow-dropright'; } else if (level.Dismissed) { 'close'; } else if (level.IsPassed) { 'checkmark'; } else { null; }
            },
            iconColor: do {
                if (level.levelId === currentLevelId) { Colors.green; } else if (level.Dismissed) { Colors.wrongCode; } else if (level.IsPassed) { Colors.rightCode; } else { null; }
            },
        });
    });

    BUTTONS.push({
        text: 'Отмена',
        icon: 'close',
        iconColor: Colors.gray,
    });

    ActionSheet.show(
        {
            options: BUTTONS,
            cancelButtonIndex: BUTTONS.length - 1,
            title: `Пройдено уровней: ${passedLevelsLength}/${Levels.length}`,
        },
        buttonIndex => onButtonClick(+buttonIndex, BUTTONS),
    );
};
