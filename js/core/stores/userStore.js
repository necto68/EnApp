import { AsyncStorage } from 'react-native';
import { observable } from 'mobx';
import { create, persist } from 'mobx-persist';
import * as Sentry from '@sentry/react-native';

class UserStore {
  @persist @observable userEmail = '';
  @persist @observable purchasedGames = 0;
  @persist('list') @observable playedGames = [];
}

const userStore = new UserStore();
create({ storage: AsyncStorage })('userStore', userStore).then(() => {
    const { userEmail } = userStore;

    Sentry.setUser({ email: userEmail });
});

export default userStore;
