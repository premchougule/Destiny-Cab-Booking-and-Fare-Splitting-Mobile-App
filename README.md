# Destiny

**Destiny** is a cross-platform cab-booking and ride-sharing mobile app. It helps people find and share rides, coordinate pickup and destination details, and make travel more affordable.

> **Project status:** The current app is an Expo/React Native prototype. User accounts and ride listings are stored locally on the device with AsyncStorage. The Express.js API and MongoDB design below is a proposed next step, not a backend that is already included in this repository.

## Features

- Sign up and sign in flows with basic form validation.
- Create ride listings with vehicle, available seats, fare per seat, route, departure time, and notes.
- Browse and search ride listings by route and other criteria, with filters and sorting.
- Store profile and ride data locally using AsyncStorage.
- Responsive interface built for mobile and web through Expo.

The current app does not yet provide shared cloud accounts, live GPS route matching, payments, or server-backed fare settlement. Those are potential future improvements.

## Tech stack

### Current app

- React Native and JavaScript
- Expo SDK 53 and Expo Router
- AsyncStorage for on-device persistence

### Proposed backend

- Node.js and Express.js for a REST API
- MongoDB with Mongoose for persistent application data
- JWT-based authentication, with passwords hashed using bcrypt

The proposed backend technologies are not installed or configured in the current app.

## Getting started

### Prerequisites

- Node.js (LTS recommended) and npm
- Expo Go for device testing, or an Android/iOS emulator

### Install and run

```bash
npm install
npm start
```

In the Expo terminal, use the displayed options to open the app in Expo Go, an emulator, or a browser. You can also run a platform directly:

```bash
npm run android
npm run ios
npm run web
```

## Proposed Express.js and MongoDB plan

Build the backend as a separate service (for example, in a `server/` directory or its own repository), then connect the mobile app to it through an environment-configured API base URL.

### Suggested API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Authenticate and return an access token |
| `GET` | `/api/users/me` | Read the signed-in user's profile |
| `POST` | `/api/rides` | Publish a ride |
| `GET` | `/api/rides` | Search rides by origin, destination, date, and seats |
| `GET` | `/api/rides/:id` | View ride details |
| `POST` | `/api/rides/:id/bookings` | Request or confirm seats |
| `PATCH` | `/api/rides/:id/bookings/:bookingId` | Update or cancel a booking |

Protect account and booking routes with authentication, validate all request bodies, and authorize users before allowing changes to their own rides or bookings.

### Suggested MongoDB collections

- **Users:** name, normalized email, password hash, phone (optional), and timestamps.
- **Rides:** driver ID, origin and destination (including coordinates when available), departure time, vehicle details, available seats, fare, status, and timestamps.
- **Bookings:** ride ID, passenger ID, number of seats, fare share, booking status, and timestamps.

Reference users by ID rather than embedding credentials or duplicating profile data. Add indexes for common ride searches such as departure time, status, and origin/destination coordinates.

### Route matching and fare splitting

1. Start with matching rides by pickup, destination, departure window, and available seats.
2. Add coordinate-based proximity and route overlap when a mapping/geocoding provider is selected.
3. Calculate a booking's share from the ride fare and confirmed seats, and persist the amount when a booking is confirmed.
4. Define whether fares are per seat or for the whole ride before implementing split calculations. Store amounts in the smallest currency unit and handle any rounding remainder deterministically.
5. Use atomic database updates or transactions when confirming bookings so two passengers cannot reserve the same final seat.

### Backend implementation sequence

1. Create the Express service, configuration, health check, and MongoDB connection.
2. Add validated user registration and login with hashed passwords and token-based authentication.
3. Implement ride creation, search, and ownership checks.
4. Add booking workflows, seat availability safeguards, and fare-split calculations.
5. Replace the app's local user and ride persistence with API calls; keep secrets and database credentials on the server.
6. Add automated tests, request logging, rate limiting, and deployment configuration.

## Development notes

- App routes are defined under `app/` using Expo Router.
- Authentication screens are under `app/auth/`; the main tab screens are under `app/(tabs)/`.
- The current local-storage implementation is suitable for a prototype, not multi-device synchronization or production authentication.
- Do not commit credentials, signing keys, or production environment files.
