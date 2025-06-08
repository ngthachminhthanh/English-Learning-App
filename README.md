# 📱 Engdigo (English Learning Application) with NestJS Backend and React Native Frontend

This project is composed of:

- `backend/`: A NestJS-based REST API server and C# ASP.NET framework.
- `mobile/`: A mobile application built with React Native using Expo.

This guide walks you through setting up and running both components of the project.

---

## 📦 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [ngrok](https://ngrok.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): Install via `npm install -g expo-cli`
- (Optional) Android Studio or a physical device with the **Expo Go** app

---

## 🔧 Backend Setup (NestJS)

You can run the backend using **Docker (recommended)** or install and run it manually.

---

### 🛠 Option 1: Run with Docker (Recommended)

1. **Install Docker**

   - **macOS**: https://docs.docker.com/docker-for-mac/install/
   - **Windows**: https://docs.docker.com/docker-for-windows/install/
   - **Linux**: Use your package manager (e.g., `sudo apt install docker.io`)

2. **Create a `.env` file** in the `backend/` directory, here is example:

   ```env.example
   DOCKER_HUB_USERNAME=your_dockerhub_username
   DATABASE_HOST=your_database_host
   DATABASE_NAME=your_database_name
   DATABASE_USERNAME=your_database_username
   DATABASE_PASSWORD=your_database_password
   DATABASE_PORT=5432
   AWS_BUCKET_NAME=your_aws_bucket_name
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   CLOUDFRONT_URL=https://your_cloudfront_url
   CLIENT_URL=http://localhost:8000
   COGNITO_USER_POOL_ID=your_cognito_user_pool_id
   COGNITO_CLIENT_ID=your_cognito_client_id
   COGNITO_CLIENT_SECRET=your_cognito_client_secret
   COGNITO_CLIENT=https://cognito-idp.your_region.amazonaws.com/your_user_pool_id
   COGNITO_DOMAIN=https://your_cognito_domain.auth.your_region.amazoncognito.com
   VNP_RETURN_URL=http://localhost:3000/api/course-buying/payment-return
   VNP_TMN_CODE=your_vnpay_tmn_code
   VNP_HASH_SECRET=your_vnpay_hash_secret
   VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

   ```

   **_Ensure your Dockerfile and docker-compose.yml are ready._**

**Build and start the containers:**

```
cd backend
docker-compose up --build
```

Your backend should now be accessible at http://localhost:3000.

### 🛠 Option 2: Manual Setup without Docker

Create a `.env` file in `backend/` directory (see example above).

**Install dependencies:**

```
cd backend
npm install
```

**Run Nestjs server:**

```
npm start
```

**Go to DiscountService (where include DiscountService.csproj) and run ASP.NET server:**

```
cd backend\src\services\DiscountService
dotnet run
```

Nest server will start at http://localhost:3000
ASP.NET server will start at http://localhost:5000

## 📱 Frontend Setup (React Native using Expo)

The mobile app communicates with the backend and can be run on a phone or emulator.

### Expose Backend to the Internet using ngrok

Open a new terminal and run:

```
npx ngrok http 3000
```

Copy the Forwarding URL, e.g.: https://abcd1234.ngrok.app

In the `mobile/` directory, create or update your `.env` file follow this:

```
API_URL=https://abcd1234.ngrok.app/api/
ACCESS_TOKEN=your_access_token
```

### Install Mobile App Dependencies

```
cd mobile
npm install
```

### Run the Mobile App

### Option A: Run on Physical Device using `Expo Go`

Start the Expo server:

```
cd mobile
npx expo start -c
```

Press `S` to start the QR code mode.

Open the Expo Go app on your smartphone and scan the QR code.

Download Expo Go:

- iOS: https://expo.dev/go?sdkVersion=52

- Android: https://expo.dev/go?sdkVersion=52

### Option B: Run on Android Emulator

Install Android Studio: Download here https://developer.android.com/studio

Launch Android Studio → AVD Manager → Create & Start Emulator

In your terminal:

```
cd mobile
npx expo start -c
```

Press `A` to launch the app in the Android emulator.

## 📌 Important Notes

- Ensure the `API_URL` in `mobile/.env` matches the ngrok URL.

- Restart ngrok and update the `.env` file whenever your ngrok URL changes.

## 🛠 Troubleshooting

Mobile app can't reach backend:

- Ensure ngrok is running and the `API_URL` is correctly set.

- Make sure CORS is enabled in the backend if needed.

Emulator issues:

- Ensure virtualization is enabled (BIOS).

- Restart Android Studio or your computer.

## 📬 Contact

For support, reach out to: **[ngthachminhthanh@gmail.com]**
