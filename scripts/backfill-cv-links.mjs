#!/usr/bin/env node

/**
 * Ghi link "Đơn ứng tuyển" (trang in CV /ho-so/<record_id>) cho mọi hồ sơ
 * trong bảng "(NEW) Form tuyển dụng". Hồ sơ mới được ghi tự động lúc nộp
 * (src/lib/lark.ts); script này dành cho hồ sơ cũ, hoặc chạy lại sau khi đổi
 * CV_LINK_SECRET / SITE_URL.
 *
 * Chỉ động vào đúng MỘT cột "Đơn ứng tuyển" (kiểu URL) — tạo cột nếu chưa
 * có, không sửa cột nào khác. Chạy lại bao nhiêu lần cũng được: record nào
 * đã đúng link thì bỏ qua.
 *
 * Usage:
 *   node scripts/backfill-cv-links.mjs           # chạy thử, không ghi gì
 *   node scripts/backfill-cv-links.mjs --apply   # ghi thật
 *
 * Đọc biến môi trường từ .env.local. CV_LINK_SECRET phải GIỐNG HỆT giá trị
 * trên Vercel, nếu không mọi link ghi ra sẽ báo 404.
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const LINK_FIELD = "Đơn ứng tuyển";
const URL_FIELD_TYPE = 15;
const LARK = "https://open.larksuite.com/open-apis";

const fileEnv = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
const env = { ...fileEnv, ...process.env };
for (const k of ["LARK_APP_ID", "LARK_APP_SECRET", "LARK_BASE_APP_TOKEN", "LARK_TABLE_NAME_SALES", "CV_LINK_SECRET"]) {
  if (!env[k]) {
    console.error(`Thiếu biến ${k}`);
    process.exit(1);
  }
}
const SITE_URL = env.SITE_URL || "https://tuyendung.jimto.vn";

// Phải khớp y hệt sign()/buildCvUrl() trong src/lib/cv-link.ts.
function cvUrl(recordId) {
  const k = createHmac("sha256", env.CV_LINK_SECRET)
    .update(`cv:${recordId}`)
    .digest("base64url")
    .slice(0, 22);
  return `${SITE_URL}/ho-so/${recordId}?k=${k}`;
}

async function lark(path, token, init = {}) {
  const res = await fetch(`${LARK}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`${path}: ${data.msg} (code ${data.code})`);
  return data.data;
}

const auth = await (
  await fetch(`${LARK}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: env.LARK_APP_ID, app_secret: env.LARK_APP_SECRET }),
  })
).json();
if (!auth.tenant_access_token) throw new Error(`Lark auth failed: ${auth.msg}`);
const token = auth.tenant_access_token;
const base = `/bitable/v1/apps/${env.LARK_BASE_APP_TOKEN}`;

const tables = await lark(`${base}/tables?page_size=100`, token);
const table = tables.items.find((t) => t.name === env.LARK_TABLE_NAME_SALES);
if (!table) throw new Error(`Không thấy bảng "${env.LARK_TABLE_NAME_SALES}"`);
const tablePath = `${base}/tables/${table.table_id}`;

const fields = (await lark(`${tablePath}/fields?page_size=100`, token)).items;
const norm = (s) => s.trim().toLowerCase();
let linkField = fields.find((f) => norm(f.field_name) === norm(LINK_FIELD));
if (linkField && linkField.type !== URL_FIELD_TYPE) {
  throw new Error(`Cột "${linkField.field_name}" đã có nhưng không phải kiểu URL (type ${linkField.type}) — dừng, không ghi đè`);
}
if (!linkField) {
  console.log(`Cột "${LINK_FIELD}" chưa có → ${APPLY ? "tạo" : "sẽ tạo"} (kiểu URL)`);
  if (APPLY) {
    linkField = (
      await lark(`${tablePath}/fields`, token, {
        method: "POST",
        body: JSON.stringify({ field_name: LINK_FIELD, type: URL_FIELD_TYPE }),
      })
    ).field;
  }
}

const records = [];
let pageToken;
do {
  const q = new URLSearchParams({ page_size: "500" });
  if (pageToken) q.set("page_token", pageToken);
  const data = await lark(`${tablePath}/records?${q}`, token);
  records.push(...(data.items ?? []));
  pageToken = data.has_more ? data.page_token : undefined;
} while (pageToken);

const fieldName = linkField?.field_name ?? LINK_FIELD;
const todo = records.filter((r) => r.fields[fieldName]?.link !== cvUrl(r.record_id));
console.log(`${records.length} hồ sơ, ${todo.length} cần ghi link, ${records.length - todo.length} đã đúng`);

if (!APPLY) {
  for (const r of todo.slice(0, 3)) console.log(`  vd: ${r.record_id} → ${cvUrl(r.record_id)}`);
  console.log("Chạy thử xong — thêm --apply để ghi thật.");
  process.exit(0);
}

for (let i = 0; i < todo.length; i += 500) {
  const chunk = todo.slice(i, i + 500);
  await lark(`${tablePath}/records/batch_update`, token, {
    method: "POST",
    body: JSON.stringify({
      records: chunk.map((r) => ({
        record_id: r.record_id,
        fields: { [fieldName]: { link: cvUrl(r.record_id), text: "Xem đơn" } },
      })),
    }),
  });
  console.log(`  đã ghi ${i + chunk.length}/${todo.length}`);
}
console.log("Xong.");
