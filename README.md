# Bus Dravin

A simple tool that turns your school bus stop list into a full turn-by-turn
driving route in Google Maps — one tap, no retyping addresses into Maps
by hand.

Everything you type stays on your own phone or computer. Nothing is sent
to a server. The only outside connection happens when you tap "Open Route
in Google Maps," which hands your stop list to Google Maps to draw the
route.

---

## What it does

1. You paste or type your list of stops, in driving order.
2. You check/fix the order with simple up/down arrows.
3. You tap **Open Route in Google Maps**.
4. Google Maps opens in a new tab with driving directions — every turn
   and every stop shown, in order.

You can also save a route (like "AM Route" or "PM Route") so you never
have to retype it — just load it and go.

---

## Install it on your phone (so it acts like a real app)

### iPhone (Safari)
1. Open the app's web address in **Safari**.
2. Tap the **Share** button (square with an arrow).
3. Tap **Add to Home Screen**.
4. Tap **Add**.

### Android (Chrome)
1. Open the app's web address in **Chrome**.
2. Tap the **⋮** menu (top right).
3. Tap **Add to Home screen** (or **Install app**).
4. Tap **Add** / **Install**.

Once installed, it opens full-screen with its own icon — no browser bar.

> **Note:** to install it on your phone, the app needs to be hosted
> somewhere your phone can reach (a website address), not just opened as
> a file on your computer. See "Hosting it for free" below.

---

## Hosting it for free (GitHub Pages)

This turns the app into a real web address you can open from your phone.

1. On GitHub, go to this repository.
2. Click **Settings** (top menu of the repo).
3. In the left sidebar, click **Pages**.
4. Under "Build and deployment," set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` (or whichever branch has these files) and
   folder to `/ (root)`. Click **Save**.
6. Wait a minute, then refresh the page — GitHub will show your live web
   address at the top (something like
   `https://your-username.github.io/Bus-Dravin/`).
7. Open that address on your phone and follow the "Install it on your
   phone" steps above.

---

## How to use it

### 1. Add your stops
- **Paste a whole list at once:** paste your stops into the big box, one
  address per line, then tap **Add Pasted Stops**.
- **Add one stop at a time:** type an address in the smaller box and tap
  **Add** (or press Enter).

### 2. Check the order
- The first stop is where the route starts. The last stop is where it
  ends. Both are labelled so it's clear at a glance.
- Use the **↑** / **↓** buttons to move a stop.
- Use the **✕** button to remove a stop.

### 3. Save the route (optional, but recommended)
- Type a name like `AM Route` and tap **Save Route**.
- Next time, pick it from the dropdown at the top and tap **Load** —
  no retyping.

### 4. Open it
- Tap **Open Route in Google Maps**.
- Google Maps opens in a new tab (or the Google Maps app, if installed)
  with driving directions through every stop, in order.

---

## Routes with a lot of stops

Google Maps' route links can only hold 25 stops at a time (start + end +
waypoints). If your route has more than that, Bus Dravin automatically
splits it into multiple linked parts and opens each as its own tab —
for example, "Part 1" ending exactly where "Part 2" begins, so there's
no gap in the drive. The status message at the bottom tells you how many
parts were opened.

---

## Notes

- Addresses work best when they include the city (e.g.
  `123 Maple St, Montreal, QC`), since that avoids Google Maps guessing
  the wrong location.
- GPS coordinates also work — just enter them as `lat,lng` on their own
  line (e.g. `45.5019,-73.5674`).
- Your stop list is saved automatically as a draft on this device, so if
  you close the tab by accident, your unsaved list is still there when
  you come back.
- To actually open a route, you need an internet connection (Google Maps
  needs it to draw the directions). Everything else — entering and
  saving stops — works offline once the app is installed.
