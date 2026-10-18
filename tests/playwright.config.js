// Tests de l'appli sur un iPhone (moteur Safari) et un Android (Chrome), lancés par GitHub à chaque envoi
const { devices } = require("@playwright/test");
module.exports = {
  testDir: ".", timeout: 90000, retries: 1, workers: 2,
  reporter: [["list"], ["json", { outputFile: "resultats.json" }]],
  use: { baseURL: "http://127.0.0.1:8080/", screenshot: "only-on-failure", trace: "off" },
  webServer: { command: "python3 -m http.server 8080 --directory ..", url: "http://127.0.0.1:8080/index.html", reuseExistingServer: true, stdout: "ignore", stderr: "ignore" },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 12"] } },
    { name: "android", use: { ...devices["Pixel 5"], launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {} } }
  ]
};
