var sounds = {};

sounds.bass = new Howl({
  urls: ['bass.mp3']
});
sounds.snare = new Howl({
  urls: ['snare.mp3']
});
sounds.synth1 = new Howl({
  urls: ['synth1.mp3']
});
sounds.synth2 = new Howl({
  urls: ['synth2.mp3']
});
sounds.synth3 = new Howl({
  urls: ['synth3.mp3']
});
sounds.synth4 = new Howl({
  urls: ['synth4.mp3']
});
sounds.synth5 = new Howl({
  urls: ['synth5.mp3']
});
sounds.synth6 = new Howl({
  urls: ['synth6.mp3']
});
sounds.synth7 = new Howl({
  urls: ['synth7.mp3']
});
sounds.synth8 = new Howl({
  urls: ['synth8.mp3']
});

var scrub = function(timeline) {
  var drums = timeline.drums;
  var drumIter = 0;

  var snares = timeline.snares;
  var snareIter = 0;

  var synths = timeline.synths;
  var synthIter = 0;

  var totalMs = 8000;

  for (var i = 0; i < totalMs; i++) {
    if (drums[drumIter].x == i) {
      playDrum();
      drumIter++;
    }

    if (snares[snareIter].x == i) {
      playSnare();
      snareIter++;
    }

    if (synths[synthIter].x == i) {
      synth = synths[synthIter];
      playSynth(synth.x, synth.y, synth.duration);
      synthIter++;
    }
  }
};

$(document).ready(function() {
  window.sounds = sounds;
  // scrub();
});
