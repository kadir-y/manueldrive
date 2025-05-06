/* Lib begin*/
function _time(type) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    if (type === 'date') {
    return `${year}-${month}-${day}`;
    }
    if (type === 'time') {
    return `${hours}:${minutes}:${seconds}`;
    }
    if (type === 'detailed') {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
function _log(msg) {
    if (getData('env') === 'development') {
        console.log(`
            Message: ${msg}
            Logged at: ${_time('detailed')}
        `);
    }
}
function startDevelopment() {
    setData('env', 'development');
    _log("<-----Development mode started.------>");
}
function suspendDevelopment() {
    setData('env', '');
    _log("<-----Development mode suspended.------>");
}
const getData = (key) => JSON.parse(localStorage.getItem(key))
function setData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
/* Lib end */

/* routes elements and vars */
const welcome_page = document.querySelector('.welcome-page');
const stream_page = document.querySelector('.stream-page');
let pre_hash = window.location.hash;
/* routes elements and vars end */

/* stream elements*/
const stream_containers = document.querySelectorAll('.stream-container')
const big_panel = stream_containers[2];
const stream_imgs = document.querySelectorAll('.stream');
const big_img = stream_imgs[2]; 
const stream_select = document.querySelectorAll('.stream-select .option');
const close_buttons = document.querySelectorAll('.close-button svg');
const reopen_buttons = document.querySelectorAll('.cover button');
const cover_stream_ids = document.querySelectorAll('.cover .id')
const cover_stream_types = document.querySelectorAll('.cover .type')
let big_img_ratio = 0;
document.stream_0 = null;
document.stream_1 = null;
document.stream_2 = null;
/* stream elements end*/

/* cursor elements*/
const cursor = document.querySelector('.cursor');
let cursorLoc = getData('cursorLoc');
/* cursor elements end*/

/* stream config */
const fps_list = [5, 20, 12];
const stream_queue = [ 0, 1, 2 ];
let active_streams = []
const stream_link = '/live-stream-base64';
let source;
/* stream config end */

/* Router begin */
function viewPage(hash) {
    if (hash === '#stream') {
        MountStreamPage();
    } else {
        MountWelcomePage();
        window.location.hash = 'welcome';
    }
    _log("Page viewing: " + hash);
}
function redirectToPage(hash) {
    if (hash === pre_hash) {
        _log("Hash still same: " + hash);
        return;
    }
    if (pre_hash === '#stream') {
        UnMountStreamPage();
    } else {
        UnMountWelcomePage();
    }
    pre_hash = hash;
    window.location.hash = hash;
    viewPage(hash)
}

/* Mount and Unload functions, this functions runs when page view */
function MountStreamPage() {
    stream_page.removeAttribute('hidden', 'hidden')
    open_stream([0, 1, 2]);
    updateCover();
}
function UnMountStreamPage() {
    stream_page.setAttribute('hidden', 'hidden')
    close_stream(active_streams);
}
function MountWelcomePage() {
    welcome_page.removeAttribute('hidden', 'hidden')
}
function UnMountWelcomePage() {
    welcome_page.setAttribute('hidden', 'hidden')
}
/* Mount and Unmount functions end */

/* Router end */

/* Stream functions */
function updateImageDimensions(base64Image) {
    // Yeni bir Image objesi oluşturun
    let img = new Image();
    // Base64 verisini resme yükleyin
    img.src = base64Image;
    // Resim yüklendiğinde boyutları alalım
    img.onload = function() {
        let width = img.width;
        let height = img.height;
        big_img_ratio = width / height;
    };
}
function open_stream(list) {
    list = Array.isArray(list) ? list : [list];
    list.forEach((id, index) => {
        if (active_streams.includes(id)) {
            _log(`Stream ${id} is already opened.`)
        } else {
            _log(`Stream ${id} is opened.`)
            const varname = 'stream_' + id;
            document[varname] = new EventSource(`${stream_link}/0/${fps_list[id]}`);
            document[varname].onmessage = function(event) {
                stream_imgs[stream_queue[id]].src = event.data;
                if (id === 2) {
                    updateImageDimensions(event.data);
                }
            }
            active_streams.push(id);
        }
    })
}
function close_stream(list) {
    list = Array.isArray(list) ? list : [list];
    list.forEach((id, index) => {
        const varname = 'stream_' + id
        if (document[varname]) {
            document[varname].close();
            document[varname] = null;
            active_streams = active_streams.filter((ai, i) => ai !== id);
            _log(`Stream ${id} is suspended.`);
        } else {
            _log(`Stream ${id} is already suspended.`);
        }
    })
}
function updateCover () {
    stream_queue.forEach((streamId, index) => {
        if (active_streams.includes(streamId)) {
            stream_containers[index].classList.remove('cover-on')
        } else {
            stream_containers[index].classList.add('cover-on')
        }
        cover_stream_ids[index].innerText = streamId + 1;
        cover_stream_types[index].innerText = 
        streamId === 0 ? 'Front Camera' :
        streamId === 1 ? 'Back Camera' :
        streamId === 2 ? 'Aiming Camera' :
        'Unkown'
        ;
    })
    _log("Covers done!")
}
function stream_sorter(id) {
    let latest_stream = stream_queue[stream_queue.length - 1];
    if (latest_stream != id) {
        stream_queue.forEach((item, index) => {
            if (item === id) {
                stream_queue[index] = latest_stream;
            }
        });
        stream_queue.pop();
        stream_queue.push(id);
        updateCover();
        _log("New stream queue: " + stream_queue);
    } else {
        _log("Stream is already zoomed in.");
    }
}
/* Stream functions */

/* Cursor functions */
function moveCursor ({ x, y }, prevent) {
    if (x) {
        cursor.style.left = x + 'px';
    }
    if (y) {
        cursor.style.top = y + 'px';
    }
    if (!prevent)
    cursorLoc = getCursorLoc();
}
function get_optimized_dimensions() {
    let panel_width = big_panel.offsetWidth;
    let panel_height = big_panel.offsetHeight;
    // Resmin oranını hesapla (width / height)
    let image_ratio = big_img_ratio;
    console.log(panel_width, panel_height, big_img_ratio)
    // Panelin oranını hesapla
    let panel_ratio = panel_width / panel_height;
    let new_width, new_height;
    // Eğer resmin oranı panelin oranına uygunsa, sadece panelin boyutlarına sığdırma işlemi yapılır.
    if (image_ratio > panel_ratio) {
        // Resmin genişliği panelin genişliğine sığacak şekilde yeniden boyutlandır
        new_width = panel_width;
        new_height = Math.round(panel_width / image_ratio);
    } else {
        // Resmin yüksekliği panelin yüksekliğine sığacak şekilde yeniden boyutlandır
        new_height = panel_height;
        new_width = Math.round(panel_height * image_ratio);
    }
    // Eğer yeni hesaplanan boyutlar panelin boyutlarından fazla olursa, panel boyutlarını kullan
    if (new_width > panel_width) {
        new_width = panel_width;
        new_height = Math.round(panel_width / image_ratio);
    }
    if (new_height > panel_height) {
        new_height = panel_height;
        new_width = Math.round(panel_height * image_ratio);
    }
    return { img_width: new_width, img_height: new_height };
}
function getCursorLoc() {
    const { img_width, img_height } = get_optimized_dimensions();
    return [
        (cursor.offsetLeft - (big_panel.offsetWidth - img_width) / 2) / img_width,
        (cursor.offsetTop - (big_panel.offsetHeight - img_height) / 2) / img_height
    ];
}
function calcCursorLoc() {
    const { img_width, img_height } = get_optimized_dimensions();
    const x = img_width * cursorLoc[0] + (big_panel.offsetWidth - img_width) / 2;
    const y = img_height * cursorLoc[1] + (big_panel.offsetHeight - img_height) / 2;
    return { x, y }
}
/* Cursor functions end */

/* Keyboard events */
document.addEventListener('keydown', function(event) {
    const key = event.key;
    if (key === 'Escape') {
        redirectToPage('#welcome');
    } else if (key === '1') {
        redirectToPage('#stream');
        stream_sorter(0);
    } else if (key === '2') {
        redirectToPage('#stream');
        stream_sorter(1);
    } else if (key === '3') {
        redirectToPage('#stream');
        stream_sorter(2);
    } else if (key === ' ') {
        cursor.classList.toggle('show');
        moveCursor(calcCursorLoc(cursorLoc), true);
    } else if (!cursor.classList.contains('show')) {
    }  else if (event.key === "ArrowRight") {
        moveCursor({ x: cursor.offsetLeft + 1 });
    } else if (event.key === "ArrowLeft") {
        moveCursor({ x: cursor.offsetLeft - 1 });
    } else if (event.key === "ArrowUp") {
        moveCursor({ y: cursor.offsetTop - 1 });
    } else if (event.key === "ArrowDown") {
        moveCursor({ y: cursor.offsetTop + 1 });
    }
});
/* Keyboard events end */

/* Element events */
stream_select.forEach((option, index) => {
    option.addEventListener('click', function() {
        redirectToPage('#stream');
        stream_sorter(index);
    });
});
close_buttons.forEach((button, index) => {
    button.addEventListener('click', (event) => {
        close_stream(stream_queue[index]);
        updateCover();
    })
})
reopen_buttons.forEach((button, index) => {
    button.addEventListener('click', (event) => {
        open_stream(stream_queue[index]);
        updateCover();
    })
})
/* Eleement events end */
/* Load events for document and window */
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash;
    viewPage(hash);
});

window.addEventListener('resize', () => {
    moveCursor(calcCursorLoc(cursorLoc), true);
})

/* For this error => ""The connection to was interrupted while
the page was loading."" */
window.addEventListener('beforeunload', function(event) {
    close_stream(active_streams);
    setData('cursorLoc', cursorLoc);
});
/* */
