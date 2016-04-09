var synths = [];
var snares = [];
var bass = [];

var bassIter = 0;
var snareIter = 0;
var synthIter = 0;

var totalMs = 4000;

var beatTime = 0;
var lastTime = performance.now();

var sounds = {};

var mp3s = ['A4.mp3', 'B4.mp3', 'Db4.mp3', 'D4.mp3', 'E4.mp3', 'Gb4.mp3', 'Ab4.mp3', 'A5.mp3'];


sounds.bass = new Audio('bass.mp3');
sounds.bass = new Howl({
  urls: ['bass.mp3'],
});
sounds.snare = new Audio('snare.mp3');
// sounds.snare = new Howl({
//   urls: ['snare.mp3'],
//   onend: function() {
//     sounds.snare.pos = 0;
//   }
// });

var scrub = function(newTime) {
  var elapsedTime = newTime - lastTime;
  beatTime = (beatTime + elapsedTime) % totalMs;

  while (bass[bassIter] <= beatTime) {
    playBass();
    bassIter = (bassIter + 1) % bass.length;
  }

  while (snares[snareIter] <= beatTime) {
    playSnare();
    snareIter = (snareIter + 1) % snares.length;
  }

  while (synths[synthIter].start <= beatTime) {
    synth = synths[synthIter];
    playSynth(synth.start, synth.y, synth.duration);
    synthIter = (synthIter + 1) % synths.length;
  }

  lastTime = newTime;

  window.requestAnimationFrame(scrub);
};

var playBass = function() {
  sounds.bass.src = 'bass.mp3';
  sounds.bass.play();
}

var playSnare = function() {
  sounds.snare.src = 'snare.mp3';
  sounds.snare.play();
}

var playSynth = function(start, y, duration) {
  var note = Math.round(y / 10);
  var sound = new Howl({
    urls: [mp3s[note]],
    sprite: {
      note: [0, duration]
    }
  }).play('note');
}

$(document).ready(function() {
  window.sounds = sounds;
  // scrub();

  canvas = document.getElementById('canvas');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  $('#help').css('left', (window.innerWidth - $('#help').width()) / 2 + 'px')
    .css('top', (window.innerHeight - $('#help').height()) / 2 + 'px');

  if (window.location.search == '?embed') {
    $('#moreinfo').hide();
    $('#larger').show();
  }

  c = canvas.getContext('2d');

  function getpos(e) {
    var offset = $(canvas).offset();
    return {
      x: e.pageX - offset.left,
      y: e.pageY - offset.top,
    };
  }

  function direction(d) {
    var horiz = (Math.abs(d.x) > Math.abs(d.y));
    if (horiz) {
      if (d.x < 0) return 0;
      return 1;
    } else {
      if (d.y < 0) return 2;
      return 3;
    }
  }

  colors = ['rgba(255,0,0,0.5)',
    'rgba(0,255,0,0.5)',
    'rgba(0,0,255,0.5)',
    'rgba(200,200,0,0.5)',
  ];

  function vector(x, y) {
    return {
      x: x,
      y: y,
    };
  }

  function delta(a, b) {
    return vector(a.x - b.x, a.y - b.y);
  }

  function angle(d) {
    return Math.atan((1.0 * d.y) / d.x);
  }

  function angle_between(a, b) {
    return Math.acos((a.x * b.x + a.y * b.y) / (len(a) * len(b)));
  }

  function len(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  function unit(c) {
    var l = len(c);
    return vector(c.x / l, c.y / l);
  }

  function scale(c, f) {
    return vector(c.x * f, c.y * f);
  }

  function add(a, b) {
    return vector(a.x + b.x, a.y + b.y);
  }

  function rotate(v, a) {
    return vector(v.x * Math.cos(a) - v.y * Math.sin(a),
      v.x * Math.sin(a) + v.y * Math.cos(a));
  }

  function average(l) {
    var x = 0;
    var y = 0;
    for (var i = 0; i < l.length; i++) {
      x += l[i].x;
      y += l[i].y;
    }
    return vector(x / l.length, y / l.length);
  }

  function pointToTime(x) {
    return x / window.innerWidth * 8000;
  }

  function CalculateCircleCenter(A, B, C) {
    var yDelta_a = B.y - A.y;
    var xDelta_a = B.x - A.x;
    var yDelta_b = C.y - B.y;
    var xDelta_b = C.x - B.x;

    var center = {};

    var aSlope = yDelta_a / xDelta_a;
    var bSlope = yDelta_b / xDelta_b;

    center.x = (aSlope * bSlope * (A.y - C.y) + bSlope * (A.x + B.x) - aSlope * (B.x + C.x)) / (2 * (bSlope - aSlope));
    center.y = -1 * (center.x - (A.x + B.x) / 2) / aSlope + (A.y + B.y) / 2;
    return center;
  }

  $(canvas).mousedown(function(e) {
    $("#help").fadeOut(200);
    prev = getpos(e);
    line = [prev];

    $(canvas).mousemove(function(e) {
      pos = getpos(e);

      c.beginPath();
      c.moveTo(prev.x, prev.y);
      c.lineTo(pos.x, pos.y);
      c.stroke();

      prev = pos;
      line.push(pos);
    });

    c.strokeStyle = "rgba(0,0,0,0.2)";

    $(canvas).mouseup(function() {
      $(canvas).unbind('mousemove').unbind('mouseup');
      corners = [line[0]];
      var n = 0;
      var t = 0;
      var lastCorner = line[0];
      for (var i = 1; i < line.length - 2; i++) {
        var pt = line[i + 1];
        var d = delta(lastCorner, line[i - 1]);

        if (len(d) > 20 && n > 2) {
          ac = delta(line[i - 1], pt);
          if (Math.abs(angle_between(ac, d)) > Math.PI / 4) {
            pt.index = i;
            corners.push(pt);
            lastCorner = pt;
            n = 0;
            t = 0;
          }
        }
        n++;
      }

      if (len(delta(line[line.length - 1], line[0])) < 25) {
        corners.push(line[0]);

        if (corners.length == 5) {
          //check for square
          var p1 = corners[0];
          var p2 = corners[1];
          var p3 = corners[2];
          var p4 = corners[3];
          var p1p2 = delta(p1, p2);
          var p2p3 = delta(p2, p3);
          var p3p4 = delta(p3, p4);
          var p4p1 = delta(p4, p1);
          if ((Math.abs(angle_between(p1p2, p2p3) - Math.PI / 2)) < Math.PI / 6 &&
            (Math.abs(angle_between(p2p3, p3p4) - Math.PI / 2)) < Math.PI / 6 &&
            (Math.abs(angle_between(p3p4, p4p1) - Math.PI / 2)) < Math.PI / 6 &&
            (Math.abs(angle_between(p4p1, p1p2) - Math.PI / 2)) < Math.PI / 6) {
            var p1p3 = delta(p1, p3);
            var p2p4 = delta(p2, p4);

            var diag = (len(p1p3) + len(p2p4)) / 4.0;

            var tocenter1 = scale(unit(p1p3), -diag);
            var tocenter2 = scale(unit(p2p4), -diag);

            var center = average([p1, p2, p3, p4]);

            var angle = angle_between(p1p3, p2p4);

            corners = [add(center, tocenter1),
              add(center, tocenter2),
              add(center, scale(tocenter1, -1)),
              add(center, scale(tocenter2, -1)),
              add(center, tocenter1)
            ];
          }
        }
      } else {
        corners.push(line[line.length - 1]);
      }

      // Line
      if (corners.length === 2) {
        var start = pointToTime(Math.min(corners[0].x, corners[1].x));
        var end = pointToTime(Math.max(corners[0].x, corners[1].x));
        var entry = {
          start: start,
          duration: end - start,
          y: (corners[0].y + corners[1].y) / 2
        };
        var i = 0;
        var l = synths.length;
        while(i < l && start >= synths[i].start) {
          i++;
        }
        synths.splice(i, 0, entry);
        console.log(synths);
      } else if (corners.length === 4 && corners[0].x === corners[3].x && corners[0].y === corners[3].y) {
        var time = pointToTime(CalculateCircleCenter(corners[0], corners[1], corners[2]).x);
        var i = 0;
        var l = snares.length;
        while(i < l && time >= snares[i]) {
          i++;
        }
        snares.splice(i, 0, time);
      } else if (corners.length === 5 && corners[0].x === corners[4].x && corners[0].y === corners[4].y) {
        var sorted = corners.concat().sort(function(a, b) { return a.x - b.x; });
        var time = pointToTime((sorted[0].x + sorted[1].x) / 2);
        var i = 0;
        var l = bass.length;
        while(i < l && time >= bass[i]) {
          i++;
        }
        bass.splice(i, 0, time);
      } else {
        return;
      }

      console.log(synths, snares, bass);

      c.strokeStyle = 'rgba(0, 0, 255, 0.5)';
      c.beginPath();
      c.moveTo(corners[0].x, corners[0].y);
      for (var i = 1; i < corners.length; i++) {
        c.lineTo(corners[i].x, corners[i].y);
      }
      c.stroke();

      c.fillStyle = 'rgba(255, 0, 0, 0.5)';
      for (var i = 0; i < corners.length; i++) {
        c.beginPath();
        c.arc(corners[i].x, corners[i].y, 4, 0, 2 * Math.PI, false);
        c.fill();
      }

      c.fillStyle = 'rgba(0, 255, 255, 0.3)';
      c.beginPath();
      c.moveTo(corners[0].x, corners[0].y);
      for (var i = 1; i < corners.length; i++) {
        c.lineTo(corners[i].x, corners[i].y);
      }
      c.fill();
    });
  });

  $('#clear').click(function() {
    c.clearRect(0, 0, canvas.width, canvas.height);
  });
});
