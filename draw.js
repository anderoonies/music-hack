var lines = [];
var triangles = [];
var rectangles = [];

$(document).ready(function() {
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

        c.fillStyle = 'rgba(0, 0, 255, 0.3)';

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
            c.fillStyle = 'rgba(0, 255, 255, 0.3)';
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

        c.beginPath();
        c.moveTo(corners[0].x, corners[0].y);
        for (var i = 1; i < corners.length; i++) {
          c.lineTo(corners[i].x, corners[i].y);
        }
        c.fill();
      } else {
        corners.push(line[line.length - 1]);
      }

      // Line
      if (corners.length === 2) {
        var start = Math.min(corners[0].x, corners[1].x);
        var end = Math.max(corners[0].x, corners[1].x);
        lines.push({
          start: pointToTime(start),
          duration: pointToTime(end - start),
          y: (corners[0].y + corners[1].y) / 2
        });
      } else if (corners.length === 4 && corners[0].x === corners[3].x && corners[0].y === corners[3].y) {
        triangles.push(pointToTime(CalculateCircleCenter(corners[0], corners[1], corners[2]).x));
      } else if (corners.length === 5 && corners[0].x === corners[4].x && corners[0].y === corners[4].y) {
        var x = [];
        for (var i = 0, l = corners.length; i < l; i++) {
          x.push(corners[i].x);
        }
        x.sort();
        rectangles.push(pointToTime((x[0] + x[1]) / 2));
      } else {
        return;
      }

      console.log(lines, triangles, rectangles);

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
    });
  });

  $('#clear').click(function() {
    c.clearRect(0, 0, canvas.width, canvas.height);
  });
});