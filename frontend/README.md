🌍 WorldWise — Geospatial Travel Tracker
WorldWise is a full-stack web application that allows users to log, manage, and visualize their personal travel experiences across an interactive world map. By selecting locations directly on the map, users can log visited cities, attach trip notes, and keep track of their global travel history.

✨ Key Features
Interactive Mapping: Drop interactive pins using Leaflet maps to record visited locations.

Geospatial Logging: Automatically resolves map coordinates into city and country metadata.

Dual-Layer Authentication: Secure JWT-based access control with Express 5 middleware alongside Google OAuth integration.

Geospatial Indexing: Optimized backend database queries using MongoDB 2dsphere spatial indexes.

RESTful Architecture: Decoupled client-server setup with dedicated resource routes for users and cities.

🛠️ Tech Stack
Frontend: React, Context API, Leaflet API, CSS / Tailwind CSS

Backend: Node.js, Express.js (v5), JWT, google-auth-library

Database: MongoDB & Mongoose ORM (2dsphere indexing)
