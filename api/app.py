# api/app.py
from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__)

@app.route('/')
def serve_index():
    return send_file('../src/dashboard.html')

@app.route('/src/<path:path>')
def serve_src(path):
    return send_file(f'../src/{path}')

@app.route('/img/<path:path>')
def serve_img(path):
    return send_file(f'../img/{path}')

if __name__ == '__main__':
    app.run(debug=True)