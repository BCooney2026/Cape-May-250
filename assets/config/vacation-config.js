/* Cooney Vacation Weather + Music Config - v23
   This version matches the audio files Brian uploaded as M4A files.

   Song filenames live in /assets/audio/.
   Use lowercase, hyphenated filenames:
   hot-1.m4a, rain-2.m4a, storm-3.m4a, etc.

   You can use ANY number of songs per category.
   Add/remove tracks by editing the tracks arrays below.
   The app randomly picks one track and will not repeat the same file
   back-to-back when that category has more than one track.
*/
window.COONEY_VACATION_CONFIG = {
  audioBasePath: "assets/audio/",
  defaultMood: "perfect",
  weatherSongs: {
    hot: {
      label: "Hot as Hell Mode",
      tracks: [
        { file: "hot-1.m4a", title: "Heat Wave", artist: "Martha and the Vandellas" },
        { file: "hot-2.m4a", title: "Hot Stuff", artist: "Donna Summer" },
        { file: "hot-3.m4a", title: "The Heat Is On", artist: "Glenn Frey" }
      ]
    },
    rain: {
      label: "Rainy Day Mode",
      tracks: [
        { file: "rain-1.m4a", title: "Raindrops Keep Fallin' on My Head", artist: "B. J. Thomas" },
        { file: "rain-2.m4a", title: "Have You Ever Seen the Rain", artist: "Creedence Clearwater Revival" },
        { file: "rain-3.m4a", title: "I Love a Rainy Night", artist: "Eddie Rabbitt" }
      ]
    },
    windy: {
      label: "Windy Mode",
      tracks: [
        { file: "windy-1.m4a", title: "Against the Wind", artist: "Bob Seger" },
        { file: "windy-2.m4a", title: "Windy", artist: "The Association" },
        { file: "windy-3.m4a", title: "Ride Like the Wind", artist: "Christopher Cross" }
      ]
    },
    perfect: {
      label: "Perfect Vacation Mode",
      tracks: [
        { file: "perfect-1.m4a", title: "Vacation", artist: "The Go-Go's" },
        { file: "perfect-2.m4a", title: "Lovely Day", artist: "Bill Withers" },
        { file: "perfect-3.m4a", title: "Good Vibrations", artist: "The Beach Boys" },
        { file: "perfect-4.m4a", title: "Here Comes the Sun", artist: "The Beatles" }
      ]
    },
    cloudy: {
      label: "Cloudy Mood Lighting Mode",
      tracks: [
        { file: "cloudy-1.m4a", title: "Ain't No Sunshine", artist: "Bill Withers" },
        { file: "cloudy-2.m4a", title: "Cloudy", artist: "Simon & Garfunkel" },
        { file: "cloudy-3.m4a", title: "No Rain", artist: "Blind Melon" }
      ]
    },
    storm: {
      label: "Storm Drama Mode",
      tracks: [
        { file: "storm-1.m4a", title: "Thunderstruck", artist: "AC/DC" },
        { file: "storm-2.m4a", title: "Riders on the Storm", artist: "The Doors" },
        { file: "storm-3.m4a", title: "Rock You Like a Hurricane", artist: "Scorpions" }
      ]
    },
    cold: {
      label: "Chilly Mode",
      tracks: [
        { file: "cold-1.m4a", title: "Cold as Ice", artist: "Foreigner" },
        { file: "cold-2.m4a", title: "Ice Ice Baby", artist: "Vanilla Ice" },
        { file: "cold-3.m4a", title: "Sweater Weather", artist: "The Neighbourhood" }
      ]
    }
  },
  locations: {
    "cape_may.html": { name: "Cape May", latitude: 38.9351, longitude: -74.9060 },
    "daily_plans.html": { name: "Cape May", latitude: 38.9351, longitude: -74.9060 },
    "avalon.html": { name: "Avalon", latitude: 39.1012, longitude: -74.7177 },
    "atlantic_city.html": { name: "Atlantic City", latitude: 39.3643, longitude: -74.4229 },
    "index.html": { name: "Jersey Shore", latitude: 39.1012, longitude: -74.7177 }
  },
  quips: {
    hot: [
      "Hot enough to make the sidewalk ask for PTO.",
      "The sun woke up and chose violence.",
      "Hydrate like you owe your liver an apology.",
      "This is not weather. This is a toaster with scenery.",
      "Old enough to know better, hot enough to not care."
    ],
    rain: [
      "Rain in the forecast because apparently the sky needed attention.",
      "Bring an umbrella unless you enjoy looking like a wet hoagie.",
      "The clouds are being dramatic little bastards.",
      "Good day to drink indoors and call it culture.",
      "Weather says: cute outfit, shame if something happened to it."
    ],
    windy: [
      "Windy enough to expose every bad hair decision.",
      "Secure the napkins, hats, and Brian's patience.",
      "A light breeze with main-character energy.",
      "If your drink has a garnish, say goodbye now.",
      "Nature turned on the leaf blower."
    ],
    perfect: [
      "This weather is suspiciously perfect. Do not question it.",
      "Vacation weather has entered the chat.",
      "The sky understood the assignment.",
      "Not too hot, not too cold, just right for poor decisions.",
      "Old enough to know better, nice enough to ignore responsibility."
    ],
    cloudy: [
      "Cloudy, but in a sexy mood-lighting kind of way.",
      "The sun is taking a union break.",
      "Less squinting, more sipping.",
      "The sky is wearing sweatpants today.",
      "Clouds showed up, but they are not ruining the trip."
    ],
    storm: [
      "The sky is throwing furniture. Stay flexible.",
      "Storm drama detected. Find shelter with a bar program.",
      "This is weather with a grudge.",
      "Plan B is not failure. Plan B is cocktails under a roof.",
      "Thunder heard there was a vacation and got jealous."
    ],
    cold: [
      "A little chilly, but nobody packed emotional support fleece for nothing.",
      "Cold enough to make beach chairs question their purpose.",
      "Layer up and act like this was the plan.",
      "Not freezing, just aggressively refreshing.",
      "The weather is giving iced coffee in a sweatshirt."
    ]
  }
};
