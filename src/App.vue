<template>
  <div id="app" class="container">
    <header class="row mt-5 mb-3">
      <div class="col-12">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            placeholder="City"
            aria-label="city"
            aria-describedby="button-addon2"
            v-model="city"
          />
        </div>
        <div
          class="suggestions border border-dark  rounded border-top-0"
          v-if="showSuggestions"
          v-click-outside="hide">
          <ul>
            <li
              v-for="(sug, i) in suggestions"
              :key="i"
              @click="populateCity(sug)">
              {{ sug.place_name }}
            </li>
          </ul>
        </div>
      </div>
    </header>
    <main class="container">
      <div class="row" v-if="showLoader">
        <div class="col-12 d-flex justify-content-center">
          <Loader />
        </div>
      </div>
      <template v-if="weather">
        <header class="d-flex">
          <button
            v-for="(tmp, i) in weather.ts"
            :key="i"
            :class="{ active: i === dateActive }"
            @click="dateActive = i">
            {{ parseDate(tmp) }}
          </button>
        </header>
        <section class="row title">
          <div class="col-12 d-flex align-items-center">
            <h1 class="fs-2">{{ weather.city }}</h1>
            <small class="text-info">{{ dateActiveParse }}</small>
          </div>
        </section>
        <section class="row data mt-5">
          <template v-for="(value, name) in weather">
            <section
              class="col-12 mb-5"
              v-if="!weatherKeysToExclude.includes(name)"
              :key="name">
              <div
                class="border-warning border-bottom title mb-3">
                <h2>{{ weatherKeys[name].value }}</h2>
              </div>
              <div class="content">
                <p>
                  {{ weatherKeys[name].content(weather[weatherKeys[name].model][dateActive]) }}
                </p>
              </div>
            </section>
          </template>
          <div></div>
        </section>
      </template>
    </main>
  </div>
</template>

<script>
import ClickOutside from 'vue-click-outside';
import axios from 'axios';

import Loader from './assets/loader.svg';

export default {
  name: 'App',
  directives: {
    ClickOutside,
  },
  components: {
    Loader,
  },
  data() {
    return {
      city: '',
      showSuggestions: false,
      dateActive: 0,
      weatherKeysToExclude: ['units', 'city', 'warning', 'ts'],
      weatherKeys: {
        'temp-surface': {
          value: 'Température',
          model: 'temp-surface',
          content(ts) {
            const celsius = ts - 273.15;
            return `Température de l'air ${Math.round(celsius)}°`;
          },
        },
        'pressure-surface': {
          value: 'Pression de l\'air',
          model: 'pressure-surface',
          content(ts) {
            const hpa = ts / 100;
            return `Pression de l'air ${Math.round(hpa)} en HPA`;
          },
        },
        'wind_u-surface': {
          value: 'Vitesse du vent (Ouest -> Est)',
          model: 'wind_u-surface',
          content(ts) {
            if (!ts) return '';
            return `Vitesse du vent ${Math.round(ts * 100) / 100}km/h`;
          },
        },
        'wind_v-surface': {
          value: 'Vitesse du vent (Sud -> Nord)',
          model: 'wind_v-surface',
          content(ts) {
            if (!ts) return '';
            return `Vitesse du vent ${Math.round(ts * 100) / 100}km/h`;
          },
        },
        'waves_direction-surface': {
          value: 'Vagues - direction',
          model: 'waves_direction-surface',
          content(ts) {
            if (!ts) return '';
            return `La direction d'ou les vagues viennent ${Math.round(ts * 100) / 100}deg`;
          },
        },
        'waves_height-surface': {
          value: 'Vagues - hauteur',
          model: 'waves_height-surface',
          content(ts) {
            if (!ts) return '';
            return `Hauteur des vagues ${Math.round(ts * 100) / 100}m`;
          },
        },
        'waves_period-surface': {
          value: 'Vagues - période',
          model: 'waves_period-surface',
          content(ts) {
            if (!ts) return '';
            return `l'intervalle de temps entre l'arrivée de crêtes consécutives à un point stationnaire ${Math.round(ts * 100) / 100}s`;
          },
        },
      },
      showLoader: false,
      suggestions: [],
      weather: null,
      dataToPost: {
        lat: 0,
        long: 0,
      },
    };
  },
  computed: {
    dateActiveParse() {
      const dateInstancied = new Date(this.weather.ts[this.dateActive]);
      return `${dateInstancied.getHours()}H:${dateInstancied.getMinutes()}`;
    },
  },
  methods: {
    parseDate(date) {
      const dateInstancied = new Date(date);

      return `${dateInstancied.getDate()}/${dateInstancied.getMonth() + 1}/${dateInstancied.getFullYear()} - ${dateInstancied.getHours()}h:${dateInstancied.getMinutes()}mn`;
    },
    async populateCity(cityData) {
      this.showSuggestions = false;
      this.showLoader = true;
      this.dataToPost.lat = cityData.center[1];
      this.dataToPost.long = cityData.center[0];
      this.suggestions = [];
      this.city = cityData.place_name;

      try {
        const mockup = {
          lat: this.dataToPost.lat,
          lon: this.dataToPost.long,
          key: process.env.VUE_APP_KEY,
        };

        const gfs = await axios.post('https://api.windy.com/api/point-forecast/v2', {
          ...mockup,
          parameters: ['temp', 'pressure', 'wind'],
          model: 'gfs',
        });
        const gfsWave = await axios.post('https://api.windy.com/api/point-forecast/v2', {
          ...mockup,
          parameters: ['waves'],
          model: 'gfsWave',
        });
        this.weather = {
          ...gfs.data,
          ...gfsWave.data,
        };
        this.weather.city = this.city;
        this.showLoader = false;
      } catch (error) {
        console.error(error.message);
      }
    },
    hide() {
      this.showSuggestions = false;
    },
  },
  watch: {
    async city() {
      if (!this.city.length) {
        if (this.suggestions.length) this.suggestions = [];
        if (this.showSuggestions) this.showSuggestions = false;
        return;
      }

      try {
        const { data } = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.city}.json?access_token=${process.env.VUE_APP_MAPBOX}`,
        );

        if (this.dataToPost.lat || this.dataToPost.long) {
          this.dataToPost.lat = 0;
          this.dataToPost.long = 0;
          this.suggestions = false;
          return;
        }

        this.suggestions = data.features;
        this.showSuggestions = true;
      } catch (error) {
        console.error(error.message);
      }
    },
  },
};
</script>

<style lang="scss">
#app {
  header {
    div:first-child {
      height: 7vh;
    }

    .suggestions {
      padding: 12px;
      z-index: 10;
      position: relative;
      background-color: #fff;

      ul {
        padding-left: 0px;
        list-style-type: none;

        li {
          margin-bottom: 8px;
          padding: 6px 0;
        }

        li:hover {
          cursor: pointer;
          background-color: #eee;
        }
      }
    }

    .vc-container {
      position: absolute;
      right: 0;
      top: 70px;
    }
  }

  main {
    header {
      height: 6vh;
      align-items: flex-start;
      overflow: auto;

      button {
        flex: 0 0 auto;
        font-size: 12px;
        font-weight: 500;
        line-height: 18px;
        border: 1px solid transparent;
        border-radius: 2em;
        padding: 0 10px;
        margin: 0 1.125em .333em 0;
        line-height: 22px;
        color: #0366d6;
        opacity: 0.6;
        background-color: #f1f8ff;
      }

      .active {
        color: #0366d6;
        opacity: 1;
      }
    }

    .title {
      h1 {
        margin-right: 8px;
      }
    }

    .data {
      div {
        h2  {
          font-size: 4em;
        }
      }
    }
  }
}
</style>
