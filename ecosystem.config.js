module.exports = {
  apps: [
    {
      name: "api",
      script: "server.js",       
      env: {
        NODE_ENV: "production",
        PORT: "4000"
      }
    }
  ]
}