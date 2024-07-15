import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";
import qs from "querystring";
import axios from "axios";
import cheerio from "cheerio";
import gameStore from "../core/stores/gameStore";

import asyncStorage from "./asyncStorage";

const AXIOS_INSTANCE = axios.create({
  timeout: 15000,
});

const TIMEOUT_ERROR_CODE = "ECONNABORTED";

class API {
  static async getGameModal(requestData = {}) {
    const storageValues = await asyncStorage.getItems([
      "domainValue",
      "idGameValue",
      "cookiesValue",
    ]);

    const { domainValue, idGameValue } = storageValues;

    if (!domainValue || !idGameValue) {
      return {};
    }

    try {
      let response = await AXIOS_INSTANCE.request({
        url: `http://${domainValue}/gameengines/encounter/play/${idGameValue}`,
        method: "post",
        params: {
          json: 1,
          lang: "ru",
        },
        data: qs.stringify(requestData),
        withCredentials: true,
        maxRedirects: 0,
        headers: {
          "User-Agent": "EnApp by necto68",
        },
        onDownloadProgress: (progressEvent) => {
          gameStore.modelLoadingPercentages =
            (progressEvent.loaded / progressEvent.total) * 100;
        },
      });

      response = response.data;

      return response;
    } catch (e) {
      if (e.code && e.code !== TIMEOUT_ERROR_CODE) {
        Sentry.captureException(e);
      }

      throw e;
    }
  }

  static async getGameModelWithParams(requestData = {}) {
    const storageValues = await asyncStorage.getItems([
      "domainValue",
      "idGameValue",
      "cookiesValue",
    ]);

    const { domainValue, idGameValue } = storageValues;

    if (!domainValue || !idGameValue) {
      return {};
    }

    try {
      let response = await AXIOS_INSTANCE.request({
        url: `http://${domainValue}/gameengines/encounter/play/${idGameValue}`,
        method: "get",
        params: {
          json: 1,
          lang: "ru",
          ...requestData,
        },
        withCredentials: true,
        maxRedirects: 0,
        headers: {
          "User-Agent": "EnApp by necto68",
        },
      });

      response = response.data;

      return response;
    } catch (e) {
      return {};
    }
  }

  static async loginUser() {
    const storageValues = await asyncStorage.getItems([
      "domainValue",
      "loginValue",
      "passwordValue",
    ]);

    try {
      const response = await AXIOS_INSTANCE.request({
        url: `http://${storageValues.domainValue}/login/signin`,
        method: "post",
        params: {
          json: 1,
          lang: "ru",
        },
        data: {
          Login: storageValues.loginValue,
          Password: storageValues.passwordValue,
        },
        headers: {
          "User-Agent": "EnApp by necto68",
        },
      });

      return response.data;
    } catch (e) {
      if (e.code && e.code !== TIMEOUT_ERROR_CODE) {
        Sentry.captureException(e);
        Alert.alert(e.message);
      }

      return {
        Error: "INTERNAL",
        Message: e.message,
      };
    }
  }

  static async getDomainGames(domain) {
    try {
      const response = await AXIOS_INSTANCE.request({
        url: `http://m.${domain}/`,
        method: "get",
        headers: {
          "User-Agent": "EnApp by necto68",
        },
      });

      const $ = cheerio.load(response.data);
      const gamesArr = $("h1.gametitle a").map((i, link) => ({
        title: $(link).text(),
        gameId: parseInt(
          $(link)
            .attr("href")
            .match(/details\/(\d+)/)[1],
          10
        ),
      }));

      return [...gamesArr];
    } catch (e) {
      return [];
    }
  }

  static async getTimeoutToGame() {
    const { domainValue, idGameValue } = await asyncStorage.getItems([
      "domainValue",
      "idGameValue",
    ]);

    let response = await AXIOS_INSTANCE.request({
      url: `http://m.${domainValue}/gameengines/encounter/play/${idGameValue}`,
      method: "get",
      params: {
        lang: "ru",
      },
      withCredentials: true,
      maxRedirects: 0,
      headers: {
        "User-Agent": "EnApp by necto68",
      },
    });

    response = response.data;

    let startCounter = response.match(/"StartCounter":(\d+),/);
    startCounter = startCounter ? parseInt(startCounter[1], 10) : null;

    return startCounter;
  }
}

export default API;
