// regex.js
// Helper functions for building regular expressions
// Used during state elimination

var EMPTY   = '\u2205'; // ∅ — empty set (no strings)
var EPSILON  = '\u03b5'; // ε — empty string

// Wraps regex in parens if it has a top-level union (|)
// e.g. "a|b" -> "(a|b)" so it can be safely concatenated
function reWrap(r) {
  if (!r || r === EMPTY || r === EPSILON) return r;
  var depth = 0;
  for (var i = 0; i < r.length; i++) {
    if (r[i] === '(') depth++;
    else if (r[i] === ')') depth--;
    else if (r[i] === '|' && depth === 0) return '(' + r + ')';
  }
  return r;
}

// Kleene star: R*
// ε* = ε, ∅* = ε, already starred stays as is
function reStar(r) {
  if (!r || r === EMPTY || r === EPSILON) return EPSILON;
  if (r.length === 1) return r + '*';
  if (r[r.length - 1] === '*') return r;
  // Already fully parenthesized?
  if (r[0] === '(' && matchingClose(r, 0) === r.length - 1) return r + '*';
  return '(' + r + ')*';
}

// Concatenation: R1 · R2
// ∅·R = ∅, ε·R = R
function reConcat(r1, r2) {
  if (r1 === EMPTY || r2 === EMPTY) return EMPTY;
  if (r1 === EPSILON) return r2;
  if (r2 === EPSILON) return r1;
  return reWrap(r1) + reWrap(r2);
}

// Union: R1 | R2
// ∅|R = R, R|R = R
function reUnion(r1, r2) {
  if (r1 === EMPTY) return r2;
  if (r2 === EMPTY) return r1;
  if (r1 === r2) return r1;
  return r1 + '|' + r2;
}

// Finds index of matching closing paren starting at openIdx
function matchingClose(s, openIdx) {
  var depth = 0;
  for (var i = openIdx; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}