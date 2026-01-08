@echo off
start cmd /k "cd server && npm run start"
start cmd /k "npm run dev"
start "" http://localhost:8080/
