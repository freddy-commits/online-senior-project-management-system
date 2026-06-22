import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: false,
    defaultCommandTimeout: 60000,
    pageLoadTimeout: 120000,
    requestTimeout: 60000,
    responseTimeout: 60000,
  },
})
