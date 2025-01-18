from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='../src')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'dashboard.html')

@app.route('/src/<path:path>')
def serve_src(path):
    return send_from_directory(app.static_folder, path)

@app.route('/img/<path:path>')
def serve_img(path):
    return send_from_directory('../img', path)

if __name__ == "__main__":
    app.run(debug=True)
