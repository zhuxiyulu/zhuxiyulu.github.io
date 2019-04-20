function get_uuid() {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
}

let audio_context;
let recorder;

function startUserMedia(stream) {
    let input = audio_context.createMediaStreamSource(stream);
    console.log('Media stream created.');
    recorder = new Recorder(input);
    console.log('Recorder initialised.');
}

function startRecording() {

    recorder && recorder.record();
    // button.disabled = true;
    // button.nextElementSibling.disabled = false;
    console.log('Recording...');
}

function stopRecording(button) {
    recorder && recorder.stop();
    // button.disabled = true;
    // button.previousElementSibling.disabled = false;
    console.log('Stopped recording.');

    // create WAV download link using audio data blob
    createDownloadLink();

    recorder.clear();
}

function createDownloadLink() {
    recorder && recorder.exportWAV(function (blob) {
        blobToDataURL(blob, function (dataurl) {
            let arr = dataurl.split(",")
            //console.log(arr[1]);
            $.ajax({
                url: "/voice_dictation",
                type: "POST",
                data: {audio: arr[1]},
                contentType: "application/x-www-form-urlencoded",
                dataType: "json",
                success: function (e) {
                    let code = e['code'];
                    if (code === 0){
                        $("#myInput").val(e['data']);
                    }else{
                        console.log(e['msg']);
                        alert("没听清,再试一次吧");
                    }
                },
                error: function(msg){
                    console.log(msg)
                }
            });
        });
    });
}

//**dataURL to blob**
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}

//**blob to dataURL**
function blobToDataURL(blob, callback) {
    let a = new FileReader();
    a.onload = function (e) {
        callback(e.target.result);
    };
    a.readAsDataURL(blob);
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function (e) {
        console.log('No live audio input: ' + e);
    });
};