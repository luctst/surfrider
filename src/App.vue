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
            <div
              v-if="!weatherKeysToExclude.includes(name)"
              :key="name"
              class="mb-5 border-warning border-bottom">
              <h2>{{ name }}</h2>
            </div>
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
        const { data } = await axios.post('https://api.windy.com/api/point-forecast/v2', {
          lat: this.dataToPost.lat,
          lon: this.dataToPost.long,
          parameters: ['temp', 'pressure', 'wind'],
          model: 'gfs',
          key: process.env.VUE_APP_KEY,
        });
        this.weather = data;
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
