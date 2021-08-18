/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

var mediaRecorder;
var recordedBlobs;
var recording = false;

const audioContext = new AudioContext(window.AudioContext = window.AudioContext || window.webkitAudioContext);
const audioStreamDestination = audioContext.createMediaStreamDestination();
const speakerDestination = audioContext.destination;
const musicPreference = document.querySelector('#songPreference');
var music = musicPreference.options[0].value;
const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.src = music;
var  audioSource = audioContext.createMediaElementSource(audio);
const codecPreferences = document.querySelector('#codecPreferences');
const songName = document.querySelector('#song_name');
const gumVideo = document.querySelector('video#gum');
const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
const recordIcon = document.querySelector('#recordIcon');
const videoSidebar = document.querySelector('#videoSidebar')

recordButton.addEventListener('click', () => {
  if (!recording) {
    recordedVideo.pause();
    startRecording();
    recording = true;
    gumVideo.hidden = false;
    recordedVideo.hidden = true;
    videoSidebar.hidden = false;
  } else {
    stopRecording();
    recording = false;
    recordIcon.textContent = 'camera';
    //playButton.disabled = false;
    downloadButton.disabled = false;
    downloadButton.hidden = false;
    codecPreferences.disabled = false;
  }
});

// = document.querySelector('button#play');
//playButton.addEventListener('click', () => {
function playRecording() {
  videoSidebar.hidden = false;
  gumVideo.hidden = true;
  recordedVideo.hidden = false;
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  const superBuffer = new Blob(recordedBlobs, {type: mimeType});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
}
//});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/mp4'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'ayoba.mp4';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

const musicPreferenceButton = document.querySelector('#videoFooter__record');
musicPreferenceButton.addEventListener('click', () => {
  if (musicPreference.hidden) {musicPreference.hidden = false;}
  else {musicPreference.hidden = true;};
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function startRecording() {
  recordedBlobs = [];
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  const options = {mimeType};
  audio.src = musicPreference.options[musicPreference.selectedIndex].value;
  audioSource.connect(audioStreamDestination);
  audioSource.connect(speakerDestination);
  let combined = new MediaStream();
  combined.addTrack(audioStreamDestination.stream.getAudioTracks()[0]);
  combined.addTrack(window.stream.getVideoTracks()[0]);
  try {
    mediaRecorder = new MediaRecorder(combined, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordIcon.textContent = 'stop_circle';
  //playButton.disabled = true;
  downloadButton.disabled = true;
  downloadButton.hidden = true;
  codecPreferences.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
    playRecording();
  };
  mediaRecorder.ondataavailable = handleDataAvailable;

  audio.play();
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  audio.pause();
  audio.currentTime = 0;
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  gumVideo.srcObject = stream;

  getSupportedMimeTypes().forEach(mimeType => {
    const option = document.createElement('option');
    option.value = mimeType;
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

musicPreference.addEventListener('change', function (ev) {
  console.log('Changed', musicPreference.options[musicPreference.selectedIndex].text);
  songName.textContent = musicPreference.options[musicPreference.selectedIndex].text;
  music = musicPreference.options[musicPreference.selectedIndex].value;
  audio.src = music;
});

const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
const constraints = {
  audio: {
    echoCancellation: {exact: hasEchoCancellation}
  },
  video: {
    width: 1280, height: 720
  }
};
console.log('Using media constraints:', constraints);
init(constraints);
//});
