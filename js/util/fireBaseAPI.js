import firebase from 'react-native-firebase';
import userStore from '../core/stores/userStore';

const INITIAL_PURCHASED_GAMES = 10;
const INITIAL_USER = {
    purchasedGames: INITIAL_PURCHASED_GAMES,
    playedGames: [],
};

const createGameHash = (domain, gameId) => [domain, gameId].join('/').trim().toLowerCase();

export const getOrCreateUser = async (userEmail = userStore.userEmail) => {
    const docRef = firebase.firestore().collection('users').doc(userEmail);
    const doc = await docRef.get();
    let data = null;

    if (!doc.exists) {
        data = await firebase
            .firestore().runTransaction(async (transaction) => {
                transaction.set(docRef, INITIAL_USER);
                return INITIAL_USER;
            });
    } else {
        data = doc.data();
    }

    const { purchasedGames, playedGames } = data;

    userStore.userEmail = userEmail;
    userStore.purchasedGames = purchasedGames;
    userStore.playedGames = playedGames;

    return data;
};

export const isGameAllowedWithoutWithdraw = async (domain, gameId) => {
    const gameHash = createGameHash(domain, gameId);
    const { userEmail, playedGames } = userStore;
    const docRef = firebase.firestore().collection('users').doc(userEmail);

    // !TODO delete TEST
    if (/^demo/i.test(domain)) {
        return true;
    } else if (playedGames.includes(gameHash)) {
        return true;
    }

    const doc = await docRef.get();
    const { playedGames: playedGamesFromDB, purchasedGames: purchasedGamesFromDB } = doc.data();
    if (playedGamesFromDB.includes(gameHash)) {
        userStore.purchasedGames = purchasedGamesFromDB;
        userStore.playedGames = playedGamesFromDB;
        return true;
    }

    return false;
};

export const withdrawGame = async (domain, gameId) => {
    const gameHash = createGameHash(domain, gameId);
    const { userEmail } = userStore;
    const docRef = firebase.firestore().collection('users').doc(userEmail);

    const nextUser = await firebase
        .firestore().runTransaction(async (transaction) => {
            const doc = await docRef.get();
            const {
                purchasedGames: purchasedGamesFromDB,
                playedGames: playedGamesFromDB,
            } = doc.data();
            const updatedData = {
                purchasedGames: purchasedGamesFromDB - 1,
                playedGames: playedGamesFromDB.concat(gameHash),
            };


            transaction.update(docRef, updatedData);
            return updatedData;
        });

    const { playedGames, purchasedGames } = nextUser;

    userStore.playedGames = playedGames;
    userStore.purchasedGames = purchasedGames;

    return nextUser;
};

export const replenishGames = async (gamesAmount) => {
    const { userEmail } = userStore;
    const docRef = firebase.firestore().collection('users').doc(userEmail);

    const nextUser = await firebase
        .firestore().runTransaction(async (transaction) => {
            const doc = await docRef.get();
            const {
                purchasedGames: purchasedGamesFromDB,
            } = doc.data();
            const updatedData = {
                purchasedGames: purchasedGamesFromDB + gamesAmount,
            };


            transaction.update(docRef, updatedData);
            return updatedData;
        });

    const { purchasedGames } = nextUser;

    userStore.purchasedGames = purchasedGames;

    return nextUser;
};

export default { getOrCreateUser };
