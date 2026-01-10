# FCM Integration - Quick Start Checklist

## ✅ Files Created
All necessary files have been created. You just need to configure and install.

## 📋 Setup Checklist

### 1. Get Firebase Keys (5 minutes)
- [ ] Go to Firebase Console → Project Settings → Cloud Messaging
- [ ] Generate/copy **VAPID Key** (Web Push Certificate)
- [ ] Copy **Server Key** (Legacy API) or generate Service Account JSON

### 2. Environment Variables (2 minutes)
- [ ] Create/update `.env.local` file
- [ ] Add `NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key`
- [ ] Add `FCM_SERVER_KEY=your-server-key`

### 3. Install Packages (if needed)
- [ ] `firebase` ✅ Already installed
- [ ] `firebase-admin` (optional, for server-side sending with service account)

### 4. Database Setup (Optional)
- [ ] Create `fcm_tokens` table/collection
- [ ] Update API routes to save/delete tokens

### 5. Test
- [ ] Start dev server: `npm run dev`
- [ ] Check browser console for service worker registration
- [ ] Test notification permission request
- [ ] Test sending a notification

## 🔑 Key Files Location

- **Firebase Config**: `src/app/firebase/firebase.js`
- **Service Worker**: `public/firebase-messaging-sw.js`
- **FCM Utilities**: `src/lib/fcm.js`
- **Provider Component**: `src/components/FCMNotificationProvider.js`
- **API Routes**: `src/app/api/fcm/`

## 📚 Full Documentation
See `FCM_SETUP_GUIDE.md` for detailed instructions.

