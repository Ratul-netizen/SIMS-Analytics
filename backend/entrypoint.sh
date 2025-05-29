#!/bin/sh
set -e

# Remove old DB for a clean start every time (for development/testing)
rm -f /app/instance/SIMS_Analytics.db

# Run database migrations
flask db upgrade

# Populate the database (optional, if you want to fetch data on startup)
flask fetch-exa

# Start the Flask server
flask run --host=0.0.0.0 --port=5000 