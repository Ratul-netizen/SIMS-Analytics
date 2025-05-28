#!/bin/sh
set -e

# Populate the database
flask fetch-exa

# Start the Flask server
flask run --host=0.0.0.0 --port=5000 