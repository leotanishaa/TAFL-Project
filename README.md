# DFA → Regular Expression Visualizer

> **Theory of Automata & Formal Languages — Visualization Project**  
> CA Assignment | TOC_CSE

---

## 📌 What This Does

This web application lets you:
1. **Input a DFA** (states, alphabet, transitions, start/accept states)
2. **Visualize the DFA** as a state diagram on canvas
3. **Convert it to a Regular Expression** using the **State Elimination (GNFA) method**
4. **See every step** of the elimination process explained clearly

---

## 🗂 Project Structure

```
dfa-to-regex/
├── index.html         → Main UI layout
├── style.css          → Styling (dark theme, responsive)
├── js/
│   ├── regex.js       → RE operations: union, concat, star, wrap
│   ├── dfa.js         → DFA class + State Elimination algorithm + Presets
│   └── visualizer.js  → Canvas drawing, table builder, event handlers
└── README.md          → This file
```

---

