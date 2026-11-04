# Đồ thị tri thức cây thuốc – GS.TS. Đỗ Tất Lợi

Ứng dụng web (Flask) hiển thị đồ thị tri thức tạo từ cuốn sách *Những cây thuốc và vị thuốc Việt Nam*.
Máy chủ đọc trực tiếp tệp `static/data/Edges.csv`; việc lọc, vẽ node kề và tìm đường đi độ dài k chạy trên trình duyệt.

*Prof Happy AI Research Group, 2026*

## Cấu trúc thư mục

```
├── app.py                  # Flask: trang chủ, /api/edges (đọc CSV), /healthz
├── requirements.txt        # Flask, gunicorn
├── Procfile                # lệnh chạy kiểu Heroku/Railway
├── render.yaml             # (tùy chọn) cấu hình Blueprint cho Render
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    ├── js/app.js
    ├── img/SachCayThuocGSDoTatLoi.jpg
    └── data/Edges.csv      # dữ liệu: Head,Predicate,Tail (UTF-8)
```

## Chạy trên máy

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                   # mở http://localhost:5000
```

## Đưa lên GitHub

```bash
git init
git add .
git commit -m "Do thi tri thuc cay thuoc"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

`.gitignore` đã loại `venv/` và `__pycache__/` nên không bị đẩy lên.

## Triển khai trên Render

1. Vào <https://render.com> → **New** → **Web Service** → kết nối repo GitHub.
2. Runtime **Python 3**; **Build Command**: `pip install -r requirements.txt`; **Start Command**: `gunicorn app:app --timeout 60`.
3. Chọn gói **Free** → **Create Web Service**. Khi build xong, Render cấp địa chỉ dạng `https://<ten>.onrender.com`.

Hoặc dùng **New → Blueprint** và chọn repo: Render sẽ đọc `render.yaml`.
Lưu ý: Render không đọc `Procfile`, lệnh chạy lấy từ ô Start Command (hoặc `render.yaml`). Gói Free sẽ "ngủ" sau một thời gian không có truy cập, lần mở đầu có thể chậm vài chục giây.

## Cập nhật dữ liệu

Sửa `static/data/Edges.csv` rồi `git commit` + `git push`; Render tự triển khai lại.
Có thể dùng tệp khác bằng biến môi trường `KG_FILE` (ví dụ `KG_FILE=static/data/Edges_moi.csv`).

## Ghi chú

- Find k path: mặc định chỉ tìm các đường bắt đầu từ ô Source; bỏ tích "chỉ từ Source" để tìm trên toàn đồ thị (tối đa 5.000 đường hoặc 4 giây).
- Trong `Edges.csv` có 7 dòng để trống cột Predicate; nên kiểm tra lại dữ liệu gốc.
