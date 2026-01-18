# JoyJuncture - Playful E-Commerce Platform

JoyJuncture is a modern, dynamic e-commerce platform designed for gamers and creators. It features a seamless shopping experience for board games, card games, and digital assets, integrated with a robust loyalty system and secure payments.

## 🚀 Features

*   **🛒 E-Commerce Store:** Browse and purchase games and merchandise.
*   **💳 Secure Checkout:** Integrated **Razorpay** payment gateway for secure transactions.
*   **🎟️ Coupon System:** Apply promotional codes for discounts (Percentage & Fixed).
*   **👛 Wallet & Loyalty Points:** Earn points for purchases, daily logins, and referrals. Redeem points for rewards.
*   **🔐 Authentication:** Secure user authentication using **Firebase Auth** (Google Login & Email/Password).
*   **🛡️ Admin Dashboard:** Manage products, orders, coupons, and users.
*   **📱 Responsive Design:** Built with **Tailwind CSS** for a fully responsive mobile-first experience.
*   **⚡ High Performance:** Powered by **Next.js 16** (App Router) and **Turbopack**.
*   **✨ Immersive Animations:** Scroll-based animations in Events and Community pages for dynamic storytelling.
*   **📅 Events Hub:** Discover and book upcoming gaming events and tournaments.
*   **👥 Community Hub:** Connect with other gamers, join discussions, and build your network.
*   **🎉 Experiences & Packages:** Plan custom events, birthday parties, and exclusive gaming packages.
*   **📰 Blog:** Read the latest news, events coverage, and game reviews.
*   **👤 User Profile:** Comprehensive dashboard for managing account details, order history, and preferences.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 16, React 19, Tailwind CSS, Framer Motion, Lucide React
*   **Backend:** Next.js API Routes (Serverless)
*   **Database:** MongoDB (via Mongoose)
*   **Authentication:** Firebase Auth & Firebase Admin SDK
*   **Payments:** Razorpay
*   **Media:** Cloudinary (Image management)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/joy_juncture_gwoc.git
    cd joy_juncture_gwoc
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # MongoDB
    MONGODB_URI=your_mongodb_connection_string

    # Firebase Client (Public)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Firebase Admin (Server)
    # Option 1: Service Account JSON String
    FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_json_string
    # Option 2: Individual Credentials
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_client_email
    FIREBASE_PRIVATE_KEY=your_private_key

    # Razorpay
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret

    # Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # NextAuth (Optional/Legacy)
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_secret_key
    ```

4.  **Initialize Admin User:**
    Run the admin initialization script to create a default admin account (if configured):
    ```bash
    npm run init-admin
    ```

## 🏃‍♂️ Running the Project

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

*   `app/`: Next.js App Router pages and API routes.
    *   `(public)`: Public-facing pages (Home, Shop, Cart, Checkout, Privacy).
    *   `admin/`: Admin dashboard pages.
    *   `api/`: Backend API endpoints (Auth, Wallet, Coupons, Orders).
*   `components/`: Reusable UI components (Navbar, Footer, Product cards).
*   `lib/`: Utility functions and configuration (MongoDB, Firebase, Helpers).
*   `models/`: Mongoose database models (User, Product, Order, Coupon).
*   `contexts/`: React Context providers (AuthContext, CartContext).

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## 📄 License

This project is licensed under the MIT License.
