<template>
  <div id="app" class="container">
    <header class="row mt-5 mb-5">
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
          <button
            class="btn btn-outline-secondary"
            type="button"
            id="button-addon2"
            @click="showDate = !showDate"
          >
            {{ date }}
          </button>
          <vc-calendar v-if="showDate" @dayclick="populateDate"></vc-calendar>
        </div>
        <div class="suggestions border border-dark  rounded border-top-0" v-if="showSuggestions">
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
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      city: '',
      date: 'Date',
      showSuggestions: false,
      showDate: false,
      suggestions: [],
      dataToPost: {},
    };
  },
  methods: {
    populateDate(data) {
      this.dataToPost.date = data.date;
      this.showDate = false;
    },
    populateCity(cityData) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.city = cityData.place_name;
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
}
</style>
