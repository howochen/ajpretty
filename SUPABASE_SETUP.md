# Supabase 設置指南

本系統已整合 Supabase 作為後端資料庫，支援多租戶架構。

## 設置步驟

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 並註冊帳號
2. 建立新專案
3. 等待專案設置完成（約 2 分鐘）

### 2. 獲取 API 金鑰

1. 在 Supabase Dashboard 中，進入專案設定
2. 前往 `API` 頁面
3. 複製以下資訊：
   - Project URL
   - anon public key

### 3. 設置環境變數

1. 在專案根目錄建立 `.env` 檔案：
```bash
cp .env.example .env
```

2. 編輯 `.env` 檔案，填入您的 Supabase 資訊：
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TENANT_ID=default-tenant
```

### 4. 執行資料庫 Schema

1. 在 Supabase Dashboard 中，進入 `SQL Editor`
2. 建立新查詢
3. 複製 `supabase-schema.sql` 檔案的內容
4. 執行 SQL 查詢

這會建立以下資料表：
- `tenants` - 租戶資訊
- `services` - 服務項目
- `teachers` - 老師資訊
- `bookings` - 預約紀錄
- `availability` - 時段可用性

若是已經存在的專案，請另外在 SQL Editor 執行 `supabase-teacher-schedule.sql`。這會：

- 為老師增加描述與資歷欄位
- 為排班增加 `teacher_id`
- 將排班唯一鍵改為「租戶＋老師＋日期＋時間」
- 清除無法判定所屬老師的舊排班資料

完成 migration 後，再到網站的 `設定 → 管理者設定` 新增老師並設定各自的上班時段。

### 5. 啟用管理者會員註冊

管理者登入使用 Supabase Auth 的 Email / Password。請在 Supabase Dashboard：

1. 進入 `Authentication` → `Providers` → `Email`
2. 確認 Email provider 已啟用
3. 開發測試可暫時關閉 `Confirm email`，註冊後即可直接登入
4. 正式環境建議保持 Email confirmation 開啟，並在 `Authentication` → `URL Configuration` 設定網站 URL
5. 在 `Redirect URLs` 加入目前環境的完整網址：
   - 本機：`http://localhost:5173/ajpretty/admin/login`
   - 本機目前測試：`http://127.0.0.1:5174/admin/login`
   - 區網：`http://192.168.0.12:5173/ajpretty/admin/login`
   - 正式站：`https://你的網域/ajpretty/admin/login`

註冊頁會自動把驗證信導回目前瀏覽器的網址，因此本機開發時請使用：
`http://localhost:5173/ajpretty/admin/login`

登入頁中的「建立新的管理者會員」會建立 Supabase Auth 會員，成功登入後即可使用預約管理與工作室設定。

目前前台已隱藏管理者註冊入口。新增管理者請在 Supabase Dashboard 操作：

1. 進入 `Authentication` → `Users`
2. 按右上角 `Add user` → `Create new user`
3. 輸入管理者 Email 與密碼
4. 若要直接登入，可勾選 `Auto Confirm User`，不需等待驗證信
5. 建立後使用該 Email 與密碼登入網站的管理者登入頁

不要直接對 `auth.users` 執行 INSERT；Supabase Auth 會自行建立必要的加密密碼與欄位。若要標記管理者，建立使用者時可在 User metadata 加入：

```json
{
   "role": "admin",
   "tenant_subdomain": "default"
}
```

### 6. 收不到驗證信排查

1. 先檢查註冊頁是否顯示「註冊成功」。若顯示錯誤，查看瀏覽器 Console 與 Supabase Dashboard 的 Auth logs。
2. 檢查垃圾郵件、促銷內容與信箱搜尋結果，搜尋寄件者或 `Supabase`。
3. 到 `Authentication` → `Users` 確認該 Email 是否已建立。若已建立，可在登入頁輸入同一 Email 後按「重新寄送驗證信」。
4. 開發測試請確認 Supabase Email provider 已啟用。Supabase 預設 SMTP 通常只寄送給專案 team members；其他收件者需設定自訂 SMTP。
5. 確認 `Authentication` → `URL Configuration` 的 Redirect URLs 包含：
   `http://localhost:5173/ajpretty/admin/login`
6. 本機瀏覽器必須使用 `http://localhost:5173/ajpretty/admin/login`，且 Vite 開發伺服器仍在執行。已寄出的舊信不會自動更新網址，請重新寄送。
7. Supabase 會限制驗證信寄送頻率；若看到 `rate limit` 或 `For security purposes, you can only request this after ...`，請等待提示時間後再按一次。前端無法繞過這項限制。
8. 若需要穩定寄送給一般信箱，請在 Supabase 設定自訂 SMTP；本機網址不會影響 Supabase 是否寄信。

補充：`localhost` 或 `127.0.0.1` 只負責接收驗證完成後的回跳頁，不負責寄信。寄信由 Supabase Auth 的 SMTP 服務負責；若註冊成功但收不到信，優先檢查 SMTP、Email provider、Auth logs 與垃圾郵件。

### 7. 驗證信連結指向 Supabase Dashboard

如果收到的信件連結類似：
`https://supabase.com/dashboard/project/.../auth/templates/{{ .ConfirmationURL }}`

表示 Confirmation email 範本設定錯誤。請到 Supabase Dashboard：

1. `Authentication` → `Email Templates` → `Confirm signup`
2. 將按鈕連結或 HTML `href` 設為 `{{ .ConfirmationURL }}`
3. 不要把 `{{ .ConfirmationURL }}` 放在 `https://supabase.com/dashboard/...` 後面
4. 儲存後刪除舊測試會員，再重新註冊取得新驗證信

正確範例：

```html
<a href="{{ .ConfirmationURL }}">Confirm email address</a>
```

`{{ .ConfirmationURL }}` 會由 Supabase 自動產生真正的驗證網址，驗證完成後再回到應用程式設定的 `emailRedirectTo`。

### 8. 啟動應用程式

```bash
npm install
npm run dev
```

## 系統功能

### 多租戶支援
- 每個租戶有獨立的資料隔離
- 透過 `tenant_id` 自動過濾資料
- 支援 Row Level Security (RLS)

### 預約系統
- 即時時段可用性檢查
- 自動更新預約狀態
- 取消預約自動釋放時段

### 租戶管理
- 訪問 `/settings` 頁面管理工作室設定
- 自訂品牌顏色
- 設定聯絡資訊
- 社群媒體連結

## 資料表結構

### tenants
```sql
- id (UUID, PK)
- name (VARCHAR)
- subdomain (VARCHAR, UNIQUE)
- primary_color (VARCHAR)
- secondary_color (VARCHAR)
- contact_phone (VARCHAR)
- contact_email (VARCHAR)
- line_id (VARCHAR)
- instagram_id (VARCHAR)
```

### services
```sql
- id (UUID, PK)
- tenant_id (UUID, FK)
- name (VARCHAR)
- category (VARCHAR)
- price (DECIMAL)
- duration (INTEGER)
```

### teachers
```sql
- id (UUID, PK)
- tenant_id (UUID, FK)
- name (VARCHAR)
- level (VARCHAR)
- extra_fee (DECIMAL)
```

### bookings
```sql
- id (UUID, PK)
- tenant_id (UUID, FK)
- service_id (UUID, FK)
- teacher_id (UUID, FK)
- user_name (VARCHAR)
- user_phone (VARCHAR)
- booking_date (DATE)
- booking_time (VARCHAR)
- status (VARCHAR)
```

### availability
```sql
- id (UUID, PK)
- tenant_id (UUID, FK)
- date (DATE)
- time (VARCHAR)
- is_available (BOOLEAN)
```

## 安全性

系統使用 Supabase Row Level Security (RLS) 確保：
- 每個租戶只能存取自己的資料
- 公開 API 金鑰無法存取其他租戶資料
- 所有查詢自動加入 `tenant_id` 過濾

## 擴展功能

### 新增租戶

在 SQL Editor 中執行：
```sql
INSERT INTO tenants (name, subdomain, primary_color, secondary_color, contact_phone, contact_email)
VALUES ('新工作室', 'new-studio', '#c9a86c', '#f5f0e8', '0912-345-678', 'contact@newstudio.com');
```

### 自訂服務項目

在 `/settings` 頁面或直接透過 SQL 新增：
```sql
INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '新服務', 'category', 1500, 60, '服務描述'
FROM tenants WHERE subdomain = 'new-studio';
```

## 故障排除

### 連接問題
- 確認 `.env` 檔案中的 URL 和 API 金鑰正確
- 檢查 Supabase 專案是否處於活躍狀態
- 確認網路連接正常

### 權限問題（42501 / RLS）
若出現 `new row violates row-level security policy for table "bookings"`：
1. 在 Supabase Dashboard → SQL Editor 執行 `supabase-fix-rls.sql`
2. 舊政策依賴 `current_setting('app.current_tenant')`，前端不會設定這個值，因此 INSERT 會被擋
3. 新政策改為：只要 `tenant_id` 對應到既有租戶即可寫入，應用程式仍會依目前租戶 UUID 過濾資料

### 資料未顯示
- 確認資料表中有資料
- 檢查 `tenant_id` 是否匹配
- 查看瀏覽器控制台錯誤訊息

## 成本

Supabase 免費方案包含：
- 500MB 資料庫儲存
- 50,000 MAU (月活躍使用者)
- 2GB 檔案儲存
- 無限 API 呼叫
- 即時同步
- 內建認證系統

對於小型工作室（10-50 個業者），免費方案完全足夠。

## 下一步

1. 設置 Supabase 專案
2. 執行資料庫 schema
3. 測試預約功能
4. 自訂工作室設定
5. 開始使用！
