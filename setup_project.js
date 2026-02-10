const fs = require("fs");
const path = require("path");
const https = require("https");

// 1. Generate Ruko (The SVG Vector Robot)
const rukoSVG = `
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Antenna -->
  <line x1="100" y1="20" x2="100" y2="50" stroke="#333" stroke-width="4"/>
  <circle cx="100" cy="20" r="8" fill="#FF5252"/>

  <!-- Body (Orange Cute Shape) -->
  <rect x="40" y="50" width="120" height="100" rx="30" fill="#FFB74D" stroke="#E65100" stroke-width="4"/>

  <!-- Screen/Face (Dark Blue) -->
  <rect x="60" y="70" width="80" height="50" rx="10" fill="#263238"/>

  <!-- Eyes (Happy Default - These can be animated later) -->
  <circle cx="80" cy="90" r="6" fill="#4FC3F7"/>
  <circle cx="120" cy="90" r="6" fill="#4FC3F7"/>

  <!-- Mouth (Smile) -->
  <path d="M 85 105 Q 100 115 115 105" stroke="#4FC3F7" stroke-width="3" fill="none"/>

  <!-- Arms -->
  <path d="M 40 100 Q 20 100 20 80" stroke="#E65100" stroke-width="8" stroke-linecap="round"/>
  <path d="M 160 100 Q 180 100 180 80" stroke="#E65100" stroke-width="8" stroke-linecap="round"/>
</svg>
`;

// Save Ruko
const rukoPath = path.join(
  __dirname,
  "assets/images/ruko-states/ruko_base.svg",
);
fs.writeFileSync(rukoPath, rukoSVG);
console.log("🤖 Ruko has been drawn and saved as SVG!");

// 2. Download Better Sounds
const sounds = [
  {
    url: "https://raw.githubusercontent.com/kurtextrem/react-native-gamify/master/example/assets/sounds/pop.mp3",
    path: "assets/audio/sfx/pop.mp3",
  },
  {
    url: "https://raw.githubusercontent.com/simonpanrucker/sp-sound-library/master/sounds/interface/correct_01.mp3",
    path: "assets/audio/sfx/correct.mp3",
  },
  {
    url: "https://raw.githubusercontent.com/simonpanrucker/sp-sound-library/master/sounds/interface/error_01.mp3",
    path: "assets/audio/sfx/wrong.mp3",
  },
  {
    url: "https://raw.githubusercontent.com/simonpanrucker/sp-sound-library/master/sounds/interface/level_up_01.mp3",
    path: "assets/audio/sfx/levelup.mp3",
  },
];

const downloadFile = (url, dest) => {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`🔊 Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    });
  });
};

const run = async () => {
  for (const sound of sounds) {
    await downloadFile(sound.url, path.join(__dirname, sound.path));
  }
  console.log("✅ Assets Updated!");
};

run();
