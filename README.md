# Number Run

A small, self-contained subway-style math runner. Open `index.html` directly in a modern browser. You can also serve the folder locally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a modern browser.

## Controls

- **Left / Right arrows** or **A / D**: change lanes
- **Swipe left or right**: change lanes on touch screens
- Read the centered problem, then run through the gate showing its correct answer

Each round shows a problem such as `77 + 33 = ?` above three lane gates.
The gates show only answer numbers; choose the correct one to keep your run
going and build a streak. Wrong answers end the run.

Choose a pace before starting:

- Super: 3 seconds per gate
- Hard: 5 seconds per gate
- Normal: 7 seconds per gate
- Easy: 10 seconds per gate

The equation size and operation complexity increase a little after every
correct gate. Your best distance is saved in browser local storage.

## Implementation

The game uses one canvas and one animation frame loop, with no build step or
runtime dependencies. The code is split by responsibility: `index.html` holds
page structure and `styles.css` holds presentation. The files in `src/` handle
game flow, drawing, math choices, and random generation.

Gate generation uses a small pseudo-random generator seeded with fresh device
entropy for each run, and exactly one answer is correct. 
