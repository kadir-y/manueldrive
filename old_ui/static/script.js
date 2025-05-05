async function ping() {
const url = "/ping";
try {
    const response = await fetch(url);
    if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
} catch (error) {
    console.error(error.message);
}} 

function impact([pay, payda],[pay1, payda1]) {
    return [pay*pay1, payda*payda1];
}
function divide([pay, payda],[pay1, payda1]) {
    return [pay*payda1, pay1*payda];
}
function sum([pay, payda],[pay1, payda1]) {
    return [pay*payda1+pay1*payda, payda1*payda]
}
function subt([pay, payda],[pay1, payda1]) {
    return [pay*payda1-pay1*payda, payda1*payda]
}
function toDec([pay, payda]) {
    return pay / payda;
}
function saveData(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
}

function getData (name) {
    return JSON.parse(localStorage.getItem(name));
}

const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const cursor = document.getElementById("cursor");
const content = document.getElementById("content");
const horizontalLine = document.getElementById("horizontal-line");
const verticalLine = document.getElementById("vertical-line");
const cameraIdIndicator = document.getElementById("camera-id");
const cameraIndicators = document.querySelectorAll("#camera-idicators .number");
const cameraInfo = document.getElementById("camera-info"); 
const container = document.getElementById("container");
const leftscreen = document.querySelector(".leftscreen img");
let horizontalRatio, verticalRatio;

function hidevideo () {
    container.classList.remove("show-video");
    video.setAttribute("src", "");
    cameraIdIndicator.innerText = "";
    cameraInfo.innerText = "No camera";
    saveData("lastselection", "");
    source.close();
}

let source;
function showvideo (id) {
    if (source) source.close();
    source = new EventSource("/live-stream-base64/30/10/0");
    let i = 0;
    let start_time = Date.now();
    source.onmessage = function(event) {
        /* hafıza şişmesin diye sıfırladım */
        if (i === 256) {
            /* 256 rastgele seçildi belki aslında fps değerlerinin 
            ekoku kadar olmalı */
            start_time = Date.now();
            i = 0;
        }
        i++;
        elapsed_time = Date.now() - start_time;
        fps = i / elapsed_time * 1000;
            
        const data = JSON.parse(event.data);
        if (data.camera_0) {
            video.setAttribute("src", data.camera_0);
        } 
        if (data.camera_1) {
            leftscreen.setAttribute("src", data.camera_1);
        }
        cameraInfo.innerText = `${fps.toFixed(2)} fps`;
    }
    container.classList.add("show-video");
    cameraIdIndicator.innerText = "1";

    return;
    /*  BURDA OVERWRITE EDİLDİ */
    src = "/live-stream-mjpeg/0";
    /*  BURDA OVERWRITE EDİLDİ */
    
    container.classList.add("show-video");
    video.setAttribute("src", src);
    cameraIdIndicator.innerText = id + 1;
    if (id == "0") {
        cameraInfo.innerText = "Shooting";
    } else if (id == "1") {
        cameraInfo.innerText = "Front";
    } else if (id == "2") {
        cameraInfo.innerText = "Back";
    }
    saveData("lastselection", id);
}
function loadAfterVideLoad() {
    horizontalRatio = getData("horizontalRatio");
    verticalRatio = getData("verticalRatio");
    const offsetHeight = getData("offsetHeight");
    if (offsetHeight) {
        videoContainer.style.height = `${offsetHeight}px`;
    }
    if (!horizontalRatio || !verticalRatio) {
        horizontalRatio = divide([horizontalLine.offsetTop,1],[videoContainer.offsetHeight, 1]);
        verticalRatio = divide([verticalLine.offsetLeft,1],[videoContainer.offsetWidth, 1]);
    } else {
        horizontalLine.style.top = `${toDec(impact(horizontalRatio,([videoContainer.offsetHeight,1])))}px`;
        verticalLine.style.left = `${toDec(impact(verticalRatio,([videoContainer.offsetWidth,1])))}px`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const lastselection = getData("lastselection");
    if (lastselection) {
        showvideo(lastselection);
    }
});

let firstrun = true;
video.addEventListener("load", () => {
    if (firstrun) {
        loadAfterVideLoad();
        firstrun = false;
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        hidevideo();
    }
    else if (event.key === "1") {
        showvideo(0);
    }
    else if (event.key === "2") {
        showvideo(1);
    }
    else if (event.key === "3") {
        showvideo(2);
    }
    else if (!container.classList.contains("show-video")) {
        return;
    }
    else if (event.key.trim() === "") {
        cursor.classList.toggle("show");
    }
    else if (event.key === "ArrowRight") {
        verticalLine.style.left = `${verticalLine.offsetLeft + 1}px`;
        verticalRatio = divide(sum([verticalLine.offsetLeft,1],[1,1]), [videoContainer.offsetWidth, 1]);
        saveData("verticalRatio", verticalRatio);
    } else if (event.key === "ArrowLeft") {
        verticalLine.style.left = `${verticalLine.offsetLeft - 1}px`;
        verticalRatio = divide(subt([verticalLine.offsetLeft,1],[1,1]),[videoContainer.offsetWidth, 1]);
        saveData("verticalRatio", verticalRatio);
    }
    else if (event.key === "ArrowUp") {
        horizontalLine.style.top = `${horizontalLine.offsetTop - 1}px`;
        horizontalRatio = divide(subt([horizontalLine.offsetTop,1],[1,1]),[videoContainer.offsetHeight, 1]);
        saveData("horizontalRatio", horizontalRatio);
    } else if (event.key === "ArrowDown") {
        horizontalLine.style.top = `${horizontalLine.offsetTop + 1}px`;
        horizontalRatio = divide(sum([horizontalLine.offsetTop,1],[1,1]),[videoContainer.offsetHeight, 1]);
        saveData("horizontalRatio", horizontalRatio);
    }
    else if (event.key === "+")  {
        let offsetHeight = videoContainer.offsetHeight + 10;
        videoContainer.style.height = `${offsetHeight}px`;
        saveData("offsetHeight", offsetHeight);
        horizontalLine.style.top = `${toDec(impact(horizontalRatio,([offsetHeight,1])))}px`;
        verticalLine.style.left = `${toDec(impact(verticalRatio,([videoContainer.offsetWidth,1])))}px`;
    } else if (event.key === "-")  {
        let offsetHeight = videoContainer.offsetHeight - 10;
        videoContainer.style.height = `${offsetHeight}px`;
        saveData("offsetHeight", offsetHeight);
        horizontalLine.style.top = `${toDec(impact(horizontalRatio,([offsetHeight,1])))}px`;
        verticalLine.style.left = `${toDec(impact(verticalRatio,([videoContainer.offsetWidth,1])))}px`;
    }
});

cameraIndicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
        showvideo(index);
    });
});
