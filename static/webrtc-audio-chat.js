// Global variables
const peerConnections = {};
let localStream;

// WebRTC configuration (use your own STUN/TURN servers in production)
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ]
};

async function initializeCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        debugLog('Got local audio stream');
        
        // Mute local audio output to prevent echo
        const audioElements = document.getElementsByTagName('audio');
        for (let audio of audioElements) {
            audio.muted = true;
        }
        
        webSocket.onmessage = handleSignalingMessage;
        sendSignal('ready', {});
    } catch (e) {
        console.error('Error accessing media devices.', e);
    }
}

function createPeerConnection(peerUsername) {
    if (peerConnections[peerUsername]) {
        debugLog(`Peer connection to ${peerUsername} already exists`);
        return peerConnections[peerUsername];
    }

    debugLog(`Creating new peer connection for ${peerUsername}`);
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections[peerUsername] = peerConnection;

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal('candidate', {
                candidate: event.candidate,
                to: peerUsername
            });
        }
    };

    peerConnection.ontrack = (event) => {
        debugLog(`Received remote track from ${peerUsername}`);
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.controls = true;
        audio.setAttribute('data-peer', peerUsername);
        document.getElementById('participants').appendChild(audio);
    };

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    return peerConnection;
}

async function handleSignalingMessage(event) {
    const data = JSON.parse(event.data);
    const { peer, action, message } = data;

    switch (action) {
        case 'ready':
            if (peer !== username) {
                debugLog(`Received ready signal from ${peer}`);
                const peerConnection = createPeerConnection(peer);
                try {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    sendSignal('offer', { offer: offer, to: peer });
                } catch (e) {
                    console.error(`Error creating offer for ${peer}:`, e);
                }
            }
            break;
        case 'offer':
            if (message.to === username) {
                debugLog(`Received offer from ${peer}`);
                const peerConnection = createPeerConnection(peer);
                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    sendSignal('answer', { answer: answer, to: peer });
                } catch (e) {
                    console.error(`Error handling offer from ${peer}:`, e);
                }
            }
            break;
        case 'answer':
            if (message.to === username) {
                debugLog(`Received answer from ${peer}`);
                try {
                    await peerConnections[peer].setRemoteDescription(new RTCSessionDescription(message.answer));
                } catch (e) {
                    console.error(`Error setting remote description for ${peer}:`, e);
                }
            }
            break;
        case 'candidate':
            if (message.to === username && peerConnections[peer]) {
                debugLog(`Received ICE candidate from ${peer}`);
                try {
                    await peerConnections[peer].addIceCandidate(new RTCIceCandidate(message.candidate));
                } catch (e) {
                    console.error(`Error adding ICE candidate for ${peer}:`, e);
                }
            }
            break;
        case 'leave':
            if (peerConnections[peer]) {
                debugLog(`Peer ${peer} left the room`);
                peerConnections[peer].close();
                delete peerConnections[peer];
                const audio = document.querySelector(`audio[data-peer="${peer}"]`);
                if (audio) audio.remove();
            }
            break;
    }
}

function toggleMute() {
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        const muteIcon = document.getElementById('mute-icon');
        if (track.enabled) {
            muteIcon.classList.remove('fa-microphone-slash');
            muteIcon.classList.add('fa-microphone');
        } else {
            muteIcon.classList.remove('fa-microphone');
            muteIcon.classList.add('fa-microphone-slash');
        }
    });

    const muteButton = document.getElementById('mute-button');
    muteButton.classList.toggle('btn-primary');
    muteButton.classList.toggle('btn-danger');
}

function leaveRoom() {
    sendSignal('leave', {});
    Object.keys(peerConnections).forEach(peerUsername => {
        peerConnections[peerUsername].close();
        delete peerConnections[peerUsername];
    });
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    webSocket.close();
    window.location.href = '/';
}

function debugLog(message) {
    console.log(message);
    const debugInfo = document.getElementById('debug-info');
    debugInfo.innerHTML += `${message}<br>`;
    debugInfo.scrollTop = debugInfo.scrollHeight;
}

// Initialize the call when the page loads
window.onload = initializeCall;

// Event listeners for UI controls
document.getElementById('mute-button').onclick = toggleMute;
document.getElementById('leave-button').onclick = leaveRoom;