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

### 1. Set your default city (once)
Type your city and province (e.g. `Montreal, QC`) into the **Default
city & province** box. This gets remembered on this device, so you only
set it once. See "Cross streets and short stop names" below for why this
matters.

### 2. Add your stops
- **Paste a whole list at once:** paste your stops into the big box, one
  address per line, then tap **Add Pasted Stops**.
- **Add one stop at a time:** type an address in the smaller box and tap
  **Add** (or press Enter).

### 3. Check the order
- The first stop is where the route starts. The last stop is where it
  ends. Both are labelled so it's clear at a glance.
- Use the **↑** / **↓** buttons to move a stop.
- Use the **✏️** button to fix a typo or change a stop's name in
  place — no need to delete and re-add it. Press **Enter** or tap
  **Save** to keep it, **Escape** or **Cancel** to back out. If that
  stop already has a pinned exact location (see below), the pin stays
  put — editing the name doesn't touch it.
- Use the **✕** button to remove a stop.

### 4. Save the route (optional, but recommended)
- Type a name like `AM Route` and tap **Save Route**.
- Next time, pick it from the dropdown at the top and tap **Load** —
  no retyping.

### 5. Open it
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

## Cross streets and short stop names

Bus stop sheets often list stops as an intersection, like
`Cavendish/Westminster`, instead of a full street address. Google Maps
can find those, but only if they're written as `Cavendish & Westminster`
**with a city attached** — a plain slash and no city usually sends you
to the wrong place, or nowhere at all.

Bus Dravin fixes this for you automatically, as long as your **Default
city & province** box (Step 1) is filled in:

- `/` is turned into `&` (Cavendish/Westminster → Cavendish & Westminster)
- your default city is added to any stop that doesn't already mention one

What you typed stays exactly as-is in your stop list. Underneath any
stop that got adjusted, you'll see a small grey line like
`Maps search: Cavendish & Westminster, Montreal, QC` — that's exactly
what will be searched. Check it before you open the route, especially
for any stop that doesn't look right.

---

## Getting the exact side of the street

Even with the fix above, Google Maps drops the pin at the *center* of an
intersection — not necessarily the correct curb. On a divided road, a
4-way stop, or a wide arterial road, that can mean the wrong side of the
street or the wrong corner entirely.

To fix a specific stop, tap the **📍** button next to it in Step 3. This
opens a real map with a pin fixed in the middle — no compass directions
to figure out, and no dragging a marker around either:

1. When the panel opens, it automatically searches for that stop and
   shows it on the map — you don't need to type or search anything
   again unless the result looks wrong.
2. **The pin stays put in the center. Drag the map itself** underneath
   it, like panning any map, until the pin lands on the exact spot:
   the correct curb, the correct side of a divided road, the correct
   corner of a 4-way stop.
3. Tap **Use This Pin**.

You also get other ways to get a starting point on the map:

- **Use My Current Location** — if you're standing at the stop right
  now, this centers the map on your phone's GPS position; pan to
  fine-tune if it's slightly off, then confirm.
- **Open This Search in Google Maps** — the 📍 search box uses a free
  address lookup (Nominatim) that's noticeably weaker than Google's,
  especially at resolving intersections. If it says "No location
  found" for a stop that opens fine with the main **Open Route**
  button, this is why — not a bug, just a weaker free tool. Tap this
  to open the exact same search in Google Maps, find the spot there,
  long-press it to see its coordinates, then paste them into the box
  below.
- **Type coordinates you already have** — whether from the Google
  Maps fallback above or found some other way, this shows the point
  on the map so you can double check (and still adjust) before
  confirming.

**The stop's name never changes.** Pinning a stop only attaches a
precise GPS point behind the scenes — the list still shows
"Cavendish/Westminster" (or whatever you typed), and a small grey line
underneath it now reads `📍 Pinned exact location: ...` so you always
know a stop has one. Reopening the 📍 panel on an already-pinned stop
shows its current pin on the map again, so you can nudge it further
any time — or tap **Remove Pin** to go back to using the address.

> **Why not just show compass directions (N/E/S/W)?** Bus Dravin
> originally tried that, but it doesn't hold up: a real intersection's
> true corners only sit on the diagonals (NE/NW/SE/SW) — the cardinal
> points sit in the middle of the road. And in a city like Montreal,
> where the street grid runs well off true north, "north" on a compass
> doesn't match what the map actually shows you. Dragging a pin on a
> real map sidesteps both problems.

**If the map ever looks blank when you tap 📍** — no tiles, just a
grey box — that's almost always a weak cell signal, since map tiles
have to download live and cell towers drop out constantly while
driving. Bus Dravin now tells you when that's happening instead of
staying silently blank, and **Use My Current Location** and typed
coordinates keep working even when the map picture itself can't load
— you can still confirm a pin without ever seeing the map.

On a genuinely dropped connection, a search or the map can sit stuck
rather than fail outright. Bus Dravin gives a search up to 10 seconds
and the map tiles up to 6, then shows the same clear message instead
of leaving you staring at "Looking up…" or a blank box with no
explanation.

---

## Notes

- Full street addresses also work, and don't need the default city —
  just include the city yourself, e.g. `123 Maple St, Montreal, QC`.
- GPS coordinates also work — just enter them as `lat,lng` on their own
  line (e.g. `45.5019,-73.5674`).
- Your stop list is saved automatically as a draft on this device, so if
  you close the tab by accident, your unsaved list is still there when
  you come back.
- You need an internet connection for anything that talks to an outside
  map: opening a route, searching an intersection, or showing the pin
  map in the 📍 panel. Entering, reordering, and saving stops all work
  offline once the app is installed.

---

## If the app looks out of date

Bus Dravin remembers a copy of itself on your phone so it opens
instantly, even offline. That copy always double-checks for a newer
version first whenever you're online, so a normal reopen should keep
it current on its own.

If it ever does look stuck on an older version — a button or feature
you know was added is missing — this fixes it:

1. Fully close the app (swipe it away from your recent-apps list).
2. Reopen it. This alone fixes it most of the time.
3. Still stuck? On iPhone: **Settings → Safari → Advanced → Website
   Data**, find `github.io`, and delete it. This wipes Bus Dravin's
   saved routes and default city on this device, so it's worth noting
   those down first if you'd rather not retype them. Then reopen the
   app fresh.
