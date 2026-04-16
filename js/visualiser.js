// ui.js
// Handles: canvas drawing, table building, button clicks, preset loading

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawDFA(states, alphabet, start, accepts, trans) {
    var canvas = document.getElementById('canvas');
    var W = canvas.parentElement.clientWidth - 40 || 600;
    var H = 280;
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
  
    // White background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);
  
    if (!states || states.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DFA diagram will appear here', W / 2, H / 2);
      return;
    }
  
    var N  = states.length;
    var SR = 28; // state circle radius
    var cx = W / 2, cy = H / 2;
    var layoutR = Math.min(W, H) * 0.30;
  
    // Calculate state positions in a circle
    var pos = {};
    for (var i = 0; i < N; i++) {
      var angle = (2 * Math.PI * i / N) - Math.PI / 2;
      pos[states[i]] = {
        x: cx + layoutR * Math.cos(angle),
        y: cy + layoutR * Math.sin(angle)
      };
    }
  
    // Group transitions by (from, to) so multiple symbols show on one arrow
    var edges = {};
    for (var s = 0; s < states.length; s++) {
      for (var sy = 0; sy < alphabet.length; sy++) {
        var from = states[s], sym = alphabet[sy];
        var to = trans[from] && trans[from][sym];
        if (!to) continue;
        var key = from + '|' + to;
        if (!edges[key]) edges[key] = { from: from, to: to, syms: [] };
        edges[key].syms.push(sym);
      }
    }
  
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    // Draw edges
    var eKeys = Object.keys(edges);
    for (var ei = 0; ei < eKeys.length; ei++) {
      var e = edges[eKeys[ei]];
      var lbl = e.syms.join(', ');
      var pf  = pos[e.from], pt = pos[e.to];
      var isSelf  = e.from === e.to;
      var hasBidi = !!edges[e.to + '|' + e.from];
  
      ctx.strokeStyle = '#888';
      ctx.fillStyle   = '#888';
      ctx.lineWidth   = 1.5;
  
      if (isSelf) {
        // Self-loop: small arc above the state
        var lx = pf.x, ly = pf.y - SR;
        var lr = 16;
        ctx.beginPath();
        ctx.arc(lx, ly - lr, lr, Math.PI * 0.25, Math.PI * 2.75);
        ctx.stroke();
        drawArrow(ctx, lx - 3, ly - 2, lx + 4, ly - 1, '#888');
        ctx.fillStyle = '#333';
        ctx.fillText(lbl, lx, ly - lr * 2 - 5);
      } else {
        var dx = pt.x - pf.x, dy = pt.y - pf.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var ux = dx / dist, uy = dy / dist;
        var sx = pf.x + ux * SR, sy2 = pf.y + uy * SR;
        var ex = pt.x - ux * SR, ey  = pt.y - uy * SR;
        var bend = hasBidi ? 30 : 0;
        var nx = -uy * bend, ny = ux * bend;
  
        ctx.beginPath();
        if (bend > 0) {
          var cpx = (sx + ex) / 2 + nx, cpy = (sy2 + ey) / 2 + ny;
          ctx.moveTo(sx, sy2);
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
          ctx.stroke();
          var t = 0.85;
          var ax = (1-t)*(1-t)*sx + 2*(1-t)*t*cpx + t*t*ex;
          var ay = (1-t)*(1-t)*sy2 + 2*(1-t)*t*cpy + t*t*ey;
          drawArrow(ctx, ax, ay, ex, ey, '#888');
          ctx.fillStyle = '#333';
          ctx.fillText(lbl, (sx+ex)/2 + nx*0.6, (sy2+ey)/2 + ny*0.6 - 8);
        } else {
          ctx.moveTo(sx, sy2);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          drawArrow(ctx, sx, sy2, ex, ey, '#888');
          ctx.fillStyle = '#333';
          ctx.fillText(lbl, (sx+ex)/2 - uy*14, (sy2+ey)/2 + ux*14);
        }
      }
    }
  
    // Start arrow
    if (pos[start]) {
      var sp = pos[start];
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sp.x - SR - 32, sp.y);
      ctx.lineTo(sp.x - SR - 2, sp.y);
      ctx.stroke();
      drawArrow(ctx, sp.x - SR - 20, sp.y, sp.x - SR - 2, sp.y, '#27ae60');
    }
  
    // Draw state circles
    for (var si = 0; si < states.length; si++) {
      var st = states[si];
      var p  = pos[st];
      var isAcc = accepts.indexOf(st) >= 0;
      var isSt2 = st === start;
  
      if (isAcc) {
        // Double circle for accept states
        ctx.beginPath();
        ctx.arc(p.x, p.y, SR + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
  
      ctx.beginPath();
      ctx.arc(p.x, p.y, SR, 0, 2 * Math.PI);
      ctx.fillStyle = isSt2 ? '#eafaf1' : (isAcc ? '#eef3fb' : '#fff');
      ctx.fill();
      ctx.strokeStyle = isAcc ? '#4a90e2' : (isSt2 ? '#27ae60' : '#888');
      ctx.lineWidth = (isAcc || isSt2) ? 2 : 1.5;
      ctx.stroke();
  
      ctx.fillStyle = isAcc ? '#4a90e2' : (isSt2 ? '#27ae60' : '#222');
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st, p.x, p.y);
    }
  }
  
  function drawArrow(ctx, fx, fy, tx, ty, color) {
    var angle = Math.atan2(ty - fy, tx - fx);
    var len = 9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - len * Math.cos(angle - 0.4), ty - len * Math.sin(angle - 0.4));
    ctx.lineTo(tx - len * Math.cos(angle + 0.4), ty - len * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }
  
  // ── Table builder ─────────────────────────────────────────────────────────────
  
  function buildTable(states, alphabet) {
    var html = '<table><thead><tr><th>State</th>';
    for (var i = 0; i < alphabet.length; i++) html += '<th>' + alphabet[i] + '</th>';
    html += '</tr></thead><tbody>';
    for (var s = 0; s < states.length; s++) {
      html += '<tr><td class="state-name">' + states[s] + '</td>';
      for (var a = 0; a < alphabet.length; a++) {
        html += '<td><input type="text" id="t_' + states[s] + '_' + alphabet[a] + '" placeholder="-" /></td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById('table-wrap').innerHTML = html;
  }
  
  function readTrans(states, alphabet) {
    var t = {};
    for (var s = 0; s < states.length; s++) {
      t[states[s]] = {};
      for (var a = 0; a < alphabet.length; a++) {
        var el = document.getElementById('t_' + states[s] + '_' + alphabet[a]);
        var v  = el ? el.value.trim() : '';
        if (v && v !== '-') t[states[s]][alphabet[a]] = v;
      }
    }
    return t;
  }
  
  // ── Helpers ───────────────────────────────────────────────────────────────────
  
  function parseList(str) {
    return str.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
  }
  
  function showResult(regex, steps) {
    document.getElementById('regex-out').textContent = regex;
    var html = '';
    for (var i = 0; i < steps.length; i++) {
      html += '<div class="step-card">'
            + '<div class="step-title">Step ' + (i + 1) + ': ' + steps[i].title + '</div>'
            + '<div>' + steps[i].desc + '</div>'
            + '</div>';
    }
    document.getElementById('steps-out').innerHTML = html;
    document.getElementById('result-area').style.display = 'block';
  }
  
  function run(states, alphabet, start, accepts, trans) {
    drawDFA(states, alphabet, start, accepts, trans);
    var out = dfaToRegex(states, alphabet, start, accepts, trans);
    showResult(out.regex, out.steps);
  }
  
  // ── Event listeners ───────────────────────────────────────────────────────────
  
  window.onload = function () {
  
    // Initial empty canvas
    drawDFA([], [], '', [], {});
  
    // Build table button
    document.getElementById('btn-table').onclick = function () {
      var states   = parseList(document.getElementById('states').value);
      var alphabet = parseList(document.getElementById('alphabet').value);
      if (!states.length || !alphabet.length) {
        alert('Please enter at least one state and one symbol.');
        return;
      }
      buildTable(states, alphabet);
      document.getElementById('table-area').style.display = 'block';
  
      var start   = document.getElementById('start').value.trim();
      var accepts = parseList(document.getElementById('accepts').value);
      drawDFA(states, alphabet, start, accepts, {});
    };
  
    // Compute button
    document.getElementById('btn-compute').onclick = function () {
      var states   = parseList(document.getElementById('states').value);
      var alphabet = parseList(document.getElementById('alphabet').value);
      var start    = document.getElementById('start').value.trim();
      var accepts  = parseList(document.getElementById('accepts').value);
  
      if (states.indexOf(start) < 0) {
        alert('Start state "' + start + '" is not in the states list!');
        return;
      }
      for (var i = 0; i < accepts.length; i++) {
        if (states.indexOf(accepts[i]) < 0) {
          alert('Accept state "' + accepts[i] + '" is not in the states list!');
          return;
        }
      }
  
      var trans = readTrans(states, alphabet);
      run(states, alphabet, start, accepts, trans);
    };
  
    // Preset buttons
    var exBtns = document.querySelectorAll('.ex-btn');
    for (var i = 0; i < exBtns.length; i++) {
      (function (btn) {
        btn.onclick = function () {
          var idx = parseInt(btn.getAttribute('data-i'));
          var p   = PRESETS[idx];
  
          document.getElementById('states').value   = p.states.join(',');
          document.getElementById('alphabet').value = p.alphabet.join(',');
          document.getElementById('start').value    = p.start;
          document.getElementById('accepts').value  = p.accepts.join(',');
  
          buildTable(p.states, p.alphabet);
          document.getElementById('table-area').style.display = 'block';
  
          // Fill the transition inputs
          for (var s = 0; s < p.states.length; s++) {
            for (var a = 0; a < p.alphabet.length; a++) {
              var el = document.getElementById('t_' + p.states[s] + '_' + p.alphabet[a]);
              if (el && p.trans[p.states[s]] && p.trans[p.states[s]][p.alphabet[a]]) {
                el.value = p.trans[p.states[s]][p.alphabet[a]];
              }
            }
          }
  
          run(p.states, p.alphabet, p.start, p.accepts, p.trans);
        };
      })(exBtns[i]);
    }
  
    // Redraw canvas on resize
    window.onresize = function () {
      var states   = parseList(document.getElementById('states').value);
      var alphabet = parseList(document.getElementById('alphabet').value);
      var start    = document.getElementById('start').value.trim();
      var accepts  = parseList(document.getElementById('accepts').value);
      var trans    = readTrans(states, alphabet);
      drawDFA(states, alphabet, start, accepts, trans);
    };
  };