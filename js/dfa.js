// dfa.js
// Converts a DFA to a Regular Expression using State Elimination (GNFA method)
//
// Algorithm:
//   1. Add a new start state q_s (ε to old start) and new accept state q_f (ε from old accepts)
//   2. Eliminate original states one by one using the formula:
//      R(i→j) = R(i→j)  ∪  R(i→k) · R(k→k)* · R(k→j)
//   3. Label on q_s → q_f is the final regex

function dfaToRegex(states, alphabet, start, accepts, trans) {
    var steps = [];
  
    var QS = '__qs__'; // super start
    var QF = '__qf__'; // super final
  
    // ── Build GNFA ───────────────────────────────────────────────
    // gnfa[from][to] = regex label (starts as EMPTY = ∅)
    var gnfa = {};
    var allStates = [QS].concat(states).concat([QF]);
  
    for (var i = 0; i < allStates.length; i++) {
      gnfa[allStates[i]] = {};
      for (var j = 0; j < allStates.length; j++) {
        gnfa[allStates[i]][allStates[j]] = EMPTY;
      }
    }
  
    // ε from super-start to old start
    gnfa[QS][start] = EPSILON;
  
    // ε from each old accept to super-final
    for (var a = 0; a < accepts.length; a++) {
      gnfa[accepts[a]][QF] = reUnion(gnfa[accepts[a]][QF], EPSILON);
    }
  
    // Load DFA transition labels
    for (var s = 0; s < states.length; s++) {
      for (var sy = 0; sy < alphabet.length; sy++) {
        var from = states[s];
        var sym  = alphabet[sy];
        var to   = trans[from] && trans[from][sym];
        if (to) {
          gnfa[from][to] = reUnion(gnfa[from][to], sym);
        }
      }
    }
  
    steps.push({
      title: 'Build GNFA',
      desc:  'Added super-start <span class="st">q_s</span> \u2192 <span class="st">' + start + '</span> (\u03b5) '
           + 'and super-accept <span class="st">q_f</span> with \u03b5 from {<span class="hi">' + accepts.join(', ') + '</span>}. '
           + 'All DFA transitions loaded as labels.'
    });
  
    // ── Eliminate original states one by one ─────────────────────
    // FIX: iterate over a static copy of states, never splice from a shared array.
    // This avoids the index-shifting bug that caused __qf__ to get eliminated.
    var toElim = states.slice(); // static copy — never modified
  
    for (var ki = 0; ki < toElim.length; ki++) {
      var qk = toElim[ki];
  
      // Safety: skip if already gone (shouldn't happen, but just in case)
      if (!gnfa[qk]) continue;
  
      var loop   = gnfa[qk][qk];
      var loopSt = reStar(loop);
  
      var desc = 'Eliminating state <span class="st">' + qk + '</span>.';
      if (loop !== EMPTY) {
        desc += ' Self-loop: <span class="hi">' + loop + '</span> \u2192 star = <span class="hi">' + loopSt + '</span>.';
      }
  
      var updates = [];
  
      // For every pair (qi, qj) — both must still be in gnfa and neither is qk
      var gnfaKeys = Object.keys(gnfa);
      for (var pi = 0; pi < gnfaKeys.length; pi++) {
        var qi = gnfaKeys[pi];
        if (qi === qk) continue;
  
        for (var pj = 0; pj < gnfaKeys.length; pj++) {
          var qj = gnfaKeys[pj];
          if (qj === qk) continue;
  
          var rij = gnfa[qi][qj] !== undefined ? gnfa[qi][qj] : EMPTY;
          var rik = gnfa[qi][qk] !== undefined ? gnfa[qi][qk] : EMPTY;
          var rkj = gnfa[qk][qj] !== undefined ? gnfa[qk][qj] : EMPTY;
  
          // Only update when there's a path through qk
          if (rik === EMPTY || rkj === EMPTY) continue;
  
          // R(i→j) = R(i→j) ∪ R(i→k)·R(k→k)*·R(k→j)
          var through = reConcat(reConcat(rik, loopSt), rkj);
          var newLabel = reUnion(rij, through);
  
          if (newLabel !== rij) {
            updates.push(
              '<span class="st">' + qi + '</span> \u2192 <span class="st">' + qj + '</span>: '
              + '<span class="hi">' + newLabel + '</span>'
            );
          }
          gnfa[qi][qj] = newLabel;
        }
      }
  
      // Remove qk entirely from gnfa
      delete gnfa[qk];
      var remaining = Object.keys(gnfa);
      for (var r = 0; r < remaining.length; r++) {
        if (gnfa[remaining[r]]) delete gnfa[remaining[r]][qk];
      }
  
      if (updates.length > 0) {
        desc += '<br>Updated: ' + updates.join(' &nbsp;&nbsp; ');
      } else {
        desc += ' No transitions to update.';
      }
  
      steps.push({ title: 'Eliminate ' + qk, desc: desc });
    }
  
    // ── Read final result ─────────────────────────────────────────
    var result = (gnfa[QS] && gnfa[QS][QF]) ? gnfa[QS][QF] : EMPTY;
  
    steps.push({
      title: 'Final Result',
      desc:  'Only <span class="st">q_s</span> \u2192 <span class="st">q_f</span> remains. '
           + 'The regular expression is: <span class="hi">' + result + '</span>'
    });
  
    return { regex: result, steps: steps };
  }
  
  // ── Preset examples ───────────────────────────────────────────────────────────
  var PRESETS = [
    {
      label:    "Strings ending in 'a'",
      states:   ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start:    'q0',
      accepts:  ['q1'],
      trans:    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q1', b: 'q0' } }
    },
    {
      label:    "Even number of a's",
      states:   ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start:    'q0',
      accepts:  ['q0'],
      trans:    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q0', b: 'q1' } }
    },
    {
      label:    "Starts with 'ab'",
      states:   ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a', 'b'],
      start:    'q0',
      accepts:  ['q2'],
      trans:    { q0: { a: 'q1', b: 'q3' }, q1: { a: 'q3', b: 'q2' },
                  q2: { a: 'q2', b: 'q2' }, q3: { a: 'q3', b: 'q3' } }
    }
  ];