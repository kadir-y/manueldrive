from flask import Flask, Response, render_template
from flask_cors import CORS
import time
import json
import base64
import cv2
import threading
import time
import os

app = Flask(__name__)
CORS(app)

NUM_CAMERAS = 1
cameras = []
frames = [None] * NUM_CAMERAS  # Her kameranın son görüntüsü burada saklanır
start_time = time.time()

def ensure_output_folder():
    os.makedirs("output", exist_ok=True)

def get_unique_filename(base_path):
    """
    Verilen base_path'teki dosyanın var olup olmadığını kontrol eder ve
    varsa yeni bir benzersiz dosya adı döndürür.
    """
    count = 1
    new_path = base_path
    while os.path.exists(new_path):
        # Dosya adı çakışıyorsa, _1, _2 vb. ekler
        new_path = f"{base_path.split('.')[0]}_{count}.avi"  # mp4 uzantısına geçiş
        count += 1
    return new_path

def camera_worker(cam_id, cap):
    if not cap.isOpened():
        print(f"Kamera {cam_id} açılamadı.")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*'XVID')  # MP4 formatı için codec

    # Dosya adını kontrol et ve benzersiz hale getir
    base_filename = f'output/kamera_{cam_id}.avi'  # mp4 formatı
    video_filename = get_unique_filename(base_filename)

    writer = cv2.VideoWriter(video_filename, fourcc, 20.0, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"Kamera {cam_id} görüntü okuyamıyor.")
            break

        frames[cam_id] = frame  # Son görüntüyü paylaş
        writer.write(frame)
        time.sleep(0.02)

    cap.release()
    writer.release()


def generate_base64(camera_id, fps):
    sleep_time = 1 / fps
    while True:
        # 3 kameranın görüntülerini al
        frame_bytes = ''
        frame = frames[camera_id]
        if frame is not None:
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            frame_bytes = f"data:image/jpeg;base64,{jpg_as_text}"
        
        # JSON formatında base64 veriyi döndür
        yield f"data: {frame_bytes}\n\n"
        time.sleep(sleep_time)  # Her döngüde biraz bekle

def generate(cam_id):
    while True:
        frame = frames[cam_id]
        if frame is None:
            time.sleep(0.01)
            continue
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/live-stream-mjpeg/<int:cam_id>')
def video(cam_id):
    print(f"Video stream for camera {cam_id} started.")
    return Response(generate(cam_id), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/live-stream-base64/<int:camera_id>/<int:fps>')
def video_base64(camera_id, fps):
    print(f"Base64 video stream for camera {fps} started.")
    return Response(generate_base64(camera_id, fps), mimetype='text/event-stream')

if __name__ == '__main__':
    ensure_output_folder()
    # Kameraları başlat
    for i in range(NUM_CAMERAS):
        cap = cv2.VideoCapture(i)
        cameras.append(cap)
        t = threading.Thread(target=camera_worker, args=(i, cap), daemon=True)
        t.start()
    app.run(host='0.0.0.0', port=5000)
