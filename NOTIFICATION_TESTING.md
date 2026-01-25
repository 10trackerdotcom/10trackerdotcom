# Notification Testing Guide

## Quick Testing Steps

### 1. Reset the Banner (if you dismissed it)

**Option A: Using the Test Helper (Development Mode)**
- Look for the purple "🔔 Test Notifications" button in the top-right corner
- Click it to open the test panel
- Click "Reset Banner (for testing)"
- Refresh the page

**Option B: Using Browser Console**
```javascript
localStorage.removeItem('notification-banner-dismissed');
location.reload();
```

**Option C: Clear All Browser Data**
- Open browser DevTools (F12)
- Go to Application tab → Storage → Clear site data
- Refresh the page

### 2. Test the Enable Button

1. Wait for the banner to appear (appears after 2 seconds)
2. Click "Enable Notifications"
3. **Check your browser's permission prompt** - it should appear!
4. Click "Allow" in the browser prompt
5. Check the browser console for logs

### 3. Verify It's Working

After clicking "Enable Notifications", check:

**Browser Console Logs:**
- ✅ "Requesting notification permission..."
- ✅ "Permission result: granted"
- ✅ "Permission granted! Setting up FCM..."
- ✅ "Service Worker registered successfully"
- ✅ "FCM Token obtained successfully"
- ✅ "FCM Token: [your-token-here]"

**Visual Indicators:**
- Banner should disappear
- Navbar bell icon should turn blue (if enabled)
- No errors in console

### 4. Common Issues & Solutions

#### Issue: "Nothing happens when I click Enable"
**Solution:**
- Check browser console for errors
- Make sure `NEXT_PUBLIC_FCM_VAPID_KEY` is set in `.env.local`
- Verify you're using HTTPS or localhost (notifications require secure context)
- Check if browser blocked the permission prompt (look for blocked icon in address bar)

#### Issue: "Permission prompt doesn't appear"
**Possible Causes:**
- Browser already has a permission set (check browser settings)
- Permission was previously denied (reset in browser settings)
- Not using HTTPS or localhost
- Browser doesn't support notifications

**Solution:**
- Reset browser notification permissions:
  - Chrome: Settings → Privacy and Security → Site Settings → Notifications → Find your site → Reset
  - Firefox: Settings → Privacy & Security → Permissions → Notifications → Settings → Remove your site
- Try in incognito/private mode
- Check browser console for errors

#### Issue: "Banner doesn't appear after refresh"
**Solution:**
- Check if you dismissed it (it's saved in localStorage)
- Use the test helper to reset it
- Or run: `localStorage.removeItem('notification-banner-dismissed')` in console

#### Issue: "Service Worker registration failed"
**Solution:**
- Make sure `public/firebase-messaging-sw.js` exists
- Check browser console for specific error
- Verify Firebase config in `firebase-messaging-sw.js` matches your project

#### Issue: "FCM Token not obtained"
**Solution:**
- Verify `NEXT_PUBLIC_FCM_VAPID_KEY` is correct
- Check Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
- Make sure VAPID key matches the one in your `.env.local`

### 5. Testing Checklist

- [ ] Banner appears after 2 seconds (if not dismissed)
- [ ] Clicking "Enable Notifications" shows browser permission prompt
- [ ] Clicking "Allow" in browser prompt works
- [ ] Banner disappears after enabling
- [ ] FCM token is generated and logged in console
- [ ] Token is saved to backend (check `/api/fcm/save-token` logs)
- [ ] Navbar bell icon shows enabled state
- [ ] "Reset Banner" button works (dev mode only)
- [ ] Dismissing banner prevents it from showing again
- [ ] Refreshing page doesn't show banner if already enabled

### 6. Manual Testing via Console

Open browser console (F12) and run:

```javascript
// Check current permission
console.log('Permission:', Notification.permission);

// Check if banner is dismissed
console.log('Banner dismissed:', localStorage.getItem('notification-banner-dismissed'));

// Reset banner
localStorage.removeItem('notification-banner-dismissed');
location.reload();

// Request permission manually
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

### 7. Environment Variables Required

Make sure these are set in `.env.local`:

```env
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key-here
```

Get your VAPID key from:
Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

### 8. Browser Compatibility

Notifications work on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS with limitations)
- ❌ Not supported in some older browsers

### 9. Debug Mode

In development mode, the banner shows:
- Current permission status
- Token status
- Loading state
- "Reset Banner" button for easy testing

---

## Still Having Issues?

1. **Check Browser Console** - Look for red error messages
2. **Check Network Tab** - Verify API calls to `/api/fcm/save-token` are successful
3. **Verify Firebase Config** - Make sure all Firebase config values are correct
4. **Test in Incognito** - Fresh browser state can help identify issues
5. **Check Service Worker** - Application tab → Service Workers → Check if registered
