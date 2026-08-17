module.exports = {
  apps: [
    {
      name: 'bookbridge',
      // FIX: was pointing to dist/server.js (TypeScript build) — now points to actual server
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log'
    }
  ]
};
