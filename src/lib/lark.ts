import { isSalesPositionTitle, SALES_STEP2_FIELDS } from "./sales-application-form";

const LARK_API_BASE = "https://open.larksuite.com/open-apis";

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface FieldInfo {
  name: string;
  type: number;
}

/** Lark field type code for Date/DateTime columns. */
const DATE_FIELD_TYPE = 5;

// Applications for this exact job title go to the dedicated sales-screening
// table (LARK_TABLE_NAME_SALES, "(NEW) Form tuyển dụng"); every other
// position goes to the shared HR sheet (LARK_TABLE_NAME_OTHER, "DATA TUYỂN
// DỤNG") instead, since that's the one recruiters already work from for
// every non-sales-floor role.

let cachedToken: CachedToken | null = null;
const tableIdCache = new Map<string, string>(); // table name -> table_id
const fieldsCache = new Map<string, FieldInfo[]>(); // table_id -> fields

async function getTenantAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  });
  const data = (await res.json()) as {
    code: number;
    msg: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Lark auth failed: ${data.msg} (code ${data.code})`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    // Refresh a couple of minutes early to be safe.
    expiresAt: Date.now() + (data.expire ?? 7200) * 1000 - 2 * 60 * 1000,
  };
  return cachedToken.token;
}

async function findTableId(token: string, tableName: string): Promise<string> {
  const cached = tableIdCache.get(tableName);
  if (cached) return cached;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { items?: { table_id: string; name: string }[] };
  };

  if (data.code !== 0) {
    throw new Error(`Lark list tables failed: ${data.msg} (code ${data.code})`);
  }

  const match = data.data?.items?.find((t) => t.name === tableName);
  if (!match) {
    const names = data.data?.items?.map((t) => t.name).join(", ") ?? "(không có bảng nào)";
    throw new Error(`Không tìm thấy bảng "${tableName}" trong Base. Các bảng hiện có: ${names}`);
  }

  tableIdCache.set(tableName, match.table_id);
  return match.table_id;
}

/** Normalizes a name for case/whitespace-insensitive matching. */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

async function getFields(token: string, tableId: string): Promise<FieldInfo[]> {
  const cached = fieldsCache.get(tableId);
  if (cached) return cached;

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields?page_size=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json()) as {
    code: number;
    data?: { items?: { field_name: string; type: number }[] };
  };

  const fields = (data.data?.items ?? []).map((f) => ({ name: f.field_name, type: f.type }));
  fieldsCache.set(tableId, fields);
  return fields;
}

function resolveFieldName(fields: FieldInfo[], expectedName: string): string {
  const match = fields.find((f) => normalize(f.name) === normalize(expectedName));
  if (!match) {
    throw new Error(
      `Không tìm thấy cột "${expectedName}" trong bảng. Các cột hiện có: ` +
        fields.map((f) => f.name).join(", "),
    );
  }
  return match.name;
}

/** Like resolveFieldName, but for optional columns — missing is fine. */
function tryResolveFieldName(fields: FieldInfo[], expectedName: string): string | null {
  return fields.find((f) => normalize(f.name) === normalize(expectedName))?.name ?? null;
}

async function uploadFileToLark(token: string, file: File): Promise<string> {
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  const form = new FormData();
  form.append("file_name", file.name);
  form.append("parent_type", "bitable_file");
  form.append("parent_node", appToken ?? "");
  form.append("size", String(file.size));
  form.append("file", file);

  const res = await fetch(`${LARK_API_BASE}/drive/v1/medias/upload_all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { file_token: string };
  };

  if (data.code !== 0 || !data.data?.file_token) {
    throw new Error(`Lark file upload failed: ${data.msg} (code ${data.code})`);
  }
  return data.data.file_token;
}

type RecordFields = Record<string, string | number | { file_token: string }[]>;

async function createRecord(
  token: string,
  tableId: string,
  fields: RecordFields,
): Promise<string> {
  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );
  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { record?: { record_id: string } };
  };
  if (data.code !== 0 || !data.data?.record?.record_id) {
    throw new Error(`Lark create record failed: ${data.msg} (code ${data.code})`);
  }
  return data.data.record.record_id;
}

// Best-effort write-back of the automated-outreach status onto a record —
// e.g. "Đã chào mừng" right after the CV-received message goes out, or
// "Đã hẹn phỏng vấn" once the interview-invite send succeeds. Two separate
// columns track the two channels ("Phản hồi Zalo" / "Phản hồi email") since
// a candidate only ever gets one or the other. Callers treat failures here
// as non-fatal (the actual email/Zalo send already happened; this is just
// bookkeeping for HR) and alert the ops group instead of throwing — see
// lark-alert.ts.
export async function writeBotResponseStatus(
  tableName: string,
  recordId: string,
  fieldLabel: string,
  status: string,
): Promise<void> {
  const token = await getTenantAccessToken();
  const tableId = await findTableId(token, tableName);
  const fields = await getFields(token, tableId);
  const fieldName = tryResolveFieldName(fields, fieldLabel);
  if (!fieldName) {
    throw new Error(`Không tìm thấy cột "${fieldLabel}" trong bảng "${tableName}"`);
  }

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  const res = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { [fieldName]: status } }),
    },
  );
  const data = (await res.json()) as { code: number; msg: string };
  if (data.code !== 0) {
    throw new Error(`Lark update record failed: ${data.msg} (code ${data.code})`);
  }
}

export interface ApplicationSubmission {
  name: string;
  phone: string;
  email: string;
  position: string;
  /** Candidate's preferred work location(s), when the posting spans more than one. */
  location?: string;
  /** "Nam" | "Nữ" — used to personalize outbound emails/Zalo (see email.ts). */
  gender?: string;
  cvFile?: File | null;
  /** Answers to SALES_STEP2_FIELDS, keyed by field key. Sales position only. */
  step2?: Record<string, string>;
}

// "(NEW) Form tuyển dụng" — the dedicated screening form for "Nhân viên tư
// vấn bán hàng". No email/CV column here by design (see SALES_STEP2_FIELDS
// for the long-form questionnaire columns, resolved leniently so a missing
// column just drops that one answer instead of failing the whole submit).
async function submitToSalesTable(token: string, submission: ApplicationSubmission) {
  const tableName = process.env.LARK_TABLE_NAME_SALES;
  if (!tableName) {
    throw new Error("LARK_TABLE_NAME_SALES is not configured");
  }
  const tableId = await findTableId(token, tableName);
  const fields = await getFields(token, tableId);

  const record: RecordFields = {
    [resolveFieldName(fields, "họ tên")]: submission.name,
    [resolveFieldName(fields, "số điện thoại liên hệ")]: submission.phone,
  };

  const positionField = tryResolveFieldName(fields, "vị trí ứng tuyển");
  if (positionField) {
    record[positionField] = submission.position;
  }

  if (submission.location) {
    const branchField = tryResolveFieldName(
      fields,
      "bạn mong muốn làm việc chi nhánh nào( dành cho vị trí tư vấn viên)",
    );
    const firstLocation = submission.location.split(",")[0]?.trim();
    if (branchField && firstLocation) {
      record[branchField] = firstLocation;
    }
  }

  for (const def of SALES_STEP2_FIELDS) {
    const value = submission.step2?.[def.key]?.trim();
    if (!value) continue;
    const larkFieldName = tryResolveFieldName(fields, def.key);
    if (!larkFieldName) continue;

    const larkField = fields.find((f) => f.name === larkFieldName);
    if (larkField?.type === DATE_FIELD_TYPE) {
      const ms = Date.parse(value);
      if (!Number.isNaN(ms)) record[larkFieldName] = ms;
    } else {
      record[larkFieldName] = value;
    }
  }

  // Đặt sẵn "Chưa bắt đầu" ngay khi tạo, để cột này luôn có nghĩa rõ ràng
  // (chưa liên hệ) thay vì trống không phân biệt được với "chưa chạy tính
  // năng" — ghi đè thành "Đã chào mừng" khi ứng viên thực sự nhắn Minh
  // Phương lần đầu (xem zalo-recruit-bot).
  const zaloStatusField = tryResolveFieldName(fields, "phản hồi Zalo");
  if (zaloStatusField) {
    record[zaloStatusField] = "Chưa bắt đầu";
  }

  await createRecord(token, tableId, record);
}

// "DATA TUYỂN DỤNG" — the shared HR sheet for every other position. Vị trí
// ứng tuyển and Vị trí làm việc are single-select columns; Lark auto-adds a
// new option the first time a value that doesn't exist yet is written, so
// new job titles/locations just work without any manual setup in Lark. Also
// the only table whose caller needs the new record's id back, for the
// "Phản hồi email" write-back.
async function submitToGeneralTable(
  token: string,
  submission: ApplicationSubmission,
): Promise<string> {
  const tableName = process.env.LARK_TABLE_NAME_OTHER;
  if (!tableName) {
    throw new Error("LARK_TABLE_NAME_OTHER is not configured");
  }
  const tableId = await findTableId(token, tableName);
  const fields = await getFields(token, tableId);

  const record: RecordFields = {
    [resolveFieldName(fields, "họ và tên")]: submission.name,
    [resolveFieldName(fields, "sđt")]: submission.phone,
    [resolveFieldName(fields, "email")]: submission.email,
    [resolveFieldName(fields, "vị trí ứng tuyển")]: submission.position,
  };

  const sourceField = tryResolveFieldName(fields, "nguồn");
  if (sourceField) {
    record[sourceField] = "Web";
  }

  if (submission.gender) {
    const genderField = tryResolveFieldName(fields, "giới tính");
    if (genderField) record[genderField] = submission.gender;
  }

  if (submission.location) {
    const locations = submission.location
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    const workLocationField = tryResolveFieldName(fields, "vị trí làm việc");
    if (workLocationField && locations[0]) {
      record[workLocationField] = locations[0];
    }
    const notesField = tryResolveFieldName(fields, "ghi chú");
    if (notesField) {
      record[notesField] = `Địa điểm mong muốn: ${submission.location}`;
    }
  }

  if (submission.cvFile && submission.cvFile.size > 0) {
    const fileToken = await uploadFileToLark(token, submission.cvFile);
    record[resolveFieldName(fields, "cv ứng viên")] = [{ file_token: fileToken }];
  }

  // Đặt sẵn "Chưa bắt đầu" ngay khi tạo — xem ghi chú tương tự ở
  // submitToSalesTable.
  const zaloStatusField = tryResolveFieldName(fields, "phản hồi Zalo");
  if (zaloStatusField) {
    record[zaloStatusField] = "Chưa bắt đầu";
  }

  return createRecord(token, tableId, record);
}

/** Strips everything but digits and drops a leading 84/0 so "0901234567",
 * "+84901234567" and "84 90 123 4567" all normalize the same way. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export interface ApplicationMatch {
  name: string;
  phone: string;
  /** "Nam" | "Nữ" | "" */
  gender: string;
  position: string;
  recordId: string;
  table: "sales" | "other";
}

async function findInTable(
  token: string,
  tableName: string,
  nameLabel: string,
  phoneLabel: string,
  target: string,
  table: "sales" | "other",
): Promise<ApplicationMatch | null> {
  const tableId = await findTableId(token, tableName);
  const fields = await getFields(token, tableId);
  const nameField = resolveFieldName(fields, nameLabel);
  const phoneField = resolveFieldName(fields, phoneLabel);
  const genderField = tryResolveFieldName(fields, "giới tính");
  const positionField = tryResolveFieldName(fields, "vị trí ứng tuyển");

  const appToken = process.env.LARK_BASE_APP_TOKEN;
  let pageToken: string | undefined;

  do {
    const url = new URL(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set("page_size", "100");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = (await res.json()) as {
      code: number;
      msg: string;
      data?: {
        items?: { record_id: string; fields: Record<string, unknown> }[];
        has_more?: boolean;
        page_token?: string;
      };
    };
    if (data.code !== 0) {
      throw new Error(`Lark list records failed: ${data.msg} (code ${data.code})`);
    }

    for (const item of data.data?.items ?? []) {
      const rawPhone = item.fields[phoneField];
      const phoneStr = typeof rawPhone === "string" ? rawPhone : String(rawPhone ?? "");
      if (normalizePhone(phoneStr) === target) {
        const rawName = item.fields[nameField];
        const rawGender = genderField ? item.fields[genderField] : "";
        const rawPosition = positionField ? item.fields[positionField] : "";
        return {
          name: typeof rawName === "string" ? rawName : String(rawName ?? ""),
          phone: phoneStr,
          gender: typeof rawGender === "string" ? rawGender : "",
          position: typeof rawPosition === "string" ? rawPosition : String(rawPosition ?? ""),
          recordId: item.record_id,
          table,
        };
      }
    }

    pageToken = data.data?.has_more ? data.data?.page_token : undefined;
  } while (pageToken);

  return null;
}

// Looks up a candidate by phone number across BOTH application tables —
// used by the recruitment Zalo bot to recognize a candidate on their first
// inbound message (see ZALO_AUTOMATION.md). Every position messages
// Minh Phương now, not just sales, so a candidate could be sitting in
// either "(NEW) Form tuyển dụng" (sales screening) or "DATA TUYỂN DỤNG"
// (everyone else). Neither table has a stable webhook-friendly key other
// than phone, so this paginates and compares normalized digits rather than
// an exact-string filter, which would miss "0901234567" vs "+84901234567".
export async function findApplicationByPhone(phone: string): Promise<ApplicationMatch | null> {
  const target = normalizePhone(phone);
  if (!target) return null;

  const token = await getTenantAccessToken();

  const salesTableName = process.env.LARK_TABLE_NAME_SALES;
  if (salesTableName) {
    const match = await findInTable(
      token,
      salesTableName,
      "họ tên",
      "số điện thoại liên hệ",
      target,
      "sales",
    );
    if (match) return match;
  }

  const generalTableName = process.env.LARK_TABLE_NAME_OTHER;
  if (generalTableName) {
    const match = await findInTable(token, generalTableName, "họ và tên", "sđt", target, "other");
    if (match) return match;
  }

  return null;
}

/** Returns the new record's id in "DATA TUYỂN DỤNG" (for the "Phản hồi của
 * bot" write-back), or null for sales-position submissions — that table
 * has no such column. */
export async function submitApplicationToLark(
  submission: ApplicationSubmission,
): Promise<string | null> {
  const token = await getTenantAccessToken();
  const isSalesPosition = isSalesPositionTitle(submission.position);

  if (isSalesPosition) {
    await submitToSalesTable(token, submission);
    return null;
  }
  return submitToGeneralTable(token, submission);
}
