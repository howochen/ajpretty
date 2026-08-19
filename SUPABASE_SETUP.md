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

### 5. 啟用管理者會員註冊

管理者登入使用 Supabase Auth 的 Email / Password。請在 Supabase Dashboard：

1. 進入 `Authentication` → `Providers` → `Email`
2. 確認 Email provider 已啟用
3. 開發測試可暫時關閉 `Confirm email`，註冊後即可直接登入
4. 正式環境建議保持 Email confirmation 開啟，並在 `Authentication` → `URL Configuration` 設定網站 URL

登入頁中的「建立新的管理者會員」會建立 Supabase Auth 會員，成功登入後即可使用預約管理與工作室設定。

### 6. 啟動應用程式

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
