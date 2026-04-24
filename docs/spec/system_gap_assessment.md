# Trusted Code Intelligence System - Consolidated Gap Assessment

## 1. Purpose

Tai lieu nay tong hop:

- design brief cap chien luoc
- `docs/spec/spec_p0.md`
- codebase hien tai
- review bo sung ve cac architectural gaps

Muc tieu la tach ro:

- dau la **target architecture**
- dau la **current implementation**
- dau la **blocking decisions**
- dau la **roadmap uu tien**

Tai lieu nay khong thay the `spec_p0.md`. No dong vai tro la ban danh gia thuc trang va de xuat thu tu thuc thi.

## 2. Source Set

- `docs/spec/spec_p0.md`
- `README.md`
- `src/core/types.ts`
- `src/core/graph/contracts.ts`
- `src/core/graph/query/GraphQueryEngine.ts`
- `src/pipeline/stages/04_buildGraph.ts`
- `src/pipeline/stages/06_verify.ts`
- `src/mcp/tools/*.ts`
- `src/pipeline/adapters/CSharpAdapter.ts`
- `src/pipeline/adapters/TSReactAdapter.ts`

## 3. Executive Summary

Codebase hien tai da co dung huong o muc foundation:

- local-first SQLite graph
- pipeline ro rang `01_sync -> 08_report`
- co `canonical/exploratory`, `provenance`, `GraphQueryEngine`, MCP/CLI/wiki surfaces
- co seed cho governance va authority edges

Nhung repo hien tai van o muc **pre-P0 foundation**, chua dat muc "trusted execution model for reasoning".

Ly do chinh:

1. graph semantics chua duoc encode va enforce dung theo spec
2. query boundary chua dong kin, vi nhieu tools van bypass `GraphQueryEngine`
3. builder hien tai dang collapse nhieu meaning vao cung mot lop `canonical`
4. validation, traversal policy, governance va explainability van con rat nong

Noi ngan gon:

> Vision va spec da tien xa hon implementation khoang 1 lop kien truc day du.

## 4. Target Architecture from Spec

Theo design brief va `spec_p0.md`, he thong huong toi:

- Graph la runtime truth, khong phai cache
- Fail-closed, khong du du lieu thi khong ket luan
- Canonical va exploratory phai duoc co lap ro rang
- Moi node/edge phai co provenance xac dinh
- Traversal phai policy-aware theo operation type
- AI chi la non-authoritative
- MCP, wiki, review, ask, impact phai dung chung trusted graph semantics

P0 spec cu the hoa bang:

- 4 graph layers: `canonical`, `derived`, `exploratory`, `external`
- edge taxonomy co semantics ro rang
- traversal rules rieng cho `impact`, `lineage`, `ask`, `wiki`
- hard-fail va soft-warning validation rules
- governance hooks cho authority chain, forbidden patterns, flow integrity

## 5. Current Codebase Reality

### 5.1 Diem da aligned

- Pipeline lifecycle map tot voi spec trong `src/pipeline/run.ts`
- Database schema du de mo rong them edge types vi `type` va `graph_kind` dang la `TEXT`
- Co `provenance`, `graph_kind`, `confidence` trong runtime model va storage
- Co `GraphArtifactLoader` va `GraphQueryEngine` lam nen cho traversal authority
- Co seed authority edges trong `src/core/types.ts`
- Co NodeType registry gate trong `src/core/nodeTypeRegistry.ts` va validate stage

### 5.2 Diem chua aligned

- Runtime model hien chi co `canonical | exploratory`, chua co `derived | external`
- `confidence` hien dang la enum chu, khong phai score `0..1`
- Builder hien sinh ra graph rat nong, chu yeu tu `called_symbols`
- `GraphQueryEngine` chua enforce traversal policy theo edge type va mode
- Nhieu MCP/review/impact paths van doc `GraphDB` truc tiep
- Verify stage chua la validation engine dung nghia
- Wiki chi la snapshot summary, chua la explainability layer
- FE extraction van regex-based, chua support runtime graph sau

## 6. Confirmed Architectural Gaps

### Gap A - Graph model chua hop nhat

Hien co hai mo hinh graph song song:

- `src/core/types.ts` dung `graph_kind`, snake_case, runtime/storage-facing
- `src/core/graph/contracts.ts` dung `graphKind`, camelCase, sidecar-contract-facing

Day khong chi la style conflict. No cho thay repo chua chot:

- file nao la source of truth
- file nao la adapter/view contract
- semantics nao la official runtime semantics

Neu khong hop nhat, spec se tiep tuc drift va moi subsystem co the tu hieu graph theo cach khac nhau.

### Gap B - Confidence model conflict

Spec P0:

- `confidence: number // 0 -> 1`

Code hien tai:

- `'AUTHORITATIVE' | 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'`

Review bo sung dung khi coi day la conflict that su. Tuy nhien, khong nhat thiet phai giai bang cach chon mot trong hai cuc numeric hoac enum thuần.

Khuyen nghi kien truc:

- giu `confidence_band` de phuc vu policy fail-closed
- them `confidence_score?: number` neu can ranking/fine-grain

Neu phai chon mot thu duy nhat o P0, uu tien giu band semantics truoc, vi traversal/governance dang can trust classes ro rang hon la xac suat.

### Gap C - Graph layer semantics dang bi collapse

Spec can:

- `canonical`
- `derived`
- `exploratory`
- `external`

Code hien tai moi co:

- `canonical`
- `exploratory`

Nhung van de lon hon la so luong layers:

- `buildGraph` dang gan moi node thanh `graph_kind: 'canonical'`
- edge duoc build tu `called_symbols` lai de `graph_kind: 'canonical'` nhung `confidence: 'INFERRED'`

Dieu nay xung dot voi tinh than cua spec:

- inferred relations khong nen duoc xem la canonical truth
- `nodeTypeRegistry` da co khai niem `isCanonical`, nhung builder khong ton trong khai niem do

Day la semantic bug nen tang, khong chi la missing feature.

### Gap D - Edge taxonomy chua ton tai dung nghia

Spec P0 dinh nghia nhieu nhom edge:

- structural
- runtime
- entry/flow
- contract
- authority
- data flow
- exploratory

Code hien tai moi co mot tap nho va phan build thuc te chu yeu chi sinh `canonical_dependency`.

He qua:

- khong the enforce traversal rules co nghia
- impact analysis va lineage khong biet dang di qua loai quan he nao
- wiki va explainability khong the noi "vi sao co ket qua nay" theo semantics

Gap nay scope lon, nhung phan lon la additive. Van de la khong nen mo taxonomy qua rong truoc khi model va builder semantics duoc chot.

### Gap E - Query boundary chua duoc enforce

Spec va design brief yeu cau mot traversal chokepoint duy nhat.

Code hien tai co `GraphQueryEngine`, nhung nhieu tool van bypass truc tiep:

- `src/mcp/tools/graph.ts`
- `src/mcp/tools/search.ts`
- `src/mcp/tools/review.ts`
- `src/pipeline/impactReport.ts`

Vay nen ngay ca khi viet xong traversal policy table, he thong van chua trusted neu khong buoc moi path di qua cung mot engine.

### Gap F - Traversal rules chua ton tai o muc he thong

`spec_p0.md` section 8 da chot:

- `impact` duoc phep di qua edge nao
- `lineage` duoc phep di qua edge nao
- `ask` co 3 mode
- `wiki` chi dung canonical + derived, exploratory chi annotate

Code hien tai:

- `reasoning-policy.ts` gan nhu placeholder
- `GraphQueryEngine` BFS tren edge index tong quat
- schema MCP co nhac toi `mode`, nhung handlers khong su dung that

Do do, traversal hom nay la graph traversal thong thuong, chua phai trust-aware traversal.

### Gap G - Validation va governance chua du manh

Spec can hard fail cho:

- node/edge thieu fields quan trong
- canonical thieu provenance
- invalid edge type

Va can governance hooks cho:

- authority chain
- forbidden pattern
- flow integrity

Code hien tai trong `06_verify.ts` moi kiem:

- co node/edge hay khong
- co golden flow theo ten hay khong
- process coverage
- artifact parity

Tuc la verify hien tai la health check, chua phai policy engine.

### Gap H - Explainability layer con rat mong

Spec coi wiki la explainability layer.

Code hien tai:

- generate 1 file `README.md` tong hop node/edge/domain/entrypoint
- MCP wiki page chi render metadata co ban cua node

Chua co:

- graph-linked navigation
- provenance display
- confidence display
- reverse traversal
- flow/entry/domain structure

### Gap I - Frontend/runtime extraction con nong

`CSharpAdapter` va parser C# kha on so voi mat bang hien tai.

Nhung `TSReactAdapter` van regex-based cho:

- route
- fetch/axios

Neu mo rong som sang edge taxonomy contract/flow phia frontend, can rat can than de tranh "illusion of precision" do heuristic qua nong.

## 7. Assessment of the Additional Review

Review bo sung co gia tri va bat trung 4 xung dot lon:

- confidence model conflict
- graph layer incompleteness
- naming inconsistency
- traversal policy missing

Danh gia tong hop:

- `Core conceptual model aligned`: dung mot phan, nhung hoi optimistic
- `confidence type conflict`: dung
- `graph_kind missing layers`: dung, nhung khong phai luc nao cung can DB migration ngay
- `naming conflict`: dung, va thuc chat la model duplication conflict
- `traversal rules missing`: dung, nhung can them y "DB bypass lam policy khong enforce duoc"
- `edge taxonomy additive`: dung, nhung parser scope lon hon nhin be ngoai
- `promotion rules` va `external layer` co the defer: dung

Phan can bo sung vao review do:

1. Builder semantics hien tai dang sai nghia canonical
2. Query chokepoint chua enforce la blocker lon hon `reasoning-policy.ts`
3. `nodeTypeRegistry.isCanonical` hien khong duoc ton trong trong builder

## 8. Prioritized Decisions

Thu tu quyet dinh de tranh refactor lap lai:

### Decision 1 - Chot runtime graph contract duy nhat

Can quyet:

- `src/core/types.ts` se la source of truth
- hay `src/core/graph/contracts.ts` se la source of truth

Khuyen nghi:

- chot 1 runtime contract trung tam
- neu can file con lai, bien no thanh adapter/view-model, khong duoc de 2 semantic models ngang hang

### Decision 2 - Chot confidence model

Khuyen nghi:

- `confidence_band`: `AUTHORITATIVE | EXTRACTED | INFERRED | AMBIGUOUS`
- `confidence_score?`: `number`

Neu can giai phap toi gian cho P0:

- giu enum band truoc
- defer score den khi can ranking/search/exploratory promotion

### Decision 3 - Chot graph layer semantics

Can quyet:

- `canonical` la gi
- `derived` la gi
- `exploratory` la gi
- `external` co defer duoc khong

Khuyen nghi:

- P0 bat buoc co `canonical`, `derived`, `exploratory`
- `external` co the model san trong schema/type nhung defer pipeline ghi thuc te

### Decision 4 - Chot edge taxonomy toi thieu cho P0

Khong nen implement ~30 edge types mot luc.

Nen chot bo toi thieu:

- `contains`
- `imports`
- `calls`
- `invokes`
- `dispatches_to`
- `entry_of`
- `belongs_to_flow`
- `precedes`
- `requests`
- `returns`
- `uses_authority`
- `node_uses_authority`
- `semantic_match`

Cac edge khac de sau khi parser/runtime model on dinh.

### Decision 5 - Chot trust model va output contract

Can quyet:

- operation nao duoc phep conclude
- operation nao phai fail-closed
- response nao bat buoc phai co trust status, warnings, provenance

Neu khong chot som:

- traversal policy khong co output semantics on dinh
- MCP/CLI/wiki moi noi tra mot kieu
- AI consumer khong biet khi nao duoc phep tin vao ket qua

## 8.1 Confidence, Status, and Trust Separation

Day la phan can tach ro de tranh lap lai conflict "numeric vs enum".

### A. Evidence confidence

Gan cho node/edge/fact.

Muc dich:

- do muc do tin cay cua bang chung hoac relation
- phuc vu graph semantics va promotion rules

Co the model bang:

- `confidence_band`
- `confidence_score?`

### B. Decision status

Gan cho operation nhu:

- ask
- impact
- lineage
- wiki
- governance

Muc dich:

- cho biet system co duoc phep ket luan hay khong

Nen dung bo trang thai on dinh:

- `OK`
- `AMBIGUOUS`
- `INSUFFICIENT_EVIDENCE`
- `EXPLORATORY_ONLY`
- `POLICY_VIOLATION`

### C. Response confidence

Gan cho `QueryResult`.

Muc dich:

- tom tat muc do chac chan cua toan bo cau tra loi

Vi du:

- `HIGH`
- `MEDIUM`
- `LOW`

Nguyen tac:

- khong duoc dung mot field `confidence` duy nhat de dong thoi bieu dien ca bang chung, quyet dinh va response summary

## 8.2 Derived Layer Semantics

`derived` la lop quan trong vi no noi giua parser truth va reasoning truth.

Can chot ro:

- `canonical`: facts/parser output deterministic tu source code
- `derived`: deterministic computation tu canonical graph
- `exploratory`: heuristic hoac AI-assisted relation
- `external`: user/AI feedback da duoc gate

### Rule de xuat

- `canonical` duoc dung cho moi operation authoritative
- `derived` duoc dung cho authoritative operation neu rule sinh derived da duoc approve
- `exploratory` khong duoc silently affect authoritative conclusion
- `external` khong duoc promotion neu chua qua validation/approval

### Vi du cho `derived`

- flow membership duoc suy ra deterministic tu canonical control-flow edges
- cluster/domain grouping duoc compute tu canonical graph theo rule co version
- authority chain summary duoc compute tu canonical + derived authority edges

### Boundary

`derived` khac `exploratory` o cho:

- co derivation rule ro rang
- co tinh lap lai deterministic
- co the audit lai bang input canonical

## 8.3 Standard Status and Error Codes

Can co bo ma on dinh de MCP/CLI/wiki/reporting su dung chung.

### Status codes

- `OK`
- `AMBIGUOUS`
- `INSUFFICIENT_EVIDENCE`
- `EXPLORATORY_ONLY`
- `PARTIAL`

### Error or warning codes

- `INSUFFICIENT_EVIDENCE`
- `EXPLORATORY_USED`
- `POLICY_VIOLATION`
- `TRAVERSAL_FORBIDDEN`
- `AUTHORITY_CHAIN_BROKEN`
- `INVALID_GRAPH_STATE`
- `INVALID_EDGE_TYPE`
- `CANONICAL_PROVENANCE_MISSING`
- `GRAPH_QUERY_TIMEOUT`
- `GRAPH_RESULT_TRUNCATED`

### Rule

- code phai on dinh giua cac surfaces
- user-facing wording co the khac, nhung machine-facing code phai giong nhau
- warnings khong duoc chi la free text

## 8.4 Query Output Contract Scope

Can chi ro surface nao bat buoc tra output contract.

### Bat buoc dung trust-aware contract

- MCP query tools
- MCP review/impact tools
- CLI `ask`
- CLI `impact`
- wiki generation inputs

### Co the dung view-model rieng

- wiki rendered markdown
- VS Code panels

Nhung source data cho cac view-model do van phai di tu trust-aware query/result contract.

### Rule

- khong tool nao duoc tra raw graph cho AI consumer ma khong co status, provenance, warnings
- raw graph chi nen dung noi bo cho storage/debug/admin workflows

## 8.5 Migration and Rollout Strategy

Vi day la refactor kien truc, can rollout co thu tu de tranh vo index va vo tooling.

### Breaking vs additive changes

#### Additive

- them edge types moi
- them status codes
- them `confidence_score`
- them graph layers moi neu schema da de `TEXT`

#### Breaking

- doi runtime contract trung tam
- doi y nghia cua `canonical`
- doi output shape cua MCP/CLI
- xoa DB bypass va bat buoc qua query engine

### Thu tu migrate de xuat

1. chot runtime contract
2. them fields/type support moi o storage va mapper
3. cap nhat builder semantics
4. cap nhat query engine + traversal policy
5. cap nhat MCP/CLI output contract
6. bo sung validation/governance rules
7. rebuild full graph/index

### Rebuild policy

Can full rebuild khi:

- doi graph layer semantics
- doi edge taxonomy canonical
- doi provenance model
- doi query result contract phu thuoc vao derived data moi

### Backfill policy

Khong nen co gang backfill graph cu neu:

- semantics cu khong tuong thich voi semantic moi

Trong truong hop do, uu tien:

- invalidation
- full rebuild
- regenerate wiki/report

## 8.6 Evaluation and Observability for Trust

Neu muon goi la trusted system, can do duoc trust behavior.

Nen co metric cho:

- query `OK`
- query `AMBIGUOUS`
- query `INSUFFICIENT_EVIDENCE`
- query co dung exploratory edges
- authority chain failures
- traversal policy violations
- graph validation hard-fails
- graph validation soft-warnings

Muc dich:

- kiem chung fail-closed co dang hoat dong that
- phat hien drift khi parser/edge taxonomy/query thay doi
- danh gia ty le ket qua authoritative thuc su

## 8.7 Definition of Done for Trust Engine

Ngoai DoD cua graph schema, can co DoD rieng cho reasoning layer.

Trust engine duoc xem la done khi:

- moi operation chinh tra ve status code on dinh
- moi ket qua co provenance va warnings ro rang
- khong con DB bypass cho reasoning paths
- exploratory khong the silently affect authoritative conclusion
- wiki chi render canonical + derived conclusion, exploratory chi annotate
- policy violations co machine-readable code
- co metric co ban de quan sat fail-closed behavior

## 9. Recommended Implementation Order

### Phase P0.1 - Model consolidation

Muc tieu:

- hop nhat graph contracts
- chot confidence model
- them `derived` vao runtime types
- de san `external` neu muon, nhung chua can pipeline support day du

Anh huong:

- `src/core/types.ts`
- `src/core/graph/contracts.ts`
- `src/storage/schema.sql`
- `src/storage/GraphDB.ts`

### Phase P0.2 - Builder semantics correction

Muc tieu:

- builder phai ton trong `isCanonical`
- khong duoc ghi inferred edge vao canonical layer
- tach canonical builder va derived/exploratory builder

Anh huong:

- `src/pipeline/stages/04_buildGraph.ts`
- `src/core/nodeTypeRegistry.ts`
- adapters/parsers phat sinh facts

### Phase P0.3 - Query chokepoint enforcement

Muc tieu:

- moi traversal va reasoning di qua `GraphQueryEngine`
- MCP tools, impact report, wiki, review khong doc `GraphDB` truc tiep cho logic reasoning nua

Anh huong:

- `src/core/graph/query/GraphQueryEngine.ts`
- `src/mcp/tools/query.ts`
- `src/mcp/tools/graph.ts`
- `src/mcp/tools/review.ts`
- `src/mcp/tools/wiki.ts`
- `src/pipeline/impactReport.ts`

### Phase P0.4 - Traversal + trust engine

Muc tieu:

- define edge allowlists/forbidden sets theo operation type
- support `authoritative`, `mixed_safe`, `exploratory`
- return warnings ro rang khi ket qua dung exploratory edge hoac khong du du lieu
- them decision status va output contract enforcement

Anh huong:

- `src/core/graph/reasoning/reasoning-policy.ts`
- `src/core/graph/query/GraphQueryEngine.ts`
- `src/mcp/schemas/index.ts`
- `src/mcp/tools/query.ts`
- `src/mcp/tools/review.ts`
- `src/cli/index.ts`

### Phase P0.5 - Validation engine

Muc tieu:

- hard fail cho invalid graph facts
- soft warnings cho low confidence/orphans/incomplete flows
- bat dau governance hooks co ban

Anh huong:

- `src/pipeline/stages/06_verify.ts`
- `src/pipeline/config.ts`

### Phase P0.6 - Wiki and explainability

Muc tieu:

- wiki dung canonical + derived
- exploratory chi annotate
- hien provenance, confidence, navigation, flow/domain structure

Anh huong:

- `src/pipeline/stages/07_wiki.ts`
- `src/mcp/tools/wiki.ts`

### Phase P0.7 - Edge taxonomy expansion

Muc tieu:

- nang parser/adapters theo edge taxonomy toi thieu da chot
- bat dau FE-BE mapping thuc su

Anh huong:

- `src/pipeline/adapters/CSharpAdapter.ts`
- `src/pipeline/adapters/TSReactAdapter.ts`
- `src/scanner/languages/csharp/CSharpParser.ts`

## 10. Spec-to-Code Map

| Spec area | Current module | Current state | Gap | Priority |
| --- | --- | --- | --- | --- |
| Graph layers | `src/core/types.ts`, `src/storage/schema.sql` | Partial | Thieu `derived`, `external` | P0 |
| Confidence model | `src/core/types.ts`, `src/storage/schema.sql`, query/render paths | Conflict | Enum vs numeric spec | P0 |
| Runtime contract | `src/core/types.ts`, `src/core/graph/contracts.ts` | Conflict | 2 models khong nhat quan | P0 |
| Node taxonomy | `src/core/nodeTypeRegistry.ts` | Narrow | Chua dat taxonomy P0 | P0 |
| Edge taxonomy | `src/core/types.ts`, `04_buildGraph.ts` | Very limited | Chua co semantic graph | P0 |
| Builder semantics | `src/pipeline/stages/04_buildGraph.ts` | Incorrect | Collapse inferred vao canonical | P0 |
| Query chokepoint | `GraphQueryEngine` + MCP tools | Violated | DB bypass | P0 |
| Traversal rules | `GraphQueryEngine`, `reasoning-policy.ts` | Missing | Chua policy-aware | P0 |
| Trust model | Query/reasoning/output surfaces | Missing | Chua co decision engine | P0 |
| Query output contract | MCP/CLI/wiki surfaces | Missing | Chua co trust-aware response shape | P0 |
| Flow classification | Query/reasoning/taxonomy | Missing | Dang de tron control/data/contract flow | P0 |
| Validation rules | `06_verify.ts` | Shallow | Chua la validation/governance engine | P0 |
| Ask engine | `src/cli/index.ts` | Missing | `ask` moi la lookup node | P1 |
| Impact reasoning | `impactReport.ts`, `ReasoningEngine.ts` | Shallow | BFS + heuristic | P1 |
| Wiki explainability | `07_wiki.ts`, `wiki.ts` | Snapshot | Chua graph-linked | P1 |
| FE-BE mapping | `TSReactAdapter.ts` | Weak | Regex-level only | P1 |
| Promotion rules | None | Missing | Co the defer | P2 |
| External feedback layer | None | Missing | Co the defer | P2 |
| VS Code usability / ops | extension + repo tooling | Weak | Co the defer sau core | P2 |

## 11. Final Position

Danh gia tong hop sau khi doc design brief, `spec_p0.md`, codebase va review bo sung:

- Repo dang di dung huong
- Spec P0 la huong kien truc hop ly
- Nhung implementation hien tai chua dat nguong de goi la trusted knowledge substrate

Nhan dinh chot:

> He thong hien tai la mot local graph prototype co foundation tot cho P0, nhung chua phai trusted execution model.

Neu chi duoc uu tien 3 viec dau tien, thi nen lam:

1. hop nhat graph contract
2. sua builder semantics va graph layers
3. enforce query chokepoint + traversal policy

Moi thu con lai se on dinh hon neu 3 nen tang nay duoc chot truoc.

## 12. Updated Final Statement

Positioning nen duoc hieu theo nghia sau:

> He thong nay khong chi la graph system.
> No la mot graph-backed, fail-closed deterministic reasoning system.

Graph van la substrate cot loi.
Nhung gia tri san pham that su den tu:

- trust decision model
- traversal policy
- failure semantics
- explainable output contract

Day la phan ngan AI hallucinate va bien graph thanh trusted knowledge substrate thay vi chi la data structure.
