/**
 * PM2 production config
 * Run: pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [{
    name: 'portfolio',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'development' },
    env_production: { NODE_ENV: 'production' }
  }]
};
