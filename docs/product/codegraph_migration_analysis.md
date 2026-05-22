# Phân Tích Di Trú Tính Năng: CodeGraph ➔ Code-Review-Graph

Bản báo cáo này phân tích mã nguồn và đặc tả của dự án **CodeGraph** (trong [codegraph.md](file:///d:/projects/viet/code-review-graph/docs/product/codegraph.md)) để xác định các tính năng giá trị cao có thể tích hợp (migration) vào hệ thống **code-review-graph (CRG)** hiện tại theo đúng tôn chỉ phát triển trong [AGENTS.md](file:///d:/projects/viet/code-review-graph/AGENTS.md) và [SPEC.md](file:///d:/projects/viet/code-review-graph/SPEC.md).

---

## 1. So Sánh Tổng Quan Hai Hệ Thống

| Tiêu chí | Code-Review-Graph (CRG) | CodeGraph (Universal) |
| :--- | :--- | :--- |
| **Mục tiêu cốt lõi** | Phân tích tác động (impact/blast radius), kiểm tra luật quản trị hệ thống (governance), hỗ trợ Code Review dựa trên **Mô hình Lòng tin 4 Lớp (Trust-Aware Model)**. | Xây dựng đồ thị tri thức ngữ nghĩa (semantic knowledge graph) không đầu (headless), hiệu năng cao cho toàn bộ mã nguồn. |
| **Cơ chế Lòng tin** | **Rất nghiêm ngặt**: Phân tách rõ ràng Canonical ➔ Derived ➔ Exploratory ➔ External. Thực thi cơ chế Fail-Closed (INSUFFICIENT_EVIDENCE). | Không phân tầng lòng tin nghiêm ngặt; mặc định coi toàn bộ dữ liệu AST là chính xác và ngang hàng. |
| **Ngôn ngữ hỗ trợ** | C# (WASM Tree-Sitter) và TypeScript/React (TSX). Cấu hình (JSON, YAML, Terraform...). | **Đa ngôn ngữ đồ sộ (19+)**: C/C++, C#, Go, Java, Kotlin, Swift, Rust, Python, Ruby, Pascal, PHP, Scala, Dart, Vue, Svelte, Liquid... |
| **Frameworks** | ASP.NET Core (minimal API/controller actions) và React. | Express, NestJS, Laravel, Spring Boot, Django, FastAPI, Ruby on Rails, Cargo Workspace... |
| **Giao tiếp & Phân phối** | CLI (`crg`), MCP Server ( Claude stdio), VS Code Extension. | CLI (`codegraph`), MCP Server (stdio & HTTP/SSE), Clack Installer tiện ích. |
| **Tìm kiếm Ngữ nghĩa** | Chỉ có FTS5 (Full-Text Search) trên SQLite. Bảng `embeddings` đã có schema nhưng chưa triển khai thực tế. | **Hybrid Search**: FTS + Local Vector Embeddings sử dụng thư viện cục bộ (`nomic-embed-text` và `sqlite-vss`) không phụ thuộc API ngoài. |

---

## 2. Các Tính Năng Có Thể Di Trú Sang Code-Review-Graph

Sau khi phân tích sâu cấu trúc của CodeGraph, chúng tôi xác định được **4 nhóm tính năng đặc biệt xuất sắc** có thể tích hợp vào CRG nhằm gia tăng vượt bậc khả năng sử dụng thực tế (UX) và sức mạnh phân tích.

### Nhóm 1: Hệ thống Cài đặt & Tích hợp Tự động (`crg install`)
*   **Hiện trạng CRG**: Người dùng phải cấu hình thủ công tệp `claude_desktop_config.json` hoặc cấu hình Cursor để tích hợp MCP Server.
*   **Giải pháp từ CodeGraph**: Tệp [config-writer.ts](file:///d:/projects/viet/code-review-graph/docs/product/codegraph.md#L22890) và thư mục `src/installer/targets/` của CodeGraph triển khai một trình cài đặt tương tác cực kỳ thông minh sử dụng `@clack/prompts`:
    *   **Tự động phát hiện (Auto-detection)** các IDE và Client AI có mặt trên máy người dùng (Claude Desktop, Cursor, VS Code/Codex, OpenCode).
    *   **Cấu hình tự động ghi (Config Auto-write)**: Ghi trực tiếp các cấu hình MCP vào tệp cấu hình của client tương ứng.
    *   **Cơ chế ghi đè an toàn**: Kiểm tra sự tồn tại của cấu hình cũ để merge thông minh thay vì ghi đè phá hủy.
    *   **Tích hợp Tài liệu Hướng dẫn Cục bộ**: Tự động tạo tệp `CLAUDE.md` hoặc `.cursorrules` chứa các chỉ dẫn tối ưu cách AI gọi các tool đồ thị (ví dụ: khuyên AI dùng `codegraph_context` thay vì gọi đệ quy nhiều tệp tin).
*   **Đề xuất Di trú**: Porting toàn bộ module `installer/` của CodeGraph thành lệnh `crg install`.

### Nhóm 2: Thuật toán Tối ưu hóa Context & Token (Adaptive Context Explorer)
*   **Hiện trạng CRG**: `AgentContextBuilder` giới hạn cứng số lượng Node/Edge (max 20 nodes, max 40 edges) và nếu vượt quá sẽ cắt cụt dữ liệu (`GRAPH_RESULT_TRUNCATED`), dễ làm mất ngữ nghĩa quan trọng khi gửi cho LLM.
*   **Giải pháp từ CodeGraph**: Hàm `codegraph_explore` (dòng 24179) giải quyết bài toán token cực kỳ thông minh:
    *   **Gom cụm biểu tượng kề cận (Clustering)**: Sắp xếp các biểu tượng theo dòng bắt đầu trong tệp, sau đó gộp các phân đoạn mã nguồn gần nhau (dựa trên khoảng cách dòng cấu hình được) thay vì in toàn bộ tệp hoặc in vụn vặt.
    *   **Xếp hạng tầm quan trọng của Cụm (Importance Scoring)**: Tính toán điểm ưu tiên của từng cụm mã nguồn (Node là Entrypoint = 10đ, Node kết nối trực tiếp = 3đ, Node ngoại biên = 1đ).
    *   **Quản lý ngân sách Token động (Adaptive Budgeting)**: Tự động điều chỉnh kích thước ngữ nghĩa dựa trên quy mô của workspace (số lượng file nhỏ hơn 500 file thì in chi tiết, trên 15,000 file thì gom cụm chặt chẽ).
*   **Đề xuất Di trú**: Cải tiến `AgentContextBuilder` và lệnh `crg export` trong CRG để áp dụng thuật toán gom cụm thông minh này, giúp các AI Agent nhận được lượng ngữ cảnh code sạch nhất, tiết kiệm token nhất.

### Nhóm 3: Cấu trúc Bộ trích xuất Đa ngôn ngữ Thống nhất (`ILanguageParser`)
*   **Hiện trạng CRG**: Chỉ có bộ parser viết riêng cho C# và TypeScript. Việc mở rộng thêm ngôn ngữ mới đòi hỏi viết lại rất nhiều code adapter boilerplate.
*   **Giải pháp từ CodeGraph**: Sử dụng một thiết kế vô cùng thanh thoát:
    *   **`LanguageExtractor` interface chung** (tại `src/extraction/tree-sitter.ts`): Mỗi ngôn ngữ chỉ cần khai báo một file cấu hình định nghĩa các node type tương ứng của Tree-sitter (ví dụ: `functionTypes`, `classTypes`, `callTypes`) và cách lấy chữ ký hàm (signature), phạm vi truy cập (visibility) như tệp [typescript.ts](file:///d:/projects/viet/code-review-graph/docs/product/codegraph.md#L16989).
    *   Hệ thống lõi tự động chạy truy vấn Tree-sitter dựa trên cấu hình này để phân tích cú pháp và trích xuất quan hệ gọi hàm (`calledSymbols`), import/export.
*   **Đề xuất Di trú**: Tái cấu trúc phần `ILanguageParser` của CRG thành cấu trúc định cấu hình khai báo (declarative parser engine) của CodeGraph. Điều này giúp CRG dễ dàng mở rộng hỗ trợ cho Python, Rust, Go và Java chỉ bằng cách thêm file định nghĩa Tree-sitter tương tự mà không cần viết các parser class đồ sộ.

### Nhóm 4: Tìm kiếm Lai cục bộ (Hybrid Search & Local Embeddings)
*   **Hiện trạng CRG**: Mới chỉ hỗ trợ tìm kiếm từ khóa qua FTS5 ảo trên SQLite. Bảng `embeddings` đã tồn tại nhưng rỗng và chưa có luồng nạp hay truy vấn ngữ nghĩa thực tế.
*   **Giải pháp từ CodeGraph**:
    *   Tích hợp bộ mã hóa nhúng cục bộ (local embeddings) dùng `sqlite-vss` với mô hình gọn nhẹ `nomic-embed-text` không phụ thuộc vào bất kỳ API online nào (Zero network cost).
    *   Chạy tìm kiếm lai (Hybrid Search): Tìm kiếm ngữ nghĩa qua Vector Embedding để phát hiện các Node ứng viên phù hợp nhất ➔ Kéo rộng đồ thị (graph expansion) để lấy ngữ cảnh cấu trúc.
*   **Đề xuất Di trú**: Hiện thực hóa bảng `embeddings` của CRG bằng việc porting sqlite-vss adapter và cơ chế sinh vector của CodeGraph vào Stage `05c_build_exploratory.ts` (vì AI embeddings thuộc tầng exploratory theo quy định lòng tin).

---

## 3. Bản Đồ Di Trú Tính Năng (Migration Map)

Dưới đây là bảng phân loại các tính năng của CodeGraph đối với dự án Code-Review-Graph:

| Tính năng trong CodeGraph | Trạng thái đề xuất | Lý do / Cách tích hợp vào CRG |
| :--- | :--- | :--- |
| **`codegraph install` (Guided Installer)** | **DI TRÚ (MIGRATE)** | Rất khả thi. Tạo CLI command `crg install` giúp tăng mạnh UX. |
| **`codegraph_explore` (Adaptive Budgeting)** | **DI TRÚ (MIGRATE)** | Cần thiết để cải thiện chất lượng context của AI. Port thuật toán gom cụm vào `AgentContextBuilder.ts`. |
| **Universal Languages (19+ languages)** | **DI TRÚ THẢO LUẬN (MIGRATE - CHỌN LỌC)** | Tích hợp dần dần. Bắt đầu bằng việc áp dụng kiến trúc cấu hình parser đa ngôn ngữ, sau đó ưu tiên kéo Rust, Go, Python vào trước. |
| **Local Embeddings (sqlite-vss)** | **DI TRÚ (MIGRATE - OPTIONAL)** | Hiện thực hóa bảng `embeddings` rỗng hiện tại của CRG. Giữ nó là tùy chọn (optional) trong cấu hình để không làm chậm luồng build đồ thị mặc định. |
| **Git Hooks Auto-sync** | **ĐÃ CÓ TRONG CRG** | Cả hai dự án đều sử dụng cơ chế hash file kết hợp git hooks để cập nhật tăng dần đồ thị. |
| **MCP Server HTTP/SSE Transport** | **ĐỂ SAU (REFERENCE-ONLY)** | CRG hiện tại chạy rất ổn định qua stdio trong Claude Desktop. HTTP/SSE chỉ cần khi CRG được host dưới dạng daemon dịch vụ tập trung. |

---

## 4. Chiến Lược Tích Hợp An Toàn (Trust-First Strategy)

Theo tinh thần quyết định kiến trúc [0005-python-reference-migration-strategy.md](file:///d:/projects/viet/code-review-graph/docs/decisions/0005-python-reference-migration-strategy.md) và chính sách của [AGENTS.md](file:///d:/projects/viet/code-review-graph/AGENTS.md):
1.  **Bảo toàn chốt chặn lòng tin (Preserve Trust Gate)**: Bất kỳ thông tin nào được sinh ra từ các tính năng di trú (ví dụ: Vector Embeddings hay AI-inferred relationships từ các ngôn ngữ mới) chỉ được phép lưu vào tầng **Exploratory** hoặc **Derived** (với provenance rõ ràng). Cấm nâng cấp không kiểm soát lên tầng **Canonical**.
2.  **Giữ lõi CRG gọn nhẹ**: Các thư viện nặng như `sqlite-vss` hay tải mô hình AI cục bộ phải được cấu hình dưới dạng **Feature Flag** (ví dụ: `enable_embeddings: false` mặc định). Nếu môi trường người dùng thiếu thư viện nhúng hoặc WASM binding, CRG phải tự động fallback về FTS5 mà không gây sập chương trình.
3.  **Tích hợp từng bước**: Mỗi đợt di trú tính năng phải đi kèm với câu chuyện nghiệp vụ cụ thể (Story), các kịch bản kiểm thử tích hợp (Integration Tests) chạy trên các Fixtures kiểm thử hiện có (`fixtures/dotnet-mvc`, `fixtures/dotnet-minimal`).

---

*Báo cáo được chuẩn bị bởi Antigravity Coding Assistant. Mọi đề xuất di trú sẽ được chuyển hóa thành các Story tương ứng trong backlog để phê duyệt trước khi hiện thực.*
