"""Đồ thị tri thức cây thuốc (GS.TS. Đỗ Tất Lợi) - ứng dụng web Flask.

Máy chủ đọc trực tiếp tệp CSV (Head, Predicate, Tail) và trả về qua /api/edges.
Việc vẽ đồ thị, lọc, tìm đường đi k được thực hiện ngay trên trình duyệt.
"""
import csv
import os
import threading

from flask import Flask, jsonify, render_template

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Có thể đổi tệp dữ liệu bằng biến môi trường KG_FILE (đường dẫn tuyệt đối hoặc tương đối so với thư mục dự án).
KG_FILE = os.environ.get("KG_FILE", os.path.join("static", "data", "Edges.csv"))
KG_PATH = KG_FILE if os.path.isabs(KG_FILE) else os.path.join(BASE_DIR, KG_FILE)

app = Flask(__name__)

_lock = threading.Lock()
_cache = {"mtime": None, "edges": []}


def load_edges():
    """Đọc tệp CSV; chỉ đọc lại khi tệp thay đổi (so theo thời gian sửa)."""
    mtime = os.path.getmtime(KG_PATH)
    with _lock:
        if _cache["mtime"] != mtime:
            with open(KG_PATH, encoding="utf-8-sig", newline="") as f:
                _cache["edges"] = [
                    [row.get("Head") or "", row.get("Predicate") or "", row.get("Tail") or ""]
                    for row in csv.DictReader(f)
                ]
            _cache["mtime"] = mtime
        return _cache["edges"]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/edges")
def api_edges():
    try:
        edges = load_edges()
    except (OSError, KeyError, csv.Error) as exc:
        return jsonify(error=f"Không đọc được tệp KG: {exc}"), 500
    resp = jsonify(file=os.path.basename(KG_PATH), count=len(edges), edges=edges)
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.route("/healthz")
def healthz():
    return "ok"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
