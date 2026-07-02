/* Cooney Vacation Weather + Music Config
   Edit this file any time. No page-code changes needed.

   Required song filenames in /assets/audio/:
   - hot.mp3
   - rain.mp3
   - windy.mp3
   - perfect.mp3
   Optional extras:
   - cloudy.mp3
   - storm.mp3
   - cold.mp3
*/
window.COONEY_VACATION_CONFIG = {
  audioBasePath: "assets/audio/",
  defaultMood: "perfect",
  weatherSongs: {
    hot: {
      label: "Hot as Hell Mode",
      file: "hot.mp3",
      example: "Heat Wave"
    },
    rain: {
      label: "Rainy Day Mode",
      file: "rain.mp3",
      example: "Raindrops Keep Fallin' on My Head"
    },
    windy: {
      label: "Windy Mode",
      file: "windy.mp3",
      example: "Against the Wind"
    },
    perfect: {
      label: "Perfect Vacation Mode",
      file: "perfect.mp3",
      example: "Vacation / Good Vibes"
    },
    cloudy: {
      label: "Cloudy Mood Lighting Mode",
      file: "cloudy.mp3",
      example: "Ain't No Sunshine"
    },
    storm: {
      label: "Storm Drama Mode",
      file: "storm.mp3",
      example: "Riders on the Storm"
    },
    cold: {
      label: "Chilly Mode",
      file: "cold.mp3",
      example: "Cold as Ice"
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
