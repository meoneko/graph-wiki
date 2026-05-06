# Code Review Graph (CRG) - VS Code Extension

VS Code Extension chính thức cho [Code Review Graph](https://github.com/example/code-review-graph) (CRG) - công cụ phân tích rủi ro và kiến trúc mã nguồn cục bộ (local-first).

Extension này giúp lập trình viên trực quan hóa sự phụ thuộc của code, đánh giá rủi ro trước khi commit, và theo dõi kiến trúc dự án ngay bên trong giao diện VS Code quen thuộc.

---

## 🚀 Các Tính Năng (MVP)

1. **Phân tích tác động (Blast Radius Visualizer)**
   - Click chuột phải vào file bất kỳ và chọn **`CRG: Show Blast Radius`**.
   - Hiển thị bản đồ tư duy trực quan (node & edges) cho thấy những thành phần nào sẽ bị ảnh hưởng nếu file hiện tại thay đổi.
   - Hỗ trợ cuộn, phóng to/thu nhỏ, kéo thả và double-click vào node để mở trực tiếp code.

2. **Đánh giá rủi ro khi thay đổi code (Active Diff Risk)**
   - Nút **`CRG: Analyze Changes Risk`** 🛡️ nằm ngay trong tab Source Control (Git).
   - Đánh giá mức độ rủi ro của những dòng code chưa được commit dựa trên dữ liệu từ CRG Core.
   - Báo cáo kết quả và gợi ý chi tiết qua thanh `Output Channel`.

3. **Trình khám phá Kiến trúc (Architecture Explorer)**
   - Tích hợp biểu tượng CRG riêng biệt bên thanh Activity Bar bên trái.
   - **Execution Flows**: Danh sách các luồng thực thi quan trọng của hệ thống (ví dụ: Create Order, Process Payment).
   - **Code Communities**: Danh sách các cụm file có tính gắn kết (cohesion) cao trong dự án.

4. **Quản lý Trạng thái Đồ thị (Graph Status)**
   - Theo dõi trạng thái của Graph (`Ready`, `Building`) ngay dưới thanh Status Bar.
   - Thao tác lệnh nhanh như Build lại Graph hoặc xem thông số cấu trúc Graph (số Nodes, Edges).

---

## 📦 Cách Cài Đặt (Install from VSIX)

Bạn có thể cài đặt extension thủ công từ file đóng gói `.vsix`.

1. Nhấn `Ctrl+Shift+X` (hoặc `Cmd+Shift+X` trên Mac) để mở tab **Extensions**.
2. Click vào biểu tượng `...` (Views and More Actions) ở góc phải phía trên của menu Extensions.
3. Chọn **Install from VSIX...**
4. Trỏ tới file `code-review-graph-vscode-extension-x.x.x.vsix` trên máy của bạn và cài đặt.

---

## 🛠️ Dành Cho Nhà Phát Triển (Development & Packaging)

Nếu bạn muốn đóng góp code hoặc tự đóng gói lại extension, làm theo các bước sau:

### Yêu cầu hệ thống
- **Node.js** (Phiên bản v18 trở lên)
- **VS Code** (Phiên bản >= 1.90.0)

### Cài đặt dependencies
Mở Terminal tại thư mục `packages/vscode-extension`:
```bash
npm install
```

### Chạy thử nghiệm nghiệm (Run / Debug)
1. Mở thư mục `packages/vscode-extension` bằng VS Code.
2. Nhấn phím `F5` để khởi chạy phiên bản **Extension Development Host**.
3. Một cửa sổ VS Code phụ sẽ mở ra. Bạn có thể test mọi tính năng tại cửa sổ này.

### Đóng gói thành bộ cài (.vsix)
Extension sử dụng công cụ `@vscode/vsce` của Microsoft để đóng gói.

```bash
# Cài đặt vsce nếu chưa có
npm install -g @vscode/vsce

# Chạy lệnh build & package
npx @vscode/vsce package
```
Lệnh trên sẽ tự động bỏ qua các file nguồn (theo quy tắc trong `.vscodeignore`) và xuất ra một file có đuôi `.vsix` dùng để cài đặt.

---

*Powered by Code Review Graph Core.*
